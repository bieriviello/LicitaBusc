import type { 
    BaseEdital, 
    ComprasGovItemContratacao, 
    ComprasGovRdc, 
    ComprasGovPregao,
    ComprasGovContratacao
} from "./types";

/** Converte item de contratação PNCP (endpoint /2_consultarItens...) → BaseEdital */
export function normalizeItemPncp(item: ComprasGovItemContratacao): BaseEdital {
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
        raw: item as unknown as Record<string, unknown>,
    };
}

/** Converte Contratação PNCP Direta → BaseEdital */
export function normalizeContratacaoPncp(item: ComprasGovContratacao): BaseEdital {
    return {
        id: item.idCompra || item.numeroControlePNCP || "",
        objeto: item.objetoCompra || "Sem descrição",
        orgao: item.unidadeOrgaoNomeUnidade || item.orgaoEntidadeRazaoSocial || "",
        cnpj: item.orgaoEntidadeCnpj || "",
        modalidade: item.modalidadeNome || "",
        valor: item.valorTotalEstimado ?? null,
        dataPublicacao: item.dataPublicacaoPncp,
        dataAbertura: item.dataAberturaPropostaPncp ?? undefined,
        municipio: item.unidadeOrgaoMunicipioNome,
        uf: item.unidadeOrgaoUfSigla,
        portal: "pncp",
        numeroControle: item.numeroControlePNCP,
        processo: item.processo,
        raw: item as unknown as Record<string, unknown>,
    };
}

/** Converte RDC Legado → BaseEdital */
export function normalizeRdc(item: ComprasGovRdc): BaseEdital {
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
        raw: item as unknown as Record<string, unknown>,
    };
}

/** Converte Pregão Legado → BaseEdital */
export function normalizePregao(item: ComprasGovPregao): BaseEdital {
    return {
        id: item.id_compra || String(item.numero),
        objeto: item.tx_objeto || "Sem descrição",
        orgao: item.no_ausg || item.no_orgao || "",
        modalidade: item.ds_tipo_pregao || "Pregão",
        valor: item.vl_estimado_total ? parseFloat(item.vl_estimado_total) : null,
        dataPublicacao: item.dt_data_edital,
        dataAbertura: item.dt_inicio_proposta ?? undefined,
        portal: "pregao",
        raw: item as unknown as Record<string, unknown>,
    };
}
