import { useAuth } from "@/hooks/useAuth";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { EDITAL_STATUS_BADGE } from "@/constants/statuses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, FileCheck, Clock, AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { profile } = useAuth();
  const { data, isLoading: loading } = useDashboardMetrics();

  const metrics = data?.metrics ?? {
    editaisAtivos: 0,
    processosTotal: 0,
    propostasEnviadas: 0,
    propostasRascunho: 0,
  };
  const recentEditais = data?.recentEditais ?? [];
  const processosPorStatus = data?.processosPorStatus ?? [];
  const prazosUrgentes = data?.prazosUrgentes ?? [];

  const metricsCards = [
    { title: "Editais Ativos",       value: metrics.editaisAtivos,      icon: FileText,  color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/30",     description: "Licitações em andamento" },
    { title: "Processos Internos",   value: metrics.processosTotal,     icon: FolderOpen,color: "text-emerald-600",bg: "bg-emerald-50 dark:bg-emerald-950/30",description: "Total de processos criados" },
    { title: "Propostas Enviadas",   value: metrics.propostasEnviadas,  icon: FileCheck, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30",  description: "Propostas submetidas" },
    { title: "Propostas Rascunho",   value: metrics.propostasRascunho,  icon: Clock,     color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30",    description: "Aguardando envio" },
  ];

  const statusBadge = (status: string) =>
    EDITAL_STATUS_BADGE[status] || "bg-muted text-muted-foreground";

  const propostasChartData = [
    { name: "Enviadas",  value: metrics.propostasEnviadas,  fill: "#a78bfa" },
    { name: "Rascunho",  value: metrics.propostasRascunho,  fill: "#fbbf24" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
          Olá, {profile?.nome?.split(" ")[0] || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground text-sm font-medium opacity-80 uppercase tracking-widest">
          Resumo do seu Hub de Licitações
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metricsCards.map((card) => (
          <Card key={card.title} className="glass-card border-none hover:translate-y-[-4px] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{card.title}</CardTitle>
              <div className={`p-2.5 rounded-xl ${card.bg} shadow-inner`}>
                <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter text-foreground mb-1">
                {loading ? "—" : card.value}
              </div>
              <p className="text-[11px] font-medium text-muted-foreground/60 leading-tight">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Processos por Status — Bar Chart */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Processos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || processosPorStatus.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                {loading ? "Carregando..." : "Nenhum processo ainda."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={processosPorStatus} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                    formatter={(value: number) => [value, "Processos"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
                    {processosPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Propostas — Donut Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              Propostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || propostasChartData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                {loading ? "Carregando..." : (
                  <>
                    <FileCheck className="h-10 w-10 opacity-20" />
                    <p>Nenhuma proposta ainda.</p>
                  </>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={propostasChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {propostasChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Prazos Urgentes */}
        <Card className="border-orange-200/60 dark:border-orange-900/30 bg-orange-50/40 dark:bg-orange-950/10">
          <CardHeader className="pb-3 border-b border-orange-200/40 dark:border-orange-900/20">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Prazos Críticos (próximos 7 dias)
              <Badge variant="outline" className="ml-auto text-orange-600 border-orange-300">
                {loading ? "—" : prazosUrgentes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
            ) : prazosUrgentes.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <p className="text-sm italic">Nenhum prazo crítico nos próximos 7 dias. 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {prazosUrgentes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{p.numero_interno}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{p.editais?.objeto}</p>
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        p.diasRestantes === 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : p.diasRestantes <= 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {p.diasRestantes === 0 ? "Hoje!" : `${p.diasRestantes}d`}
                      </span>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {format(parseISO(p.prazo), "dd/MM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editais Recentes */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Editais Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
            ) : recentEditais.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum edital cadastrado ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentEditais.map((edital) => (
                  <div key={edital.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{edital.objeto}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {edital.orgao} · Nº {edital.numero}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={statusBadge(edital.status)}>
                        {edital.status}
                      </Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
