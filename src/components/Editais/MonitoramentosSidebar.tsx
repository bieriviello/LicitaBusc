import { Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Monitoramento {
  id: string;
  nome: string;
  palavra_chave: string;
}

interface MonitoramentosSidebarProps {
  monitoramentos: Monitoramento[];
  onDelete: (id: string) => void;
}

export function MonitoramentosSidebar({ monitoramentos, onDelete }: MonitoramentosSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Activity className="h-4 w-4 text-primary animate-pulse" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
          Monitoramentos
        </h2>
      </div>
      <div className="glass-card p-5 space-y-4 min-h-[140px]">
        {monitoramentos.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Nenhum monitoramento salvo.
          </p>
        ) : (
          monitoramentos.map((m) => (
            <div
              key={m.id}
              className="group flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{m.nome}</p>
                <p className="text-[10px] text-muted-foreground">
                  Termo: {m.palavra_chave}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(m.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
