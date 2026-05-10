import { describe, it, expect } from "vitest";
import {
  normalizeItemPncp,
  normalizeContratacaoPncp,
  normalizeRdc,
  normalizePregao,
} from "@/integrations/comprasGov/normalizers";
import type {
  ComprasGovItemContratacao,
  ComprasGovContratacao,
  ComprasGovRdc,
  ComprasGovPregao,
} from "@/integrations/comprasGov/types";

// ===========================
// normalizeItemPncp
// ===========================

describe("normalizeItemPncp", () => {
  const baseItem: ComprasGovItemContratacao = {
    idCompra: "id-compra-1",
    idCompraItem: "id-item-1",
    idContratacaoPNCP: "contratacao-1",
    unidadeOrgaoCodigoUnidade: "001",
    orgaoEntidadeCnpj: "12345678000190",
    numeroItemPncp: 1,
    descricaoResumida: "Material de escritório",
    materialOuServicoNome: "Material",
    unidadeMedida: "UN",
    quantidade: 100,
    valorUnitarioEstimado: 10,
    valorTotal: 1000,
    situacaoCompraItemNome: "Adjudicado",
    dataInclusaoPncp: "2025-03-15T10:00:00",
    dataAtualizacaoPncp: "2025-03-15T10:00:00",
    numeroControlePNCPCompra: "PNCP-2025-001",
    unidadeOrgaoNomeUnidade: "Secretaria de Educação",
    orgaoEntidadeRazaoSocial: "Prefeitura Municipal",
  };

  it("deve mapear campos básicos corretamente", () => {
    const result = normalizeItemPncp(baseItem);

    expect(result.id).toBe("id-item-1");
    expect(result.objeto).toBe("Material de escritório");
    expect(result.orgao).toBe("Secretaria de Educação");
    expect(result.cnpj).toBe("12345678000190");
    expect(result.modalidade).toBe("Material");
    expect(result.valor).toBe(1000);
    expect(result.portal).toBe("pncp");
    expect(result.numeroControle).toBe("PNCP-2025-001");
  });

  it("deve usar descricaodetalhada como fallback de objeto", () => {
    const item = { ...baseItem, descricaoResumida: "", descricaodetalhada: "Descrição detalhada do item" };
    const result = normalizeItemPncp(item);
    expect(result.objeto).toBe("Descrição detalhada do item");
  });

  it("deve usar objetoCompra como fallback de objeto", () => {
    const item = { ...baseItem, descricaoResumida: "", descricaodetalhada: "", objetoCompra: "Objeto compra" };
    const result = normalizeItemPncp(item);
    expect(result.objeto).toBe("Objeto compra");
  });

  it("deve retornar 'Sem descrição' quando nenhum texto disponível", () => {
    const item = { ...baseItem, descricaoResumida: "", descricaodetalhada: undefined, objetoCompra: undefined };
    const result = normalizeItemPncp(item);
    expect(result.objeto).toBe("Sem descrição");
  });

  it("deve usar orgaoEntidadeRazaoSocial como fallback de orgao", () => {
    const item = { ...baseItem, unidadeOrgaoNomeUnidade: undefined };
    const result = normalizeItemPncp(item);
    expect(result.orgao).toBe("Prefeitura Municipal");
  });

  it("deve usar CNPJ como último fallback de orgao", () => {
    const item = { ...baseItem, unidadeOrgaoNomeUnidade: undefined, orgaoEntidadeRazaoSocial: undefined };
    const result = normalizeItemPncp(item);
    expect(result.orgao).toBe("CNPJ 12345678000190");
  });

  it("deve preservar raw original", () => {
    const result = normalizeItemPncp(baseItem);
    expect(result.raw).toBeDefined();
  });

  it("deve usar idCompra como fallback de id", () => {
    const item = { ...baseItem, idCompraItem: "" };
    const result = normalizeItemPncp(item);
    expect(result.id).toBe("id-compra-1");
  });
});

// ===========================
// normalizeContratacaoPncp
// ===========================

describe("normalizeContratacaoPncp", () => {
  const baseContratacao: ComprasGovContratacao = {
    idCompra: "compra-1",
    numeroControlePNCP: "PNCP-001",
    anoCompraPncp: 2025,
    sequencialCompraPncp: 1,
    orgaoEntidadeCnpj: "98765432000155",
    orgaoEntidadeRazaoSocial: "Órgão Federal",
    orgaoSubrogadoRazaoSocial: null,
    unidadeOrgaoCodigoUnidade: "001",
    unidadeOrgaoNomeUnidade: "Setor de Compras",
    unidadeOrgaoUfSigla: "SP",
    unidadeOrgaoMunicipioNome: "São Paulo",
    unidadeOrgaoCodigoIbge: 3550308,
    numeroCompra: "PE-001/2025",
    modalidadeIdPncp: 6,
    codigoModalidade: 6,
    modalidadeNome: "Pregão Eletrônico",
    srp: false,
    modoDisputaIdPncp: 1,
    codigoModoDisputa: 1,
    modoDisputaNomePncp: "Aberto",
    amparoLegalCodigoPncp: 1,
    amparoLegalNome: "Lei 14.133/2021",
    amparoLegalDescricao: "",
    informacaoComplementar: null,
    processo: "PROC-2025-001",
    objetoCompra: "Aquisição de computadores",
    existeResultado: false,
    situacaoCompraIdPncp: 1,
    situacaoCompraNomePncp: "Divulgada",
    tipoInstrumentoConvocatorioCodigoPncp: 1,
    tipoInstrumentoConvocatorioNome: "Edital",
    valorTotalEstimado: 500000,
    valorTotalHomologado: null,
    dataInclusaoPncp: "2025-03-01",
    dataAtualizacaoPncp: "2025-03-10",
    dataPublicacaoPncp: "2025-03-01",
    dataAberturaPropostaPncp: "2025-03-20",
    dataEncerramentoPropostaPncp: null,
    contratacaoExcluida: false,
  };

  it("deve mapear campos de contratação corretamente", () => {
    const result = normalizeContratacaoPncp(baseContratacao);

    expect(result.id).toBe("compra-1");
    expect(result.objeto).toBe("Aquisição de computadores");
    expect(result.orgao).toBe("Setor de Compras");
    expect(result.cnpj).toBe("98765432000155");
    expect(result.modalidade).toBe("Pregão Eletrônico");
    expect(result.valor).toBe(500000);
    expect(result.portal).toBe("pncp");
    expect(result.dataPublicacao).toBe("2025-03-01");
    expect(result.dataAbertura).toBe("2025-03-20");
    expect(result.uf).toBe("SP");
    expect(result.municipio).toBe("São Paulo");
    expect(result.processo).toBe("PROC-2025-001");
  });

  it("deve tratar valor null", () => {
    const item = { ...baseContratacao, valorTotalEstimado: null };
    expect(normalizeContratacaoPncp(item).valor).toBeNull();
  });
});

