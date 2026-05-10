export interface Processo {
  id: string;
  edital_id: string | null;
  numero_interno: string;
  status: string;
  prazo: string | null;
  observacoes: string | null;
  created_at: string;
  // Dados do pregão
  orgao_nome: string | null;
  cliente_id: string | null;
  data_pregao: string | null;
  hora_pregao: string | null;
  portal_pregao: string | null;
  empresa_id: string | null;
  // Relações
  editais?: {
    id: string;
    objeto: string;
    orgao: string;
    numero: string;
    status: string;
    raw_json: Record<string, unknown>;
  };
  clientes?: {
    id: string;
    nome: string;
    cnpj: string | null;
  } | null;
  empresas?: {
    id: string;
    nome: string;
    cnpj: string;
    is_principal: boolean;
  } | null;
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
