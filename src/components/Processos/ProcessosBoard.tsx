import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import { STATUS_OPTIONS } from '@/types/processos';
import type { Processo } from '@/types/processos';
import { DroppableColumn } from './DroppableColumn';
import { DraggableProcessoCard } from './DraggableProcessoCard';
import { useToast } from "@/hooks/use-toast";

interface ProcessosBoardProps {
  processos: Processo[];
  processosFiltrados: Processo[];
  updateProcessoStatus: (params: { id: string; status: string }) => Promise<any>;
  onCardClick: (proc: Processo) => void;
  onOrgaoClick: (orgao: string) => void;
}

export function ProcessosBoard({
  processos,
  processosFiltrados,
  updateProcessoStatus,
  onCardClick,
  onOrgaoClick
}: ProcessosBoardProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const processId = active.id as string;
    const newStatus = over.id as string;

    const processo = processos.find(p => p.id === processId);
    if (processo && processo.status !== newStatus && STATUS_OPTIONS.some(s => s.value === newStatus)) {
      try {
        await updateProcessoStatus({ id: processId, status: newStatus });
        toast({ title: "Processo movido com sucesso" });
      } catch (error) {
        toast({ title: "Erro ao mover", variant: "destructive" });
      }
    }
  };

  const noop = useCallback(() => {}, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-250px)] custom-scrollbar">
        {STATUS_OPTIONS.map((col) => {
          const processosNaColuna = processosFiltrados.filter(p => p.status === col.value);
          return (
            <DroppableColumn 
              key={col.value} 
              col={col} 
              count={processosNaColuna.length}
              processos={processosNaColuna}
              onCardClick={onCardClick}
              onOrgaoClick={onOrgaoClick}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeId ? (
          <DraggableProcessoCard
            proc={processos.find(p => p.id === activeId)!}
            onClick={noop}
            onOrgaoClick={noop}
            isOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
