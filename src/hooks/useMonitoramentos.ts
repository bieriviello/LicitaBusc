import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Monitoramento = Database["public"]["Tables"]["monitoramentos"]["Row"];
type MonitoramentoInsert = Database["public"]["Tables"]["monitoramentos"]["Insert"];

export function useMonitoramentos() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const monitoramentosQuery = useQuery({
        queryKey: ["monitoramentos"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("monitoramentos")
                .select("*")
                .order("created_at", { ascending: false });
            
            if (error) throw error;
            return data as Monitoramento[];
        },
    });

    const saveMonitoramentoMutation = useMutation({
        mutationFn: async (newMonitoramento: MonitoramentoInsert) => {
            const { data, error } = await supabase
                .from("monitoramentos")
                .insert(newMonitoramento)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["monitoramentos"] });
            toast({ title: "Monitoramento salvo!", description: "Você será avisado sobre novos editais." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        },
    });

    const deleteMonitoramentoMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("monitoramentos")
                .delete()
                .eq("id", id);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["monitoramentos"] });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        },
    });

    return {
        monitoramentos: monitoramentosQuery.data ?? [],
        isLoading: monitoramentosQuery.isLoading,
        isError: monitoramentosQuery.isError,
        error: monitoramentosQuery.error,
        saveMonitoramento: saveMonitoramentoMutation.mutateAsync,
        deleteMonitoramento: deleteMonitoramentoMutation.mutateAsync,
        isSaving: saveMonitoramentoMutation.isPending,
        isDeleting: deleteMonitoramentoMutation.isPending,
    };
}
