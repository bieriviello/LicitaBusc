import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { DraggableProcessoCard } from "./DraggableProcessoCard";
import type { Processo } from "@/types/processos";

interface DroppableColumnProps {
  col: { value: string; label: string; color: string };
  count: number;
  processos: Processo[];
  onCardClick: (proc: Processo) => void;
  onOrgaoClick: (orgao: string) => void;
}

export const DroppableColumn = React.memo(function DroppableColumn({ 
  col, 
  count, 
  processos,
  onCardClick,
  onOrgaoClick
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: col.value,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 flex flex-col gap-4 rounded-xl p-3 border transition-colors ${
        isOver ? "bg-primary/10 border-primary" : "bg-muted/30 border-border/50"
      }`}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{col.label}</h3>
          <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 text-[10px]">{count}</Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {processos.map((proc) => (
          <DraggableProcessoCard
            key={proc.id}
            proc={proc}
            onClick={onCardClick}
            onOrgaoClick={onOrgaoClick}
          />
        ))}
      </div>
    </div>
  );
});
