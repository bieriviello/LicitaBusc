import type {
    ComprasGovResponse,
    ComprasGovContratacao,
    ComprasGovLicitacao,
    ComprasGovPregao,
    FiltrosContratacao,
    FiltrosLicitacaoLegado,
    FiltrosPregao,
    ComprasGovArquivo,
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
            searchParams.append(key, String(value));
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
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Erro desconhecido");
        throw new Error(`Erro na API Compras.gov.br (${response.status}): ${errorText}`);
    }

    return response.json();
}

// ===========================
// Contratações PNCP (Lei 14.133/2021)
// ===========================

export async function buscarContratacoes(
    filtros: FiltrosContratacao
): Promise<ComprasGovResponse<ComprasGovContratacao>> {
    return fetchApi<ComprasGovContratacao>(
        "/modulo-contratacoes/1_consultarContratacoes_PNCP_14133",
        {
            pagina: filtros.pagina ?? 1,
            tamanhoPagina: filtros.tamanhoPagina ?? 10,
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
            tamanhoPagina: filtros.tamanhoPagina ?? 10,
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
            tamanhoPagina: filtros.tamanhoPagina ?? 10,
            dt_data_edital_inicial: filtros.dt_data_edital_inicial,
            dt_data_edital_final: filtros.dt_data_edital_final,
            co_uasg: filtros.co_uasg,
            co_orgao: filtros.co_orgao,
            numero: filtros.numero,
            ds_tipo_pregao_compra: filtros.ds_tipo_pregao_compra,
        }
    );
}