// ===========================
// normalizeRdc
// ===========================

describe("normalizeRdc", () => {
  const baseRdc: ComprasGovRdc = {
    identificador: "RDC-001",
    numero_aviso: 12345,
    uasg: 160001,
    objeto: "Reforma do prédio principal",
    modalidade: 3,
    situacao_aviso: "Publicada",
    data_publicacao: "2025-02-15",
    data_abertura_proposta: "2025-03-01",
    data_entrega_proposta: "2025-03-10",
    uf_uasg: "RJ",
  };

  it("deve mapear campos do RDC corretamente", () => {
    const result = normalizeRdc(baseRdc);

    expect(result.id).toBe("RDC-001");
    expect(result.objeto).toBe("Reforma do prédio principal");
    expect(result.orgao).toBe("UASG 160001");
    expect(result.modalidade).toBe("3");
    expect(result.valor).toBeNull();
    expect(result.portal).toBe("comprasgov");
    expect(result.uf).toBe("RJ");
    expect(result.dataAbertura).toBe("2025-03-01");
    expect(result.link).toContain("RDC-001");
  });

  it("deve usar numero_aviso como fallback de id", () => {
    const item = { ...baseRdc, identificador: "" };
    const result = normalizeRdc(item);
    expect(result.id).toBe("12345");
  });

  it("deve retornar 'Sem descrição' se objeto vazio", () => {
    const item = { ...baseRdc, objeto: "" };
    expect(normalizeRdc(item).objeto).toBe("Sem descrição");
  });

  it("deve tratar data_abertura_proposta null", () => {
    const item = { ...baseRdc, data_abertura_proposta: null };
    expect(normalizeRdc(item).dataAbertura).toBeUndefined();
  });
});

// ===========================
// normalizePregao
// ===========================

describe("normalizePregao", () => {
  const basePregao: ComprasGovPregao = {
    id_compra: "pregao-001",
    co_processo: "PROC-001",
    co_uasg: 160001,
    no_ausg: "Base Aérea de Brasília",
    co_orgao: 52000,
    no_orgao: "Ministério da Defesa",
    numero: 42,
    ds_situacao_pregao: "Aberto",
    ds_tipo_pregao: "Eletrônico",
    ds_tipo_pregao_compra: "Material",
    tx_objeto: "Aquisição de material de consumo",
    vl_estimado_total: "150000.00",
    vl_homologado_total: null,
    dt_data_edital: "2025-03-01",
    dt_inicio_proposta: "2025-03-15",
    dt_fim_proposta: "2025-03-25",
    dt_alteracao: "2025-03-10",
    dt_encerramento: null,
    dt_resultado: null,
    pertence14133: false,
  };

  it("deve mapear campos do pregão corretamente", () => {
    const result = normalizePregao(basePregao);

    expect(result.id).toBe("pregao-001");
    expect(result.objeto).toBe("Aquisição de material de consumo");
    expect(result.orgao).toBe("Base Aérea de Brasília");
    expect(result.modalidade).toBe("Eletrônico");
    expect(result.valor).toBe(150000);
    expect(result.portal).toBe("pregao");
    expect(result.dataPublicacao).toBe("2025-03-01");
    expect(result.dataAbertura).toBe("2025-03-15");
  });

  it("deve converter vl_estimado_total string para number", () => {
    const result = normalizePregao(basePregao);
    expect(typeof result.valor).toBe("number");
    expect(result.valor).toBe(150000);
  });

  it("deve retornar null quando vl_estimado_total é null", () => {
    const item = { ...basePregao, vl_estimado_total: null };
    expect(normalizePregao(item).valor).toBeNull();
  });

  it("deve usar no_orgao como fallback de orgao", () => {
    const item = { ...basePregao, no_ausg: "" };
    expect(normalizePregao(item).orgao).toBe("Ministério da Defesa");
  });

  it("deve usar numero como fallback de id", () => {
    const item = { ...basePregao, id_compra: "" };
    expect(normalizePregao(item).id).toBe("42");
  });

  it("deve retornar 'Pregão' quando ds_tipo_pregao é vazio", () => {
    const item = { ...basePregao, ds_tipo_pregao: "" };
    expect(normalizePregao(item).modalidade).toBe("Pregão");
  });

  it("deve retornar 'Sem descrição' se tx_objeto vazio", () => {
    const item = { ...basePregao, tx_objeto: "" };
    expect(normalizePregao(item).objeto).toBe("Sem descrição");
  });
});
