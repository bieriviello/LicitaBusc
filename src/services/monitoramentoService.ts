import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço de monitoramento de licitações.
 * 
 * NOTA: A lógica de verificação real de novos editais deve ser implementada
 * como uma Edge Function (cron job) no Supabase, que faz a busca nas APIs
 * do ComprasGov e cria notificações reais quando há matches.
 * 
 * Este serviço no frontend serve apenas para consultar e gerenciar
 * os monitoramentos existentes.
 */
export const monitoramentoService = {
  async getActiveMonitoramentos() {
    const { data, error } = await supabase
      .from("monitoramentos")
      .select("*")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async toggleAtivo(id: string, ativo: boolean) {
    const { error } = await supabase
      .from("monitoramentos")
      .update({ ativo })
      .eq("id", id);

    if (error) throw error;
  },
};
