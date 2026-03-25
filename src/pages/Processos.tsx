import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Plus,
  ExternalLink,
  Calendar,
  Building2,
  FileText,
  Loader2,
  Search,
  X
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UasgProfile } from "@/components/UasgProfile";
import { AIAnalysisDialog } from "@/components/AIAnalysisDialog";
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
import type { Processo, Edital } from '@/types/processos';
import { STATUS_OPTIONS } from '@/types/processos';
import { EditalDetailsDialog } from '@/components/Processos/EditalDetailsDialog';
import { DraggableProcessoCard } from '@/components/Processos/DraggableProcessoCard';
import { DroppableColumn } from '@/components/Processos/DroppableColumn';
import { useProcessos, useEditaisDropdown, useCreateProcesso, useUpdateProcessoStatus } from "@/hooks/useProcessos";


import { CreateProcessoDialog } from "@/components/Processos/CreateProcessoDialog";
import { useSearchParams } from "react-router-dom";
export default function Processos() {
  const { canCreate } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: processos = [], isLoading: loadingProcessos, refetch } = useProcessos();
  const { data: editais = [], isLoading: loadingEditais } = useEditaisDropdown();
  const { mutateAsync: createProcesso } = useCreateProcesso();
  const { mutateAsync: updateProcessoStatus } = useUpdateProcessoStatus();

  const loading = loadingProcessos || loadingEditais;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Components handles creation logic
  const [uasgProfileOpen, setUasgProfileOpen] = useState(false);
  const [selectedOrgao, setSelectedOrgao] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
      } catch (error) {
        toast({ title: "Erro ao mover", variant: "destructive" });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt ? { label: opt.label, color: opt.color } : { label: status, color: "bg-muted text-muted-foreground" };
  };

  const processosFiltrados = useMemo(() => {
    return processos.filter((p) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.numero_interno?.toLowerCase().includes(term) ||
        p.editais?.objeto?.toLowerCase().includes(term) ||
        p.editais?.orgao?.toLowerCase().includes(term)
      );
    });
  }, [processos, searchTerm]);

  const handleCardClick = useCallback((proc: Processo) => {
    setSelectedProcesso(proc);
    setDetailsOpen(true);
  }, []);

  const handleOrgaoClick = useCallback((orgao: string) => {
    setSelectedOrgao(orgao);
    setUasgProfileOpen(true);
  }, []);

  const noop = useCallback(() => {}, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Processos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe os processos internos vinculados a editais</p>
        </div>
        {canCreate() && (
          <CreateProcessoDialog 
            editais={editais} 
            onCreate={async (data) => {
              setSaving(true);
              try {
                await createProcesso(data);
              } finally {
                setSaving(false);
              }
            }} 
            loading={saving} 
          />
        )}
      </div>

      {/* Search bar */}
      {!loading && processos.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por processo, edital ou órgão..."
            className="pl-9 pr-8 bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Carregando processos...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && processos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="p-4 rounded-full bg-primary/5 mb-4">
            <FolderOpen className="h-10 w-10 opacity-30" />
          </div>
          <p className="text-base font-medium">Nenhum processo encontrado</p>
          <p className="text-sm mt-1">
            {editais.length === 0
              ? "Importe editais primeiro na aba Editais, depois crie processos aqui."
              : "Crie um novo processo vinculado a um edital importado."}
          </p>
        </div>
      )}

      {/* Sem resultados na busca */}
      {!loading && processos.length > 0 && searchTerm && processosFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 opacity-30 mb-3" />
          <p className="text-sm font-medium">Nenhum processo encontrado para "{searchTerm}"</p>
          <button onClick={() => setSearchTerm("")} className="text-xs text-primary mt-2 hover:underline">Limpar busca</button>
        </div>
      )}

      {/* Kanban Board */}
      {!loading && processos.length > 0 && (!searchTerm || processosFiltrados.length > 0) && (
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
                  onCardClick={handleCardClick}
                  onOrgaoClick={handleOrgaoClick}
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
      )}

      {/* Detalhes do Edital Dialog */}
      <EditalDetailsDialog
        processo={selectedProcesso}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onRefresh={refetch}
      />

      <UasgProfile
        orgao={selectedOrgao}
        open={uasgProfileOpen}
        onOpenChange={setUasgProfileOpen}
      />
    </div>
  );
}
