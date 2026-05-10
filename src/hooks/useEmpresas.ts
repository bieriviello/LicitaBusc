import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  is_principal: boolean;
  created_at: string;
}

export function useEmpresas() {
  return useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("is_principal", { ascending: false })
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as Empresa[];
    },
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (empresa: { nome: string; cnpj: string; is_principal?: boolean }) => {
      const { data, error } = await supabase
        .from("empresas")
        .insert([empresa])
        .select()
        .single();
      if (error) throw error;
      return data as Empresa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}
