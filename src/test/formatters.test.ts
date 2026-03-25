import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, getSituacaoColor } from "@/lib/formatters";

describe("formatCurrency", () => {
  it("formata valor positivo em BRL", () => {
    const result = formatCurrency(1500.5);
    expect(result).toContain("1.500,50");
    expect(result).toContain("R$");
  });

  it("formata zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0,00");
  });

  it("retorna 'Não informado' para null", () => {
    expect(formatCurrency(null)).toBe("Não informado");
  });

  it("retorna 'Não informado' para undefined", () => {
    expect(formatCurrency(undefined)).toBe("Não informado");
  });

  it("formata valor grande corretamente", () => {
    const result = formatCurrency(1234567.89);
    expect(result).toContain("1.234.567,89");
  });

  it("formata valor negativo", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("500,00");
  });
});

describe("formatDate", () => {
  it("formata data ISO para dd/MM/yyyy", () => {
    // New Date("2025-03-15") é UTC, formatDate usa toLocaleDateString
    const result = formatDate("2025-03-15");
    expect(result).toMatch(/15\/03\/2025/);
  });

  it("retorna dash para null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("retorna dash para undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("retorna dash para string vazia", () => {
    expect(formatDate("")).toBe("—");
  });

  it("retorna a string original se a data for inválida", () => {
    expect(formatDate("data-invalida")).toBe("data-invalida");
  });

  it("formata datetime com timezone", () => {
    const result = formatDate("2024-12-25T10:30:00.000Z");
    expect(result).toMatch(/\d{2}\/12\/2024/);
  });
});

describe("getSituacaoColor", () => {
  it("retorna classes corretas para 'Divulgada'", () => {
    const result = getSituacaoColor("Divulgada");
    expect(result).toContain("bg-blue-100");
    expect(result).toContain("text-blue-700");
  });

  it("retorna classes corretas para 'Aberta'", () => {
    expect(getSituacaoColor("Aberta")).toContain("bg-emerald-100");
  });

  it("retorna classes corretas para 'Encerrada'", () => {
    expect(getSituacaoColor("Encerrada")).toContain("bg-muted");
  });

  it("retorna classes corretas para 'Suspensa'", () => {
    expect(getSituacaoColor("Suspensa")).toContain("bg-amber-100");
  });

  it("retorna classes corretas para 'Revogada'", () => {
    expect(getSituacaoColor("Revogada")).toContain("bg-red-100");
  });

  it("retorna classes corretas para 'Anulada'", () => {
    expect(getSituacaoColor("Anulada")).toContain("bg-red-100");
  });

  it("retorna fallback para situação desconhecida", () => {
    expect(getSituacaoColor("QualquerCoisa")).toBe("bg-muted text-muted-foreground");
  });
});
