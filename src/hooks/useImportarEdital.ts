import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { BaseEdital } from "@/integrations/comprasGov/types";
import type { Json } from "@/integrations/supabase/types";

export function useImportarEdital() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (edital: BaseEdital) => {
      // 1. Inserir edital no banco
      const { data: editalSalvo, error: insertError } = await supabase
        .from("editais")
        .insert({
          numero: edital.numeroControle || edital.id,
          orgao: edital.orgao,
          objeto: edital.objeto || "Sem descrição",
          data_abertura: edital.dataAbertura?.split("T")[0] || null,
          status: "ativo",
          raw_json: edital.raw as unknown as Json,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // 2. Criar processo vinculado
      const numeroInterno =
        edital.processo ||
        `PROC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

      const { error: procError } = await supabase.from("processos").insert({
        edital_id: editalSalvo.id,
        numero_interno: numeroInterno,
        status: "triagem",
        observacoes: `Importado de ${edital.portal.toUpperCase()}`,
      });

      if (procError) throw procError;

      return { editalId: editalSalvo.id, numeroInterno };
    },
    onSuccess: () => {
      toast({ title: "✅ Importação concluída!", description: "Edital e processo criados." });
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      queryClient.invalidateQueries({ queryKey: ["editais-dropdown"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      navigate("/processos");
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao importar",
        description: err.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });
}
