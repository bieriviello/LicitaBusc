import { useQuery } from "@tanstack/react-query";
import {
    buscarContratacoes,
    buscarLicitacoesLegado,
    buscarPregoes,
    buscarArquivosPncp,
    buscarItensPncp,
    buscarItensPncpPorDescricao,
    buscarRdc,
} from "@/integrations/comprasGov/comprasGovApi";
import type { 
    BaseEdital, 
    FiltrosContratacao, 
    FiltrosLicitacaoLegado, 
    FiltrosPregao,
    ComprasGovItemContratacao,
    ComprasGovRdc,
    ComprasGovPregao,
    ComprasGovContratacao
} from "@/integrations/comprasGov/types";
import { 
    normalizeItemPncp, 
    normalizeContratacaoPncp, 
    normalizeRdc, 
    normalizePregao 
} from "@/integrations/comprasGov/normalizers";

// ===========================
// Hooks individuais
// ===========================

export function useContratacoes(filtros: FiltrosContratacao | null) {
    return useQuery({
        queryKey: ["contratacoes", filtros],
        queryFn: () => buscarContratacoes(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useLicitacoesLegado(filtros: FiltrosLicitacaoLegado | null) {
    return useQuery({
        queryKey: ["licitacoes-legado", filtros],
        queryFn: () => buscarLicitacoesLegado(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function usePregoes(filtros: FiltrosPregao | null) {
    return useQuery({
        queryKey: ["pregoes", filtros],
        queryFn: () => buscarPregoes(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

// ===========================
// Filtros unificados
// ===========================

export interface FiltrosUnificados {
    dataInicial: string;  // YYYY-MM-DD
    dataFinal: string;    // YYYY-MM-DD
    palavraChave?: string;
    uf?: string;
    cnpjOrgao?: string;
    pagina?: number;
}

// ===========================
// Busca principal — server-side para PNCP, cliente para pregão
// ===========================

async function buscarTodosPortais(filtros: FiltrosUnificados): Promise<{
    editais: BaseEdital[];
    totalPorPortal: { pncp: number; legado: number; pregao: number };
    erros: { pncp?: string; legado?: string; pregao?: string };
    totalRegistros: number;
    totalPaginas: number;
}> {
    const hoje = new Date();
    const sessentaDiasAtras = new Date(hoje);
    sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60);

    const temPalavraChave = !!filtros.palavraChave?.trim();
    const kw = filtros.palavraChave?.trim();

    // ─── Chamadas Paralelas ───
    
    const pncpPromise = temPalavraChave
        ? buscarItensPncpPorDescricao({
            pagina: filtros.pagina ?? 1,
            tamanhoPagina: 100,
            dataInclusaoPncpInicial: filtros.dataInicial,
            dataInclusaoPncpFinal: filtros.dataFinal,
            orgaoEntidadeCnpj: filtros.cnpjOrgao,
          })
        : buscarContratacoes({
            pagina: filtros.pagina ?? 1,
            tamanhoPagina: 50,
            dataPublicacaoPncpInicial: filtros.dataInicial,
            dataPublicacaoPncpFinal: filtros.dataFinal,
            codigoModalidade: 6, // Pregão Eletrônico
            orgaoEntidadeCnpj: filtros.cnpjOrgao,
            unidadeOrgaoUfSigla: filtros.uf,
          });

    const legadoPromise = buscarRdc({
        pagina: filtros.pagina ?? 1,
        tamanhoPagina: 50,
        data_publicacao_min: filtros.dataInicial,
        data_publicacao_max: filtros.dataFinal,
        objeto: kw,
        uf_uasg: filtros.uf,
    });

    const pregaoPromise = buscarPregoes({
        pagina: filtros.pagina ?? 1,
        tamanhoPagina: 50,
        dt_data_edital_inicial: sessentaDiasAtras.toISOString().split("T")[0],
        dt_data_edital_final: hoje.toISOString().split("T")[0],
    });

    const [pncpResult, legadoResult, pregaoResult] = await Promise.allSettled([
        pncpPromise,
        legadoPromise,
        pregaoPromise,
    ]);

    const erros: { pncp?: string; legado?: string; pregao?: string } = {};
    let pncpEditais: BaseEdital[] = [];
    let legadoEditais: BaseEdital[] = [];
    let pregaoEditais: BaseEdital[] = [];
    let maxTotalPaginas = 1;
    let maxTotalRegistros = 0;

    // Processa PNCP
    if (pncpResult.status === "fulfilled") {
        const resp = pncpResult.value;
        const items = resp.resultado || [];
        if (resp.totalPaginas > maxTotalPaginas) maxTotalPaginas = resp.totalPaginas;
        if (resp.totalRegistros > maxTotalRegistros) maxTotalRegistros = resp.totalRegistros;
        if (temPalavraChave) {
            const termo = kw!.toLowerCase();
            const itemsContratacao = items as ComprasGovItemContratacao[];
            const filtrados = itemsContratacao.filter(i =>
                (i.descricaoResumida || "").toLowerCase().includes(termo) ||
                (i.descricaodetalhada || "").toLowerCase().includes(termo) ||
                (i.objetoCompra || "").toLowerCase().includes(termo) ||
                (i.orgaoEntidadeRazaoSocial || "").toLowerCase().includes(termo) ||
                (i.unidadeOrgaoNomeUnidade || "").toLowerCase().includes(termo)
            );
            pncpEditais = filtrados.map(normalizeItemPncp);
        } else {
            const contratacoes = items as ComprasGovContratacao[];
            pncpEditais = contratacoes.map(normalizeContratacaoPncp);
        }
    } else {
        erros.pncp = (pncpResult.reason as Error)?.message || "Erro no PNCP";
    }

    // Processa RDC Legado
    if (legadoResult.status === "fulfilled") {
        const resp = legadoResult.value;
        const rdcResults = resp.resultado as ComprasGovRdc[];
        if (resp.totalPaginas > maxTotalPaginas) maxTotalPaginas = resp.totalPaginas;
        if (resp.totalRegistros > maxTotalRegistros) maxTotalRegistros = resp.totalRegistros;
        legadoEditais = (rdcResults || []).map(normalizeRdc);
    } else {
        erros.legado = (legadoResult.reason as Error)?.message || "Erro no Legado";
    }

    // Processa Pregões
    if (pregaoResult.status === "fulfilled") {
        const resp = pregaoResult.value;
        const agora = new Date();
        agora.setHours(0, 0, 0, 0);
        if (resp.totalPaginas > maxTotalPaginas) maxTotalPaginas = resp.totalPaginas;
        if (resp.totalRegistros > maxTotalRegistros) maxTotalRegistros = resp.totalRegistros;
        
        const results = resp.resultado as ComprasGovPregao[];
        let pregoes = (results || []).filter(p => {
            if (!p.dt_fim_proposta) return true;
            return new Date(p.dt_fim_proposta) >= agora;
        });

        if (temPalavraChave) {
            const termo = kw!.toLowerCase();
            pregoes = pregoes.filter(p =>
                (p.tx_objeto || "").toLowerCase().includes(termo) ||
                (p.no_ausg || "").toLowerCase().includes(termo) ||
                (p.no_orgao || "").toLowerCase().includes(termo)
            );
        }
        pregaoEditais = pregoes.map(normalizePregao);
    } else {
        erros.pregao = (pregaoResult.reason as Error)?.message || "Erro nos Pregões";
    }

    // Combina e ordena por data mais recente
    const todos = [...pncpEditais, ...legadoEditais, ...pregaoEditais].sort((a, b) => {
        const da = a.dataPublicacao ? new Date(a.dataPublicacao).getTime() : 0;
        const db = b.dataPublicacao ? new Date(b.dataPublicacao).getTime() : 0;
        return db - da;
    });

    return {
        editais: todos,
        totalPorPortal: {
            pncp: pncpEditais.length,
            legado: legadoEditais.length,
            pregao: pregaoEditais.length,
        },
        erros,
        totalRegistros: maxTotalRegistros,
        totalPaginas: maxTotalPaginas,
    };
}

export function useEditaisUnificados(filtros: FiltrosUnificados | null) {
    return useQuery({
        queryKey: ["editais-unificados", filtros],
        queryFn: () => buscarTodosPortais(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000,
        retry: 0,
    });
}

// ===========================
// Hooks utilitários
// ===========================

export function useArquivosPncp(cnpj: string | undefined, ano: number | undefined, sequencial: number | undefined, enabled: boolean) {
    return useQuery({
        queryKey: ["arquivos-pncp", cnpj, ano, sequencial],
        queryFn: () => buscarArquivosPncp(cnpj!, ano!, sequencial!),
        enabled: enabled && !!cnpj && !!ano && !!sequencial,
        staleTime: 15 * 60 * 1000,
        retry: 1,
    });
}

export function useItensPncp(cnpj: string | undefined, ano: number | undefined, sequencial: number | undefined, enabled: boolean) {
    return useQuery({
        queryKey: ["itens-pncp", cnpj, ano, sequencial],
        queryFn: () => buscarItensPncp(cnpj!, ano!, sequencial!),
        enabled: enabled && !!cnpj && !!ano && !!sequencial,
        staleTime: 15 * 60 * 1000,
        retry: 1,
    });
}
