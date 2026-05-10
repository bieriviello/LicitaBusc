export interface Processo {
  id: string;
  edital_id: string;
  numero_interno: string;
  status: string;
  prazo: string | null;
  observacoes: string | null;
  created_at: string;
  editais?: {
    id: string;
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

// Re-exporta de constants/statuses.ts para manter backward compatibility
export { PROCESSO_STATUS_OPTIONS as STATUS_OPTIONS } from "@/constants/statuses";
