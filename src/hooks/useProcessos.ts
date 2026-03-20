import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Processo, Edital } from "@/types/processos";

export function useProcessos() {
  return useQuery({
    queryKey: ["processos"],
    queryFn: async () => {
      // 1. Fetch processos
      const { data: procData, error: procError } = await supabase
        .from("processos")
        .select("*, editais(objeto, orgao, numero, status, raw_json), documentos(*)")
        .order("created_at", { ascending: false });

      if (procError) throw procError;

      const processos = procData as unknown as Processo[];

      // 2. Fetch participacao counts (graceful fallback if table doesn't exist)
      try {
        const { data: countsData, error: countsError } = await supabase
          .from("participacao_itens")
          .select("processo_id");

        if (!countsError && countsData) {
          const countsMap: Record<string, number> = {};
          countsData.forEach((item) => {
            countsMap[item.processo_id] = (countsMap[item.processo_id] || 0) + 1;
          });

          return processos.map((p) => ({
            ...p,
            participacao_itens: countsMap[p.id] ? [{ count: countsMap[p.id] }] : [],
          }));
        }
      } catch (e) {
        console.warn("Tabela participacao_itens ainda não criada no banco.", e);
      }

      return processos;
    },
  });
}

export function useEditaisDropdown() {
  return useQuery({
    queryKey: ["editais-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("editais")
        .select("id, numero, objeto, orgao")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Edital[];
    },
  });
}

export function useCreateProcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (novoProcesso: {
      numero_interno: string;
      edital_id: string;
      status: string;
      prazo?: string | null;
      observacoes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("processos")
        .insert([novoProcesso])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
    },
  });
}

export function useUpdateProcessoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("processos")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["processos"] });
      const previousProcessos = queryClient.getQueryData<Processo[]>(["processos"]);

      if (previousProcessos) {
        queryClient.setQueryData<Processo[]>(["processos"], (old) =>
          old?.map((p) => (p.id === id ? { ...p, status } : p))
        );
      }

      return { previousProcessos };
    },
    onError: (err, variables, context) => {
      if (context?.previousProcessos) {
        queryClient.setQueryData(["processos"], context.previousProcessos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
    },
  });
}
