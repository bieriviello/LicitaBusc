import { useEffect, useState } from "react";
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

interface Processo {
  id: string;
  edital_id: string;
  numero_interno: string;
  status: string;
  prazo: string | null;
  observacoes: string | null;
  created_at: string;
  editais?: {
    objeto: string;
    orgao: string;
    numero: string;
    status: string;
    raw_json: any;
  };
  participacao_itens?: { count: number }[];
  checklist?: { id: string, label: string, completed: boolean }[];
  documentos?: { id: string, nome: string, url: string, created_at: string }[];
}

interface Edital {
  id: string;
  numero: string;
  objeto: string;
  orgao: string;
}

interface ParticipacaoItem {
  id?: string;
  numero_item: number;
  descricao: string;
  valor_estimado: number;
  valor_proposta: number;
  quantidade: number;
  unidade: string;
}

const STATUS_OPTIONS = [
  { value: "triagem", label: "Triagem", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400" },
  { value: "analise_tecnica", label: "Análise Técnica", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "montagem_documentacao", label: "Montagem Documentação", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { value: "proposta_enviada", label: "Proposta Enviada", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  { value: "disputa_lances", label: "Disputa/Lances", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "homologado", label: "Homologado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

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
      // Optimistic update
      setProcessos(prev => prev.map(p => p.id === processId ? { ...p, status: newStatus } : p));

      const { error } = await supabase.from('processos').update({ status: newStatus }).eq('id', processId);
      if (error) {
        toast({ title: "Erro ao mover", variant: "destructive" });
        fetchData(); // revert na UI caso falhe
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
          countsData.forEach((item: any) => {
            countsMap[item.processo_id] = (countsMap[item.processo_id] || 0) + 1;
          });

          setProcessos(prev => prev.map(p => ({
            ...p,
            participacao_itens: countsMap[p.id] ? [{ count: countsMap[p.id] }] : []
          })));
        }
      } catch (e) {
        console.warn("Tabela participacao_itens ainda não criada no banco.");
      }
    }

    if (editaisData) setEditais(editaisData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
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

  const processosFiltrados = processos.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.numero_interno?.toLowerCase().includes(term) ||
      p.editais?.objeto?.toLowerCase().includes(term) ||
      p.editais?.orgao?.toLowerCase().includes(term)
    );
  });

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

function DroppableColumn({ col, count, children }: { col: any; count: number; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: col.value,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 flex flex-col gap-4 rounded-xl p-3 border transition-colors ${isOver ? "bg-primary/10 border-primary" : "bg-muted/30 border-border/50"
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

function DraggableProcessoCard({ proc, onClick, onOrgaoClick, isOverlay = false }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: proc.id,
    data: proc,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging && !isOverlay ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const completedItems = proc.checklist?.filter((c: any) => c.completed).length || 0;
  const totalItems = proc.checklist?.length || 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`border-border/50 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing group bg-card ${isOverlay ? 'ring-2 ring-primary shadow-2xl rotate-2' : ''
          }`}
        onClick={onClick}
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
                onPointerDown={(e) => e.stopPropagation()} // Evita arrastar se for clicar no órgão
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
}

function EditalDetailsDialog({
  processo,
  open,
  onOpenChange,
  onRefresh
}: {
  processo: Processo | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onRefresh?: () => void
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const edital = processo?.editais;
  const raw = edital?.raw_json as any;

  const { data: itens, isLoading: loadingItens } = useItensPncp(
    raw?.orgaoEntidadeCnpj,
    raw?.anoCompraPncp,
    raw?.sequencialCompraPncp,
    open && !!raw
  );

  const [participacoes, setParticipacoes] = useState<Record<number, { selecionado: boolean, valor: string }>>({});
  const [loadingParticipacoes, setLoadingParticipacoes] = useState(false);
  const [savingParticipacoes, setSavingParticipacoes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && processo?.id) {
      fetchParticipacoes();
    } else {
      setParticipacoes({});
    }
  }, [open, processo?.id]);

  const fetchParticipacoes = async () => {
    if (!processo?.id) return;
    setLoadingParticipacoes(true);
    const { data, error } = await supabase
      .from("participacao_itens")
      .select("*")
      .eq("processo_id", processo.id);

    if (error) {
      console.error("Erro ao buscar participações:", error);
    } else if (data) {
      const initial: Record<number, { selecionado: boolean, valor: string }> = {};
      data.forEach((p: any) => {
        initial[p.numero_item] = { selecionado: true, valor: p.valor_proposta?.toString() || "" };
      });
      setParticipacoes(initial);
    }
    setLoadingParticipacoes(false);
  };

  const toggleItem = (item: any) => {
    setParticipacoes(prev => {
      const isSelected = !!prev[item.numeroItem]?.selecionado;
      return {
        ...prev,
        [item.numeroItem]: {
          selecionado: !isSelected,
          valor: !isSelected ? (item.valorUnitarioEstimado?.toString() || "") : ""
        }
      };
    });
  };

  const updateValue = (numeroItem: number, value: string) => {
    setParticipacoes(prev => ({
      ...prev,
      [numeroItem]: { ...prev[numeroItem], valor: value }
    }));
  };

  const handleSave = async () => {
    if (!processo?.id) return;
    setSavingParticipacoes(true);

    try {
      // Deleta as que não estão mais selecionadas ou atualiza todas
      // Para simplificar, vou deletar todas do processo e reinserir as selecionadas
      // Ou melhor, fazer um upsert para as selecionadas e deletar as não selecionadas

      const selecionados = Object.entries(participacoes)
        .filter(([_, data]) => data.selecionado)
        .map(([num, data]) => {
          const itemPncp = itens?.find(i => i.numeroItem === parseInt(num));
          return {
            processo_id: processo.id,
            numero_item: parseInt(num),
            descricao: itemPncp?.descricao || "",
            valor_estimado: itemPncp?.valorUnitarioEstimado || 0,
            valor_proposta: parseFloat(data.valor) || 0,
            quantidade: itemPncp?.quantidade || 0,
            unidade: itemPncp?.unidadeMedida || "",
          };
        });

      // 1. Deletar items do processo que não estão na lista de selecionados
      const numsSelecionados = selecionados.map(s => s.numero_item);

      if (numsSelecionados.length > 0) {
        await supabase
          .from("participacao_itens")
          .delete()
          .eq("processo_id", processo.id)
          .not("numero_item", "in", `(${numsSelecionados.join(',')})`);

        const { error: upsertError } = await supabase
          .from("participacao_itens")
          .upsert(selecionados, { onConflict: 'processo_id, numero_item' });

        if (upsertError) throw upsertError;
      } else {
        // Se nenhum selecionado, deleta todos do processo
        await supabase
          .from("participacao_itens")
          .delete()
          .eq("processo_id", processo.id);
      }

      toast({
        title: "✅ Sucesso",
        description: "Participação atualizada com sucesso.",
      });

      if (onRefresh) onRefresh();

    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingParticipacoes(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 w-full pr-8">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Detalhes do Edital {edital?.numero}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {processo && (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Órgão</p>
                <p className="text-sm font-semibold">{edital?.orgao}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Status do Processo</p>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                  {processo.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Objeto</p>
              <p className="text-sm leading-relaxed">{edital?.objeto}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Data de Abertura</p>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4 text-primary/60" />
                  {raw?.dataAberturaPropostaPncp
                    ? new Date(raw.dataAberturaPropostaPncp).toLocaleDateString("pt-BR")
                    : "Não informada"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Valor Estimado</p>
                <p className="text-sm font-bold text-emerald-600">
                  {raw?.valorTotalEstimado
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(raw.valorTotalEstimado)
                    : "Não informado"}
                </p>
              </div>
            </div>

            {/* Documentos Anexados */}
            <div className="space-y-3 p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos Adicionais (PDF/Edital)
                </h3>
                <FileUpload processoId={processo.id} onUploadComplete={() => onRefresh && onRefresh()} />
              </div>

              <div className="space-y-2">
                {processo.documentos && processo.documentos.length > 0 ? (
                  processo.documentos.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/20 rounded border border-border/10">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-primary/60 shrink-0" />
                        <span className="text-xs truncate">{doc.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] gap-1 hover:text-primary"
                          onClick={async () => {
                            setAnalyzing(true);
                            try {
                              const response = await fetch(doc.url);
                              const blob = await response.blob();
                              const file = new File([blob], doc.nome, { type: "application/pdf" });
                              const text = await pdfService.extractText(file);
                              setPdfText(text);
                              setAiOpen(true);
                            } catch (err) {
                              toast({ title: "Erro na leitura", description: "Não foi possível ler este PDF.", variant: "destructive" });
                            } finally {
                              setAnalyzing(false);
                            }
                          }}
                          disabled={analyzing}
                        >
                          {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          Analisar com IA
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">Nenhum documento anexado ainda.</p>
                )}
              </div>
            </div>

            {/* AI Analysis Dialog inside process details */}
            <AIAnalysisDialog
              open={aiOpen}
              onOpenChange={setAiOpen}
              objeto={edital?.objeto || ""}
              raw={edital?.raw_json}
              pdfText={pdfText}
            />

            {/* Checklist de Documentos */}
            <div className="space-y-3 p-4 border rounded-lg bg-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Checklist de Documentação
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Balanço Patrimonial",
                  "Certidões Negativas (Federal, RS, Municipal)",
                  "Atestados de Capacidade Técnica",
                  "Contrato Social / Estatuto",
                  "Certidão de Falência",
                  "CRC / Cadastro no Portal"
                ].map(doc => {
                  const isCompleted = !!processo.checklist?.find(c => c.label === doc && c.completed);
                  return (
                    <div key={doc} className="flex items-center gap-2">
                      <Checkbox
                        id={`doc-${doc}`}
                        checked={isCompleted}
                        onCheckedChange={async (checked) => {
                          const current = processo.checklist || [];
                          let next;
                          if (current.find(c => c.label === doc)) {
                            next = current.map(c => c.label === doc ? { ...c, completed: !!checked } : c);
                          } else {
                            next = [...current, { id: crypto.randomUUID(), label: doc, completed: !!checked }];
                          }
                          await supabase.from("processos").update({ checklist: next }).eq("id", processo.id);
                          if (onRefresh) onRefresh();
                        }}
                      />
                      <Label htmlFor={`doc-${doc}`} className="text-xs cursor-pointer">{doc}</Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold border-l-4 border-primary pl-2 uppercase tracking-tight">
                  Itens do Edital
                </h3>
                {itens && (
                  <Badge variant="outline" className="text-[10px]">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                  </Badge>
                )}
              </div>

              {loadingItens || loadingParticipacoes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
                </div>
              ) : itens && itens.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {itens.map((item: any) => {
                    const part = participacoes[item.numeroItem];
                    const isSelected = !!part?.selecionado;

                    return (
                      <div
                        key={item.numeroItem}
                        className={`p-3 bg-card border rounded-md transition-all ${isSelected ? 'border-primary shadow-sm bg-primary/5' : 'hover:border-primary/30'
                          }`}
                      >
                        <div className="flex gap-4">
                          <div className="pt-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleItem(item)}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                                }`}>
                                ITEM {item.numeroItem}
                              </span>
                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`val-${item.numeroItem}`} className="text-[10px] font-bold text-primary">MEU VALOR:</Label>
                                  <Input
                                    id={`val-${item.numeroItem}`}
                                    size={1}
                                    className="h-7 w-24 text-xs font-bold"
                                    type="number"
                                    step="0.01"
                                    value={part.valor}
                                    onChange={(e) => updateValue(item.numeroItem, e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-medium leading-tight mt-1">{item.descricao}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                              <span>Qtd: <strong>{item.quantidade}</strong> {item.unidadeMedida}</span>
                              <span>Estimado: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorUnitarioEstimado)}</strong></span>
                              {isSelected && part.valor && (
                                <span className={`font-bold ${(item.valorUnitarioEstimado - parseFloat(part.valor)) > 0 ? "text-emerald-600" : "text-destructive"
                                  }`}>
                                  Margem: {Math.round(((item.valorUnitarioEstimado - parseFloat(part.valor)) / item.valorUnitarioEstimado) * 100)}%
                                </span>
                              )}
                              <span>Total Est.: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorTotalEstimado)}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                  <p className="text-xs text-muted-foreground">Nenhum item encontrado para este edital.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t mt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={savingParticipacoes}
                className="text-xs h-9 gap-2"
              >
                {savingParticipacoes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Salvar Participação
              </Button>
            </div>

            {processo.observacoes && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Observações Internas</p>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-md">
                  <p className="text-xs italic text-amber-900/80 dark:text-amber-200/80">{processo.observacoes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
