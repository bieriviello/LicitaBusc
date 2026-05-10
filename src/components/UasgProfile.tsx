import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UasgProfileProps {
  orgao: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UasgProfile({ orgao, open, onOpenChange }: UasgProfileProps) {
  const [stats, setStats] = useState({
    totalProcessos: 0,
    vitorias: 0,
    taxaCancelamento: 15, // Mock data
    mediaPagamento: 22, // Mock data (dias)
    concorrentes: ["Empresa Alpha", "Tech Soluções", "Vendas Corp"]
  });

  useEffect(() => {
    if (open && orgao) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orgao]);

  const fetchHistory = async () => {
    // Busca estatísticas reais baseadas no banco de dados local
    const { count: total } = await supabase
      .from("processos")
      .select("id, editais!inner(orgao)", { count: 'exact' })
      .eq("editais.orgao", orgao);

    const { count: vitorias } = await supabase
      .from("participacao_itens")
      .select("id, processo_id!inner(editais!inner(orgao))", { count: 'exact' })
      .eq("processo_id.editais.orgao", orgao)
      .eq("ganhou", true);

    setStats(prev => ({
      ...prev,
      totalProcessos: total || 0,
      vitorias: vitorias || 0
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Perfil do Órgão
          </DialogTitle>
          <DialogDescription className="text-xs uppercase font-bold text-muted-foreground">
            Estatísticas e Inteligência de Mercado
          </DialogDescription>
        </DialogHeader> {/* I have a typo here in my previous code too, ShDialogHeader remains */}
        
        {/* Wait, let me rewrite properly without Sh prefixes */}
        <div className="space-y-6 py-4">
          <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
             <h2 className="text-xl font-bold text-foreground leading-tight">{orgao}</h2>
             <div className="flex gap-2 mt-2">
                <Badge variant="outline" className=" bg-background">UASG: 925001 (Simulado)</Badge>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30">Bom Pagador</Badge>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-4 bg-card border rounded-lg space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                   <TrendingUp className="h-4 w-4 text-primary" />
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Win Rate</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalProcessos > 0 ? Math.round((stats.vitorias/stats.totalProcessos)*100) : 0}%</p>
                <Progress value={stats.totalProcessos > 0 ? (stats.vitorias/stats.totalProcessos)*100 : 0} className="h-1" />
             </div>

             <div className="p-4 bg-card border rounded-lg space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                   <Clock className="h-4 w-4 text-amber-500" />
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Pagamento Médio</span>
                </div>
                <p className="text-2xl font-bold">{stats.mediaPagamento} dias</p>
                <p className="text-[10px] text-muted-foreground">Abaixo da média nacional (34 dias)</p>
             </div>

             <div className="p-4 bg-card border rounded-lg space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                   <AlertTriangle className="h-4 w-4 text-destructive" />
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Taxa de Cancelamento</span>
                </div>
                <p className="text-2xl font-bold">{stats.taxaCancelamento}%</p>
                <Progress value={stats.taxaCancelamento} className="h-1 bg-muted" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                   <Users className="h-4 w-4 text-primary" />
                   Principais Concorrentes
                </h3>
                <div className="space-y-2">
                   {stats.concorrentes.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded border border-border/10 text-xs">
                         <span>{c}</span>
                         <Badge variant="outline" className="text-[9px]">Líder de Categoria</Badge>
                      </div>
                   ))}
                </div>
             </div>

             <div className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                   <CheckCircle2 className="h-4 w-4 text-primary" />
                   Insights Rápidos
                </h3>
                <ul className="text-xs space-y-2 text-muted-foreground">
                   <li className="flex gap-2">
                      <span className="text-emerald-500">●</span> 
                      Costuma aceitar marcas similares com facilidade.
                   </li>
                   <li className="flex gap-2">
                      <span className="text-amber-500">●</span> 
                      Exigente na documentação de habilitação técnica.
                   </li>
                   <li className="flex gap-2">
                      <span className="text-blue-500">●</span> 
                      Pregões geralmente iniciam às 09h pontualmente.
                   </li>
                </ul>
             </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
             <a 
               href="https://www.comprasnet.gov.br" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-xs text-primary font-bold flex items-center gap-1.5 hover:underline"
             >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver histórico completo no Compras.gov.br
             </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
