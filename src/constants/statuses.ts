/**
 * Fonte única de verdade para todos os status do sistema.
 * Use PROCESSO_STATUS_OPTIONS em selects/forms e PROCESSO_STATUS_MAP para lookups.
 */

// ===========================
// Status de Processos
// ===========================

export const PROCESSO_STATUS_OPTIONS = [
  { value: "triagem", label: "Triagem", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400", chartColor: "#94a3b8" },
  { value: "analise_tecnica", label: "Análise Técnica", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", chartColor: "#60a5fa" },
  { value: "montagem_documentacao", label: "Montagem Documentação", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", chartColor: "#818cf8" },
  { value: "proposta_enviada", label: "Proposta Enviada", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", chartColor: "#a78bfa" },
  { value: "disputa_lances", label: "Disputa/Lances", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", chartColor: "#fbbf24" },
  { value: "homologado", label: "Homologado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", chartColor: "#34d399" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", chartColor: "#f87171" },
] as const;

/** Mapa rápido { value → { label, color, chartColor } } para lookups O(1) */
export const PROCESSO_STATUS_MAP = Object.fromEntries(
  PROCESSO_STATUS_OPTIONS.map((s) => [s.value, { label: s.label, color: s.color, chartColor: s.chartColor }])
) as Record<string, { label: string; color: string; chartColor: string }>;

/** Retorna label + color para um dado status, com fallback */
export function getProcessoStatusBadge(status: string) {
  const entry = PROCESSO_STATUS_MAP[status];
  return entry
    ? { label: entry.label, color: entry.color }
    : { label: status, color: "bg-muted text-muted-foreground" };
}

// ===========================
// Status de Propostas
// ===========================

export const PROPOSTA_STATUS_OPTIONS = [
  { value: "Rascunho", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  { value: "Enviada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "Venceu", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { value: "Perdeu", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
] as const;

// ===========================
// Status de Editais
// ===========================

export const EDITAL_STATUS_BADGE: Record<string, string> = {
  ativo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  encerrado: "bg-muted text-muted-foreground",
  suspenso: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};
