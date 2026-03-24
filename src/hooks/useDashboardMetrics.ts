import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PROCESSO_STATUS_MAP } from "@/constants/statuses";
import { parseISO, differenceInDays } from "date-fns";

// ===========================
// Types
// ===========================

export interface DashboardMetrics {
  editaisAtivos: number;
  processosTotal: number;
  propostasEnviadas: number;
  propostasRascunho: number;
}

export interface ProcessoStatusCount {
  name: string;
  value: number;
  color: string;
}

export interface PrazoUrgente {
  id: string;
  numero_interno: string;
  status: string;
  prazo: string;
  editais: {
    objeto: string;
    orgao: string;
  };
  diasRestantes: number;
}

export interface RecentEdital {
  id: string;
  objeto: string;
  orgao: string;
  numero: string;
  status: string;
}

interface PropostasRow {
  id: string;
  status: string;
}

interface ProcessoRow {
  id: string;
  status: string;
  prazo: string | null;
  numero_interno: string;
  editais: { objeto: string; orgao: string } | null;
}

// ===========================
// Hook: useDashboardMetrics
// ===========================

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const [editaisRes, processosRes, propostasRes, recentRes, allProcessosRes] = await Promise.all([
        supabase.from("editais").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("processos").select("id", { count: "exact", head: true }),
        supabase.from("propostas").select("id, status"),
        supabase.from("editais").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("processos").select("id, status, prazo, numero_interno, editais(objeto, orgao)").order("prazo", { ascending: true }),
      ]);

      // Métricas de contagem
      const propostas = (propostasRes.data || []) as PropostasRow[];
      const metrics: DashboardMetrics = {
        editaisAtivos: editaisRes.count || 0,
        processosTotal: processosRes.count || 0,
        propostasEnviadas: propostas.filter((p) => p.status === "enviada").length,
        propostasRascunho: propostas.filter((p) => p.status === "rascunho").length,
      };

      // Editais recentes
      const recentEditais = (recentRes.data as RecentEdital[]) || [];

      // Processos por status (para gráfico de barras)
      const allProcessos = (allProcessosRes.data || []) as ProcessoRow[];
      const counts: Record<string, number> = {};
      allProcessos.forEach((p) => {
        const s = String(p.status);
        counts[s] = (counts[s] || 0) + 1;
      });

      const processosPorStatus: ProcessoStatusCount[] = Object.entries(PROCESSO_STATUS_MAP)
        .map(([key, val]) => ({
          name: val.label,
          value: counts[key] || 0,
          color: val.chartColor,
        }))
        .filter((d) => d.value > 0);

      // Prazos urgentes (próximos 7 dias)
      const hoje = new Date();
      const prazosUrgentes: PrazoUrgente[] = allProcessos
        .filter((p) => p.prazo && !["homologado", "cancelado"].includes(String(p.status)))
        .map((p) => ({
          ...p,
          prazo: p.prazo!,
          editais: p.editais || { objeto: "", orgao: "" },
          diasRestantes: differenceInDays(parseISO(String(p.prazo)), hoje),
        }))
        .filter((p) => p.diasRestantes >= 0 && p.diasRestantes <= 7)
        .sort((a, b) => a.diasRestantes - b.diasRestantes)
        .slice(0, 5);

      return {
        metrics,
        recentEditais,
        processosPorStatus,
        prazosUrgentes,
      };
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}
