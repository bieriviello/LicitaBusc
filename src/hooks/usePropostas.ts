import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePropostas() {
  return useQuery({
    queryKey: ["propostas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propostas")
        .select(`
          *,
          processos (
            numero_interno,
            editais (
              orgao,
              objeto
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (novaProposta: { processo_id: string; valor_total: number; impostos?: number; margem?: number; status?: string }) => {
      const { data, error } = await supabase
        .from("propostas")
        .insert([{
          processo_id: novaProposta.processo_id,
          valor_total: novaProposta.valor_total,
          impostos: novaProposta.impostos,
          margem: novaProposta.margem,
          status: novaProposta.status || "Rascunho"
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });
}

export function useUpdateProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; status?: string; valor_total?: number; impostos?: number; margem?: number }) => {
      const { data, error } = await supabase
        .from("propostas")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });
}

export function useDeleteProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("propostas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });
}

export function useProcessosDropdown() {
  return useQuery({
    queryKey: ["processos-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select(`
          id,
          numero_interno,
          editais (orgao, objeto)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
