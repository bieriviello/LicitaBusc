import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Check } from "lucide-react";
import type { Processo } from "@/types/processos";

interface DraggableProcessoCardProps {
  proc: Processo;
  onClick: (proc: Processo) => void;
  onOrgaoClick: (orgao: string) => void;
  isOverlay?: boolean;
}

export const DraggableProcessoCard = React.memo(function DraggableProcessoCard({ 
  proc, 
  onClick, 
  onOrgaoClick, 
  isOverlay = false 
}: DraggableProcessoCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: proc.id,
    data: proc,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging && !isOverlay ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const completedItems = proc.checklist?.filter((c) => c.completed).length || 0;
  const totalItems = proc.checklist?.length || 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`border-border/50 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing group bg-card ${isOverlay ? 'ring-2 ring-primary shadow-2xl rotate-2' : ''
          }`}
        onClick={() => onClick(proc)}
      >
        <CardContent className="p-3 space-y-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
              {proc.numero_interno}
            </p>
            {proc.editais && (
              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {proc.editais.objeto}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-[10px] text-muted-foreground">
            {proc.editais && (
              <div
                className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOrgaoClick(proc.editais!.orgao);
                }}
              >
                <Building2 className="h-3 w-3 text-primary/60" />
                <span className="truncate border-b border-dotted border-muted-foreground/30 hover:border-primary/50">{proc.editais.orgao}</span>
              </div>
            )}
            {proc.prazo && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-primary/60" />
                <span className={new Date(proc.prazo) < new Date() ? 'text-destructive font-semibold' : ''}>
                  Prazo: {new Date(proc.prazo).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
          </div>

          {totalItems > 0 && (
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-muted-foreground">DOCUMENTOS</span>
                <span className="text-[9px] font-bold text-primary">{Math.round((completedItems / totalItems) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${(completedItems / totalItems) * 100}%` }}
                />
              </div>
            </div>
          )}

          {proc.participacao_itens && proc.participacao_itens[0]?.count > 0 && (
            <Badge variant="outline" className="w-full justify-center text-[9px] py-1 bg-primary/5 text-primary border-primary/20 gap-1 mt-1">
              <Check className="h-2.5 w-2.5" />
              {proc.participacao_itens[0].count} ITENS VINCULADOS
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
