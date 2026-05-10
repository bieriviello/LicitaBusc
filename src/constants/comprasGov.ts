export const MODALIDADES_PNCP = {
    LEILAO_ELETRONICO: 1,
    DIALOGO_COMPETITIVO: 2,
    CONCURSO: 3,
    CONCORRENCIA_ELETRONICA: 4,
    CONCORRENCIA_PRESENCIAL: 5,
    PREGAO_ELETRONICO: 6,
    PREGAO_PRESENCIAL: 7,
    DISPENSA_LICITACAO: 8,
    INEXIGIBILIDADE: 9,
    MANIFESTACAO_INTERESSE: 10,
    PRE_QUALIFICACAO: 11,
    CREDENCIAMENTO: 12,
    LEILAO_PRESENCIAL: 13,
} as const;

export const MODALIDADES_LEGADO = {
    CONVITE: 1,
    TOMADA_PRECOS: 2,
    CONCORRENCIA: 3,
    CONCURSO: 4,
    PREGAO: 5,
    DISPENSA_LICITACAO: 6,
    INEXIGIBILIDADE: 7,
    CONCORRENCIA_INTERNACIONAL: 20,
} as const;

export const PORTAL_NAMES = {
    pncp: "PNCP",
    comprasgov: "Compras.gov Legado",
    pregao: "Pregões",
} as const;

export const SITUACAO_LABELS: Record<string, string> = {
    "Divulgada": "Divulgada",
    "Aberta": "Aberta",
    "Encerrada": "Encerrada",
    "Suspensa": "Suspensa",
    "Revogada": "Revogada",
    "Anulada": "Anulada",
};
