import { useEffect, useState, useMemo } from "react";
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
  Check,
  Save,
  Search,
  X,
  Sparkles
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
import { useItensPncp } from "@/hooks/useComprasGov";
import { UasgProfile } from "@/components/UasgProfile";
import { FileUpload } from "@/components/FileUpload";
import { pdfService } from "@/services/pdfService";
import { AIAnalysisDialog } from "@/components/AIAnalysisDialog";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Processo, Edital } from '@/types/processos';
import { STATUS_OPTIONS } from '@/types/processos';
import { EditalDetailsDialog } from '@/components/Processos/EditalDetailsDialog';
import { DraggableProcessoCard } from '@/components/Processos/DraggableProcessoCard';
import { DroppableColumn } from '@/components/Processos/DroppableColumn';

import { useSearchParams } from "react-router-dom";
export default function Processos() {
  const { canCreate } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [editais, setEditais] = useState<Edital[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Form state
  const [novoNumero, setNovoNumero] = useState("");
  const [novoEditalId, setNovoEditalId] = useState("");
  const [novoStatus, setNovoStatus] = useState("em_andamento");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novoObs, setNovoObs] = useState("");

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
      const oldStatus = processo.status;
      // Optimistic update
      setProcessos(prev => prev.map(p => p.id === processId ? { ...p, status: newStatus } : p));

      const { error } = await supabase.from('processos').update({ status: newStatus }).eq('id', processId);
      if (error) {
        toast({ title: "Erro ao mover", variant: "destructive" });
        // Revert local state to avoid refetching
        setProcessos(prev => prev.map(p => p.id === processId ? { ...p, status: oldStatus } : p));
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);

    // 1. Fetch processes and editals first (this is the core data)
    const { data: procData, error: procError } = await supabase
      .from("processos")
      .select("*, editais(objeto, orgao, numero, status, raw_json), documentos(*)")
      .order("created_at", { ascending: false });

    // 2. Fetch editals for the selection dropdown
    const { data: editaisData } = await supabase
      .from("editais")
      .select("id, numero, objeto, orgao")
      .order("created_at", { ascending: false });

    if (procError) {
      console.error("Erro ao buscar processos:", procError);
      toast({
        title: "Erro ao carregar processos",
        description: procError.message,
        variant: "destructive"
      });
    } else if (procData) {
      setProcessos(procData as unknown as Processo[]);

      // 3. Try to fetch participation counts separately
      // This way, if the table 'participacao_itens' doesn't exist yet, 
      // it won't break the main processes list.
      try {
        const { data: countsData, error: countsError } = await supabase
          .from("participacao_itens")
          .select("processo_id");

        if (!countsError && countsData) {
          // Manually calculate counts
          const countsMap: Record<string, number> = {};
          countsData.forEach((item) => {
            countsMap[item.processo_id] = (countsMap[item.processo_id] || 0) + 1;
          });

          setProcessos(prev => prev.map(p => ({
            ...p,
            participacao_itens: countsMap[p.id] ? [{ count: countsMap[p.id] }] : []
          })));
        }
      } catch (e: unknown) {
        console.warn("Tabela participacao_itens ainda não criada no banco.", e);
      }
    }

    if (editaisData) setEditais(editaisData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handleCriar = async () => {
    if (!novoNumero || !novoEditalId) {
      toast({ title: "Erro", description: "Preencha o número e selecione um edital.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("processos").insert({
      numero_interno: novoNumero,
      edital_id: novoEditalId,
      status: novoStatus,
      prazo: novoPrazo || null,
      observacoes: novoObs || null,
    });

    if (error) {
      toast({ title: "Erro ao criar processo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Processo criado!", description: `Processo ${novoNumero} foi criado com sucesso.` });
      setDialogOpen(false);
      setNovoNumero("");
      setNovoEditalId("");
      setNovoStatus("triagem");
      setNovoPrazo("");
      setNovoObs("");
      fetchData();
    }
    setSaving(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Processos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe os processos internos vinculados a editais</p>
        </div>
        {canCreate() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Processo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número Interno *</Label>
                  <Input
                    id="numero"
                    value={novoNumero}
                    onChange={(e) => setNovoNumero(e.target.value)}
                    placeholder="Ex: PROC-2025-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Edital Vinculado *</Label>
                  <Select value={novoEditalId} onValueChange={setNovoEditalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um edital" />
                    </SelectTrigger>
                    <SelectContent>
                      {editais.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhum edital importado
                        </SelectItem>
                      ) : (
                        editais.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.numero} — {e.objeto?.slice(0, 50)}...
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={novoStatus} onValueChange={setNovoStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prazo">Prazo</Label>
                    <Input
                      id="prazo"
                      type="date"
                      value={novoPrazo}
                      onChange={(e) => setNovoPrazo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obs">Observações</Label>
                  <Textarea
                    id="obs"
                    value={novoObs}
                    onChange={(e) => setNovoObs(e.target.value)}
                    placeholder="Observações sobre o processo..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleCriar} className="w-full" disabled={saving}>
                  {saving ? "Salvando..." : "Criar Processo"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search bar */}
      {!loading && processos.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por processo, edital ou órgão..."
            className="w-full h-9 pl-9 pr-8 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
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
                <DroppableColumn key={col.value} col={col} count={processosNaColuna.length}>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {processosNaColuna.map((proc) => (
                      <DraggableProcessoCard
                        key={proc.id}
                        proc={proc}
                        onClick={() => {
                          setSelectedProcesso(proc);
                          setDetailsOpen(true);
                        }}
                        onOrgaoClick={(orgao) => {
                          setSelectedOrgao(orgao);
                          setUasgProfileOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <DraggableProcessoCard
                proc={processos.find(p => p.id === activeId)!}
                onClick={() => { }}
                onOrgaoClick={() => { }}
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
        onRefresh={fetchData}
      />

      <UasgProfile
        orgao={selectedOrgao}
        open={uasgProfileOpen}
        onOpenChange={setUasgProfileOpen}
      />
    </div>
  );
}
