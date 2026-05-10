import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Processo, Edital } from "@/types/processos";

export function useProcessos() {
  return useQuery({
    queryKey: ["processos"],
    queryFn: async () => {
      const { data: procData, error: procError } = await supabase
        .from("processos")
        .select(
          "*, editais(objeto, orgao, numero, status, raw_json), documentos(*), clientes(id, nome, cnpj), empresas(id, nome, cnpj, is_principal)"
        )
        .order("created_at", { ascending: false });

      if (procError) throw procError;

      const processos = procData as unknown as Processo[];

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

export interface CreateProcessoInput {
  numero_interno: string;
  status: string;
  edital_id?: string | null;
  orgao_nome?: string | null;
  cliente_id?: string | null;
  data_pregao?: string | null;
  hora_pregao?: string | null;
  portal_pregao?: string | null;
  empresa_id?: string | null;
  prazo?: string | null;
  observacoes?: string | null;
  itens?: {
    numero_item: number;
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_estimado: number;
  }[];
}

export function useCreateProcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProcessoInput) => {
      const { itens, ...processoData } = input;

      const { data: processo, error } = await supabase
        .from("processos")
        .insert([processoData])
        .select()
        .single();

      if (error) throw error;

      if (itens && itens.length > 0) {
        const itensParaInserir = itens.map((item) => ({
          processo_id: processo.id,
          numero_item: item.numero_item,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_estimado: item.valor_estimado,
          valor_proposta: 0,
        }));

        const { error: itensError } = await supabase
          .from("participacao_itens")
          .insert(itensParaInserir);

        if (itensError) throw itensError;
      }

      return processo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
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
