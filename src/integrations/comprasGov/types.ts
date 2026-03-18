// ===========================
// Tipos da API Compras.gov.br
// ===========================

/** Resposta paginada genérica da API */
export interface ComprasGovResponse<T> {
    resultado: T[];
    totalRegistros: number;
    totalPaginas: number;
    paginasRestantes: number;
}

/** Contratação PNCP (Lei 14.133/2021) */
export interface ComprasGovContratacao {
    idCompra: string;
    numeroControlePNCP: string;
    anoCompraPncp: number;
    sequencialCompraPncp: number;
    orgaoEntidadeCnpj: string;
    orgaoEntidadeRazaoSocial: string;
    orgaoSubrogadoRazaoSocial: string | null;
    unidadeOrgaoCodigoUnidade: string;
    unidadeOrgaoNomeUnidade: string;
    unidadeOrgaoUfSigla: string;
    unidadeOrgaoMunicipioNome: string;
    unidadeOrgaoCodigoIbge: number | null;
    numeroCompra: string;
    modalidadeIdPncp: number;
    codigoModalidade: number;
    modalidadeNome: string;
    srp: boolean;
    modoDisputaIdPncp: number;
    codigoModoDisputa: number;
    modoDisputaNomePncp: string;
    amparoLegalCodigoPncp: number;
    amparoLegalNome: string;
    amparoLegalDescricao: string;
    informacaoComplementar: string | null;
    processo: string;
    objetoCompra: string;
    existeResultado: boolean;
    situacaoCompraIdPncp: number;
    situacaoCompraNomePncp: string;
    tipoInstrumentoConvocatorioCodigoPncp: number;
    tipoInstrumentoConvocatorioNome: string;
    valorTotalEstimado: number | null;
    valorTotalHomologado: number | null;
    dataInclusaoPncp: string;
    dataAtualizacaoPncp: string;
    dataPublicacaoPncp: string;
    dataAberturaPropostaPncp: string | null;
    dataEncerramentoPropostaPncp: string | null;
    contratacaoExcluida: boolean;
}

/** Licitação Legado (Lei 8.666/1993) */
export interface ComprasGovLicitacao {
    id_compra: string;
    identificador: string;
    numero_processo: string;
    uasg: number;
    modalidade: number;
    nome_modalidade: string;
    numero_aviso: number;
    situacao_aviso: string;
    tipo_pregao: string;
    tipo_recurso: string;
    nome_responsavel: string;
    funcao_responsavel: string;
    numero_itens: number;
    valor_estimado_total: number | null;
    valor_homologado_total: number | null;
    informacoes_gerais: string | null;
    objeto: string;
    endereco_entrega_edital: string | null;
    codigo_municipio_uasg: number;
    data_abertura_proposta: string | null;
    data_entrega_edital: string | null;
    data_entrega_proposta: string | null;
    data_publicacao: string;
    dt_alteracao: string;
    pertence14133: boolean;
}

/** Pregão (Legado) */
export interface ComprasGovPregao {
    id_compra: string;
    co_processo: string;
    co_uasg: number;
    no_ausg: string;
    co_orgao: number;
    no_orgao: string;
    numero: number;
    ds_situacao_pregao: string;
    ds_tipo_pregao: string;
    ds_tipo_pregao_compra: string;
    tx_objeto: string;
    vl_estimado_total: string | null;
    vl_homologado_total: string | null;
    dt_data_edital: string;
    dt_inicio_proposta: string | null;
    dt_fim_proposta: string | null;
    dt_alteracao: string;
    dt_encerramento: string | null;
    dt_resultado: string | null;
    pertence14133: boolean;
}

/** Interface unificada para exibição */
export interface BaseEdital {
    id: string;
    objeto: string;
    orgao: string;
    cnpj?: string;
    modalidade: string;
    valor: number | null;
    dataPublicacao: string;
    dataAbertura?: string;
    municipio?: string;
    uf?: string;
    portal: 'pncp' | 'comprasgov' | 'pregao';
    link?: string;
    numeroControle?: string;
    processo?: string;
    raw: Record<string, unknown>;
}

// ===========================
// Tipos de Arquivos PNCP
// ===========================

export interface ComprasGovArquivo {
    uri: string;
    url: string;
    titulo: string;
    tipoDocumentoNome: string;
    dataPublicacaoPncp: string;
}

export interface ComprasGovItem {
    numeroItem: number;
    descricao: string;
    quantidade: number;
    unidadeMedida: string;
    valorUnitarioEstimado: number;
    valorTotalEstimado: number;
    situacaoItemNome: string;
}

// ===========================
// Filtros de busca
// ===========================

export interface FiltrosContratacao {
    pagina?: number;
    tamanhoPagina?: number;
    dataPublicacaoPncpInicial: string; // YYYY-MM-DD
    dataPublicacaoPncpFinal: string;   // YYYY-MM-DD
    codigoModalidade: number;
    unidadeOrgaoCodigoUnidade?: string;
    orgaoEntidadeCnpj?: string;
    unidadeOrgaoUfSigla?: string;
    codigoOrgao?: number;
}

export interface FiltrosLicitacaoLegado {
    pagina?: number;
    tamanhoPagina?: number;
    data_publicacao_inicial: string; // YYYY-MM-DD
    data_publicacao_final: string;   // YYYY-MM-DD
    uasg?: number;
    modalidade?: number;
    numero_aviso?: number;
}

export interface FiltrosPregao {
    pagina?: number;
    tamanhoPagina?: number;
    dt_data_edital_inicial: string; // YYYY-MM-DD
    dt_data_edital_final: string;   // YYYY-MM-DD
    co_uasg?: number;
    co_orgao?: number;
    numero?: number;
    ds_tipo_pregao_compra?: string;
}

// ===========================
// Constantes de modalidades
// ===========================

export const MODALIDADES_PNCP = [
    { codigo: 1, nome: "Leilão - Eletrônico" },
    { codigo: 2, nome: "Diálogo Competitivo" },
    { codigo: 3, nome: "Concurso" },
    { codigo: 4, nome: "Concorrência - Eletrônica" },
    { codigo: 5, nome: "Concorrência - Presencial" },
    { codigo: 6, nome: "Pregão - Eletrônico" },
    { codigo: 7, nome: "Pregão - Presencial" },
    { codigo: 8, nome: "Dispensa de Licitação" },
    { codigo: 9, nome: "Inexigibilidade" },
    { codigo: 10, nome: "Manifestação de Interesse" },
    { codigo: 11, nome: "Pré-qualificação" },
    { codigo: 12, nome: "Credenciamento" },
    { codigo: 13, nome: "Leilão - Presencial" },
] as const;

export const MODALIDADES_LEGADO = [
    { codigo: 1, nome: "Convite" },
    { codigo: 2, nome: "Tomada de Preços" },
    { codigo: 3, nome: "Concorrência" },
    { codigo: 4, nome: "Concurso" },
    { codigo: 5, nome: "Pregão" },
    { codigo: 6, nome: "Dispensa de Licitação" },
    { codigo: 7, nome: "Inexigibilidade" },
    { codigo: 20, nome: "Concorrência Internacional" },
] as const;

export const UFS_BRASIL = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
