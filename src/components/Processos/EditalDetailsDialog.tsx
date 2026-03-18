import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useItensPncp } from "@/hooks/useComprasGov";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, FileText, Loader2, Save, Sparkles, ExternalLink } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { pdfService } from "@/services/pdfService";
import { AIAnalysisDialog } from "@/components/AIAnalysisDialog";
import type { Processo } from "@/types/processos";

export function EditalDetailsDialog({
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
  const raw = edital?.raw_json as Record<string, unknown> | undefined;

  const { data: itens, isLoading: loadingItens } = useItensPncp(
    String(raw?.orgaoEntidadeCnpj || ""),
    Number(raw?.anoCompraPncp || 0),
    Number(raw?.sequencialCompraPncp || 0),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      data.forEach((p: { numero_item: number, valor_proposta?: number }) => {
        initial[p.numero_item] = { selecionado: true, valor: p.valor_proposta?.toString() || "" };
      });
      setParticipacoes(initial);
    }
    setLoadingParticipacoes(false);
  };

  const toggleItem = (item: { numeroItem: number, valorUnitarioEstimado?: number }) => {
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

    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
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
                    ? new Date(String(raw.dataAberturaPropostaPncp)).toLocaleDateString("pt-BR")
                    : "Não informada"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Valor Estimado</p>
                <p className="text-sm font-bold text-emerald-600">
                  {raw?.valorTotalEstimado
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(raw.valorTotalEstimado))
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
                              toast({ title: "Erro na leitura", description: "Não foi possível ler este PDF.", variant: "destructive", duration: 2000 });
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
                  {itens.map((item) => {
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
