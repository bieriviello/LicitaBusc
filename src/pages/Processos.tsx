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
  Save
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
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "concluido", label: "Concluído", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { value: "suspenso", label: "Suspenso", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
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
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch processes and editals first (this is the core data)
    const { data: procData, error: procError } = await supabase
      .from("processos")
      .select("*, editais(objeto, orgao, numero, status, raw_json)")
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
      setProcessos(procData as Processo[]);
      
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
      setNovoStatus("em_andamento");
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

      {/* Processos list */}
      {!loading && processos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processos.map((proc) => {
            const badge = getStatusBadge(proc.status);
            return (
              <Card 
                key={proc.id} 
                className="border-border/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setSelectedProcesso(proc);
                  setDetailsOpen(true);
                }}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground">
                        {proc.numero_interno}
                      </p>
                      {proc.editais && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {proc.editais.objeto}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className={`shrink-0 text-[10px] ${badge.color}`}>
                      {badge.label}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {proc.editais && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary/60" />
                        <span className="truncate">{proc.editais.orgao}</span>
                      </div>
                    )}
                    {proc.editais && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary/60" />
                        <span>Edital: {proc.editais.numero}</span>
                      </div>
                    )}
                    {proc.prazo && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary/60" />
                        <span>
                          Prazo: {new Date(proc.prazo).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>

                  {proc.participacao_itens && proc.participacao_itens[0]?.count > 0 && (
                    <div className="bg-primary/5 rounded-md p-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                        <Check className="h-3 w-3" />
                        <span>PARTICIPANDO DE {proc.participacao_itens[0].count} ITEM(NS)</span>
                      </div>
                    </div>
                  )}

                  {proc.observacoes && (
                    <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-md p-2 line-clamp-2">
                      {proc.observacoes}
                    </p>
                  )}

                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                    Criado em {new Date(proc.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detalhes do Edital Dialog */}
      <EditalDetailsDialog 
        processo={selectedProcesso} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        onRefresh={fetchData}
      />
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
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
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Modalidade</p>
                <p className="text-sm">{raw?.modalidadeNome || "N/A"}</p>
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
                        className={`p-3 bg-card border rounded-md transition-all ${
                          isSelected ? 'border-primary shadow-sm bg-primary/5' : 'hover:border-primary/30'
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
                              <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
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
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                              <span>Qtd: <strong>{item.quantidade}</strong> {item.unidadeMedida}</span>
                              <span>Estimado: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorUnitarioEstimado)}</strong></span>
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
