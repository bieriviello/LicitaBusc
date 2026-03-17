import { useQuery } from "@tanstack/react-query";
import {
    buscarContratacoes,
    buscarLicitacoesLegado,
    buscarPregoes,
    buscarArquivosPncp,
    buscarItensPncp,
    buscarItensPncpPorDescricao,
    buscarRdc,
    type ComprasGovItemContratacao,
} from "@/integrations/comprasGov/comprasGovApi";
import type { BaseEdital } from "@/integrations/comprasGov/types";

// ===========================
// Hooks individuais (mantidos para compatibilidade)
// ===========================

export function useContratacoes(filtros: any | null) {
    return useQuery({
        queryKey: ["contratacoes", filtros],
        queryFn: () => buscarContratacoes(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useLicitacoesLegado(filtros: any | null) {
    return useQuery({
        queryKey: ["licitacoes-legado", filtros],
        queryFn: () => buscarLicitacoesLegado(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function usePregoes(filtros: any | null) {
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
// Normalização
// ===========================

/** Converte item de contratação PNCP (endpoint /2_consultarItens...) → BaseEdital */
function normalizeItemPncp(item: ComprasGovItemContratacao): BaseEdital {
    return {
        id: item.idCompraItem || item.idCompra,
        objeto: item.descricaoResumida || item.descricaodetalhada || item.objetoCompra || "Sem descrição",
        orgao: item.unidadeOrgaoNomeUnidade || item.orgaoEntidadeRazaoSocial || `CNPJ ${item.orgaoEntidadeCnpj}`,
        cnpj: item.orgaoEntidadeCnpj,
        modalidade: item.materialOuServicoNome || "",
        valor: item.valorTotal ?? null,
        dataPublicacao: item.dataInclusaoPncp,
        dataAbertura: item.dataAberturaPropostaPncp ?? undefined,
        municipio: item.unidadeOrgaoMunicipioNome,
        uf: item.unidadeOrgaoUfSigla,
        portal: "pncp",
        numeroControle: item.numeroControlePNCPCompra,
        processo: item.processo,
        raw: item,
    };
}

/** Converte RDC Legado → BaseEdital */
function normalizeRdc(item: any): BaseEdital {
    return {
        id: item.identificador || String(item.numero_aviso),
        objeto: item.objeto || "Sem descrição",
        orgao: `UASG ${item.uasg}`,
        modalidade: String(item.modalidade || ""),
        valor: null,
        dataPublicacao: item.data_publicacao,
        dataAbertura: item.data_abertura_proposta ?? undefined,
        uf: item.uf_uasg,
        portal: "comprasgov",
        link: `https://comprasnet.gov.br/livre/Licitacoes/consulta_filtro.asp?identificador=${item.identificador}`,
        raw: item,
    };
}

/** Converte Pregão Legado → BaseEdital */
function normalizePregao(item: any): BaseEdital {
    return {
        id: item.id_compra || String(item.numero),
        objeto: item.tx_objeto || "Sem descrição",
        orgao: item.no_ausg || item.no_orgao || "",
        modalidade: item.ds_tipo_pregao || "Pregão",
        valor: item.vl_estimado_total ? parseFloat(item.vl_estimado_total) : null,
        dataPublicacao: item.dt_data_edital,
        dataAbertura: item.dt_inicio_proposta ?? undefined,
        portal: "pregao",
        raw: item,
    };
}

// ===========================
// Busca principal — server-side para PNCP, cliente para pregão
// ===========================

async function buscarTodosPortais(filtros: FiltrosUnificados): Promise<{
    editais: BaseEdital[];
    totalPorPortal: { pncp: number; legado: number; pregao: number };
    erros: { pncp?: string; legado?: string; pregao?: string };
}> {
    const hoje = new Date();
    const sessentaDiasAtras = new Date(hoje);
    sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60);

    const temPalavraChave = !!filtros.palavraChave?.trim();
    const kw = filtros.palavraChave?.trim();

    // ─── PNCP: usa endpoint de ITENS — busca dentro da descrição de cada item ───
    // O endpoint /2_consultarItens não tem filtro de texto, mas retorna "descricaoResumida"
    // e "descricaodetalhada" por item. Buscamos e filtramos no cliente apenas por esse campo.
    // Para sem palavra-chave, usamos o endpoint de contratações normal.
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

    // ─── RDC Legado: endpoint com parâmetro "objeto" — filtro server-side ───
    const legadoPromise = buscarRdc({
        pagina: filtros.pagina ?? 1,
        tamanhoPagina: 50,
        data_publicacao_min: filtros.dataInicial,
        data_publicacao_max: filtros.dataFinal,
        objeto: kw,           // ← filtro server-side no objeto da licitação
        uf_uasg: filtros.uf,
    });

    // ─── Pregões: sem filtro de texto na API — aplicamos client-side ───
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

    // Processa PNCP
    if (pncpResult.status === "fulfilled") {
        const items = pncpResult.value.resultado || [];
        if (temPalavraChave) {
            // Filtra itens por palavra-chave nas descrições
            const termo = kw!.toLowerCase();
            const filtrados = items.filter((i: any) =>
                (i.descricaoResumida || "").toLowerCase().includes(termo) ||
                (i.descricaodetalhada || "").toLowerCase().includes(termo) ||
                (i.objetoCompra || "").toLowerCase().includes(termo) ||
                (i.orgaoEntidadeRazaoSocial || "").toLowerCase().includes(termo) ||
                (i.unidadeOrgaoNomeUnidade || "").toLowerCase().includes(termo)
            );
            pncpEditais = filtrados.map(normalizeItemPncp);
        } else {
            pncpEditais = items.map((i: any) => ({
                id: i.idCompra || i.numeroControlePNCP,
                objeto: i.objetoCompra || "Sem descrição",
                orgao: i.unidadeOrgaoNomeUnidade || i.orgaoEntidadeRazaoSocial || "",
                cnpj: i.orgaoEntidadeCnpj,
                modalidade: i.modalidadeNome || "",
                valor: i.valorTotalEstimado ?? null,
                dataPublicacao: i.dataPublicacaoPncp,
                dataAbertura: i.dataAberturaPropostaPncp ?? undefined,
                municipio: i.unidadeOrgaoMunicipioNome,
                uf: i.unidadeOrgaoUfSigla,
                portal: "pncp" as const,
                numeroControle: i.numeroControlePNCP,
                processo: i.processo,
                raw: i,
            }));
        }
    } else {
        erros.pncp = (pncpResult.reason as Error)?.message || "Erro no PNCP";
    }

    // Processa RDC Legado
    if (legadoResult.status === "fulfilled") {
        legadoEditais = (legadoResult.value.resultado || []).map(normalizeRdc);
    } else {
        erros.legado = (legadoResult.reason as Error)?.message || "Erro no Legado";
    }

    // Processa Pregões — filtra vencidos E aplica palavra-chave client-side
    if (pregaoResult.status === "fulfilled") {
        const agora = new Date();
        agora.setHours(0, 0, 0, 0);
        let pregoes = (pregaoResult.value.resultado || []).filter((p: any) => {
            if (!p.dt_fim_proposta) return true;
            return new Date(p.dt_fim_proposta) >= agora;
        });
        // filtra por palavra-chave no objeto
        if (temPalavraChave) {
            const termo = kw!.toLowerCase();
            pregoes = pregoes.filter((p: any) =>
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
