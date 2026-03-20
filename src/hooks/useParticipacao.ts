import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ParticipacaoItem {
  processo_id: string;
  numero_item: number;
  descricao: string;
  valor_estimado: number;
  valor_proposta: number;
  quantidade: number;
  unidade: string;
}

export function useParticipacao(processoId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch participacoes
  const { data: participacoes = [], isLoading: isLoadingParticipacoes } = useQuery({
    queryKey: ["participacoes", processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from("participacao_itens")
        .select("*")
        .eq("processo_id", processoId);
      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  // Mutation to save participacoes
  const saveParticipacoes = useMutation({
    mutationFn: async (items: ParticipacaoItem[]) => {
      if (!processoId) return;

      const numsSelecionados = items.map(s => s.numero_item);

      if (numsSelecionados.length > 0) {
        // Delete items NOT in the new list
        await supabase
          .from("participacao_itens")
          .delete()
          .eq("processo_id", processoId)
          .not("numero_item", "in", `(${numsSelecionados.join(',')})`);

        // Upsert new items
        const { error: upsertError } = await supabase
          .from("participacao_itens")
          .upsert(items, { onConflict: 'processo_id, numero_item' });

        if (upsertError) throw upsertError;
      } else {
        // Clear all if none selected
        await supabase
          .from("participacao_itens")
          .delete()
          .eq("processo_id", processoId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participacoes", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast({ title: "✅ Sucesso", description: "Participações atualizadas." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  });

  // Mutation to update checklist
  const updateChecklist = useMutation({
    mutationFn: async (checklist: { id: string; label: string; completed: boolean }[]) => {
      if (!processoId) return;
      const { error } = await supabase
        .from("processos")
        .update({ checklist })
        .eq("id", processoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar checklist", description: error.message, variant: "destructive" });
    }
  });

  return {
    participacoes,
    isLoadingParticipacoes,
    saveParticipacoes,
    updateChecklist
  };
}
