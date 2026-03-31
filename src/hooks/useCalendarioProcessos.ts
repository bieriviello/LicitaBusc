import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CalendarioProcesso {
  id: string;
  numero_interno: string;
  status: string;
  prazo: string | null;
  editais: {
    objeto: string;
    orgao: string;
  };
}

export function useCalendarioProcessos() {
  return useQuery({
    queryKey: ["calendario-processos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select("id, numero_interno, status, prazo, editais(objeto, orgao)")
        .not("prazo", "is", null);

      if (error) throw error;
      return (data as unknown as CalendarioProcesso[]) ?? [];
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}
