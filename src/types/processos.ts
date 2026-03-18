export interface Processo {
  id: string;
  edital_id: string;
  numero_interno: string;
  status: string;
  prazo: string | null;
  observacoes: string | null;
  created_at: string;
  editais?: {
    objeto: string;
    orgao: string;
    numero: string;
    status: string;
    raw_json: Record<string, unknown>;
  };
  participacao_itens?: { count: number }[];
  checklist?: { id: string; label: string; completed: boolean }[];
  documentos?: { id: string; nome: string; url: string; created_at: string }[];
}

export interface Edital {
  id: string;
  numero: string;
  objeto: string;
  orgao: string;
}

export interface ParticipacaoItem {
  id?: string;
  numero_item: number;
  descricao: string;
  valor_estimado: number;
  valor_proposta: number;
  quantidade: number;
  unidade: string;
}

export const STATUS_OPTIONS = [
  { value: "triagem", label: "Triagem", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400" },
  { value: "analise_tecnica", label: "Análise Técnica", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "montagem_documentacao", label: "Montagem Documentação", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { value: "proposta_enviada", label: "Proposta Enviada", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  { value: "disputa_lances", label: "Disputa/Lances", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "homologado", label: "Homologado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];
