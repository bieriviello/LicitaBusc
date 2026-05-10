import type {
    ComprasGovResponse,
    ComprasGovContratacao,
    ComprasGovLicitacao,
    ComprasGovPregao,
    FiltrosContratacao,
    FiltrosLicitacaoLegado,
    FiltrosPregao,
    ComprasGovArquivo,
    ComprasGovItem,
    FiltrosItensPncp,
    ComprasGovItemContratacao,
    FiltrosRdc,
    ComprasGovRdc,
} from "./types";

const BASE_URL = "/api/compras";

/**
 * Construtor genérico de query string a partir de um objeto de filtros.
 * Remove valores undefined/null/empty string.
 */
function buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
            let stringValue = String(value);
            // Se for CNPJ, removemos caracteres não numéricos.
            if (key.toLowerCase().includes("cnpj")) {
                stringValue = stringValue.replace(/\D/g, "");
            }
            searchParams.append(key, stringValue);
        }
    }
    return searchParams.toString();
}

/**
 * Fetch genérico com tratamento de erro.
 */
async function fetchApi<T>(path: string, params: Record<string, unknown>): Promise<ComprasGovResponse<T>> {
    const qs = buildQueryString(params);
    const url = `${BASE_URL}${path}?${qs}`;

    const response = await fetch(url, {
        headers: { 
            "Accept": "application/json, text/plain, */*",
        },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Erro desconhecido");
        const error = new Error(`Erro na API Compras.gov.br (${response.status}): ${errorText}`) as Error & { details: string };
        error.details = `URL: ${url} | Params: ${JSON.stringify(params)}`;
        throw error;
    }

    return response.json();
}

// ===========================
// Contratações PNCP (Lei 14.133/2021)
// Endpoint: 1_consultarContratacoes_PNCP_14133
// Suporta: datas, modalidade, CNPJ, UF — SEM busca por texto
// ===========================

export async function buscarContratacoes(
    filtros: FiltrosContratacao
): Promise<ComprasGovResponse<ComprasGovContratacao>> {
    return fetchApi<ComprasGovContratacao>(
        "/modulo-contratacoes/1_consultarContratacoes_PNCP_14133",
        {
            pagina: filtros.pagina ?? 1,
            tamanhoPagina: filtros.tamanhoPagina ?? 20,
            dataPublicacaoPncpInicial: filtros.dataPublicacaoPncpInicial,
            dataPublicacaoPncpFinal: filtros.dataPublicacaoPncpFinal,
            codigoModalidade: filtros.codigoModalidade,
            unidadeOrgaoCodigoUnidade: filtros.unidadeOrgaoCodigoUnidade,
            orgaoEntidadeCnpj: filtros.orgaoEntidadeCnpj,
            unidadeOrgaoUfSigla: filtros.unidadeOrgaoUfSigla,
            codigoOrgao: filtros.codigoOrgao,
        }
    );
}

// ===========================
// Itens de Contratações PNCP — busca por descrição do item
// Endpoint: 2_consultarItensContratacoes_PNCP_14133
// ===========================

export async function buscarItensPncpPorDescricao(
    filtros: FiltrosItensPncp
): Promise<ComprasGovResponse<ComprasGovItemContratacao>> {
    return fetchApi<ComprasGovItemContratacao>(
        "/modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133",
        {
            pagina: filtros.pagina ?? 1,
            tamanhoPagina: filtros.tamanhoPagina ?? 50,
            dataInclusaoPncpInicial: filtros.dataInclusaoPncpInicial,
            dataInclusaoPncpFinal: filtros.dataInclusaoPncpFinal,
            orgaoEntidadeCnpj: filtros.orgaoEntidadeCnpj,
            unidadeOrgaoCodigoUnidade: filtros.unidadeOrgaoCodigoUnidade,
            materialOuServico: filtros.materialOuServico,
        }
    );
}

// ===========================
// RDC Legado — tem parâmetro "objeto" para busca por texto
// Endpoint: 7_consultarRdc
// ===========================

export async function buscarRdc(
    filtros: FiltrosRdc
): Promise<ComprasGovResponse<ComprasGovRdc>> {
    return fetchApi<ComprasGovRdc>(
        "/modulo-legado/7_consultarRdc",
        {
            pagina: filtros.pagina ?? 1,
            tamanhoPagina: filtros.tamanhoPagina ?? 50,
            data_publicacao_min: filtros.data_publicacao_min,
            data_publicacao_max: filtros.data_publicacao_max,
            objeto: filtros.objeto,
            uasg: filtros.uasg,
            uf_uasg: filtros.uf_uasg,
            modalidade: filtros.modalidade,
            situacao_aviso: filtros.situacao_aviso,
        }
    );
}

// ===========================
// Arquivos PNCP (Download de Editais/Anexos)
// ===========================

export async function buscarArquivosPncp(
    cnpj: string,
    ano: number,
    sequencial: number
): Promise<ComprasGovArquivo[]> {
    const url = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos`;

    const response = await fetch(url, {
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        if (response.status === 404) return []; // Sem arquivos
        throw new Error(`Erro ao buscar arquivos PNCP (${response.status})`);
    }

    return response.json();
}

export async function buscarItensPncp(
    cnpj: string,
    ano: number,
    sequencial: number
): Promise<ComprasGovItem[]> {
    const url = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/itens?pagina=1&tamanhoPagina=100`;

    const response = await fetch(url, {
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Erro ao buscar itens PNCP (${response.status})`);
    }

    return response.json();
}

// ===========================
// Licitações Legado (Lei 8.666/1993)
// ===========================

export async function buscarLicitacoesLegado(
    filtros: FiltrosLicitacaoLegado
): Promise<ComprasGovResponse<ComprasGovLicitacao>> {
    return fetchApi<ComprasGovLicitacao>(
        "/modulo-legado/1_consultarLicitacao",
        {
            pagina: filtros.pagina ?? 1,
            tamanhoPagina: filtros.tamanhoPagina ?? 20,
            data_publicacao_inicial: filtros.data_publicacao_inicial,
            data_publicacao_final: filtros.data_publicacao_final,
            uasg: filtros.uasg,
            modalidade: filtros.modalidade,
            numero_aviso: filtros.numero_aviso,
        }
    );
}

// ===========================
// Pregões (Legado)
// ===========================

export async function buscarPregoes(
    filtros: FiltrosPregao
): Promise<ComprasGovResponse<ComprasGovPregao>> {
    return fetchApi<ComprasGovPregao>(
        "/modulo-legado/3_consultarPregoes",
        {
            pagina: filtros.pagina ?? 1,
            tamanhoPagina: filtros.tamanhoPagina ?? 20,
            dt_data_edital_inicial: filtros.dt_data_edital_inicial,
            dt_data_edital_final: filtros.dt_data_edital_final,
            co_uasg: filtros.co_uasg,
            co_orgao: filtros.co_orgao,
            numero: filtros.numero,
            ds_tipo_pregao_compra: filtros.ds_tipo_pregao_compra,
        }
    );
}
