import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, FileCheck, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Metrics {
  editaisAtivos: number;
  processosTotal: number;
  propostasEnviadas: number;
  propostasRascunho: number;
}

export default function Dashboard() {
  const { profile, role } = useAuth();
  const [metrics, setMetrics] = useState<Metrics>({ editaisAtivos: 0, processosTotal: 0, propostasEnviadas: 0, propostasRascunho: 0 });
  const [recentEditais, setRecentEditais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [editaisRes, processosRes, propostasRes, recentRes] = await Promise.all([
        supabase.from("editais").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("processos").select("id", { count: "exact", head: true }),
        supabase.from("propostas").select("id, status"),
        supabase.from("editais").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const propostas = propostasRes.data || [];
      setMetrics({
        editaisAtivos: editaisRes.count || 0,
        processosTotal: processosRes.count || 0,
        propostasEnviadas: propostas.filter((p) => p.status === "enviada").length,
        propostasRascunho: propostas.filter((p) => p.status === "rascunho").length,
      });
      setRecentEditais(recentRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const cards = [
    {
      title: "Editais Ativos",
      value: metrics.editaisAtivos,
      icon: FileText,
      description: "Licitações em andamento",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Processos Internos",
      value: metrics.processosTotal,
      icon: FolderOpen,
      description: "Total de processos criados",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Propostas Enviadas",
      value: metrics.propostasEnviadas,
      icon: FileCheck,
      description: "Propostas submetidas",
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      title: "Propostas Rascunho",
      value: metrics.propostasRascunho,
      icon: Clock,
      description: "Aguardando envio",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ativo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      encerrado: "bg-muted text-muted-foreground",
      suspenso: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
    return map[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Olá, {profile?.nome?.split(" ")[0] || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe o resumo das suas licitações</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? "—" : card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Editais Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEditais.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum edital cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEditais.map((edital) => (
                <div key={edital.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{edital.objeto}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {edital.orgao} • Nº {edital.numero}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`ml-3 ${statusBadge(edital.status)}`}>
                    {edital.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
