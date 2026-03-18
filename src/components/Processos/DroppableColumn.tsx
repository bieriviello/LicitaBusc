import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";

export function DroppableColumn({ 
  col, 
  count, 
  children 
}: { 
  col: { value: string; label: string; color: string }; 
  count: number; 
  children: React.ReactNode 
}) {
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
      {children}
    </div>
  );
}
