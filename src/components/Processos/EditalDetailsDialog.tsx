import { useEffect, useState } from "react";
import { useItensPncp } from "@/hooks/useComprasGov";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, FileText, Loader2, Save } from "lucide-react";
import { AIAnalysisDialog } from "@/components/AIAnalysisDialog";
import { useParticipacao, type ParticipacaoItem } from "@/hooks/useParticipacao";
import { ChecklistSection } from "./ChecklistSection";
import { DocumentosSection } from "./DocumentosSection";
import { ItensSection } from "./ItensSection";
import type { Processo } from "@/types/processos";
import { formatCurrency } from "@/lib/formatters";

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

  const {
    participacoes: participacoesData,
    isLoadingParticipacoes,
    saveParticipacoes,
    updateChecklist
  } = useParticipacao(processo?.id);

  // Local state for items being edited
  const [localParticipacoes, setLocalParticipacoes] = useState<Record<number, { selecionado: boolean, valor: string, lote: string, produto_id: string }>>({});

  useEffect(() => {
    if (open && participacoesData) {
      const initial: Record<number, { selecionado: boolean, valor: string, lote: string, produto_id: string }> = {};
      participacoesData.forEach((p: ParticipacaoItem) => {
        initial[p.numero_item] = { 
          selecionado: true, 
          valor: p.valor_proposta?.toString() || "",
          lote: p.lote || "",
          produto_id: p.produto_id || ""
        };
      });
      setLocalParticipacoes(initial);
    } else {
      setLocalParticipacoes({});
    }
  }, [open, participacoesData]);

  const toggleItem = (item: { numeroItem: number, valorUnitarioEstimado?: number }) => {
    setLocalParticipacoes(prev => {
      const isSelected = !!prev[item.numeroItem]?.selecionado;
      return {
        ...prev,
        [item.numeroItem]: {
          selecionado: !isSelected,
          valor: !isSelected ? (item.valorUnitarioEstimado?.toString() || "") : "",
          lote: prev[item.numeroItem]?.lote || "",
          produto_id: prev[item.numeroItem]?.produto_id || ""
        }
      };
    });
  };

  const updateItemField = (numeroItem: number, field: "valor" | "lote" | "produto_id", value: string) => {
    setLocalParticipacoes(prev => ({
      ...prev,
      [numeroItem]: { ...prev[numeroItem], [field]: value }
    }));
  };

  const handleSave = async () => {
    if (!processo?.id) return;
    
    const selecionados = Object.entries(localParticipacoes)
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
          lote: data.lote || null,
          produto_id: data.produto_id || null
        };
      });

    try {
      await saveParticipacoes.mutateAsync(selecionados);
      if (onRefresh) onRefresh();
    } catch (e) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto custom-scrollbar p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b">
          <DialogTitle className="flex items-center justify-between gap-4 w-full pr-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight uppercase">DETALHES DO PROCESSO</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-widest">Controle Interno • Edital {edital?.numero}</span>
              </div>
            </div>
            <Badge variant="outline" className="h-7 px-3 border-primary/20 font-black tracking-tighter bg-white shadow-sm">
                ID: {String(raw?.numeroControlePNCP || edital?.id?.slice(0, 8) || "N/A")}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {processo && (
          <div className="p-6 space-y-8 bg-white/50 backdrop-blur-sm">
            {/* Órgão e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-5 rounded-2xl border border-border/10 shadow-inner">
              <div className="space-y-1.5 flex flex-col justify-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider opacity-60">ADMINISTRAÇÃO PÚBLICA / ÓRGÃO</p>
                <p className="text-sm font-black text-foreground/90 uppercase leading-tight line-clamp-2">{edital?.orgao}</p>
              </div>
              <div className="space-y-1.5 flex flex-col items-start md:items-end justify-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider opacity-60">SITUAÇÃO INTERNA</p>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black px-4 py-1 tracking-tighter text-xs">
                  {processo.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Objeto */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-4 bg-primary rounded-full"></div>
                 <h3 className="text-xs font-black uppercase text-muted-foreground/80 tracking-widest">OBJETO DA LICITAÇÃO</h3>
              </div>
              <p className="text-sm leading-relaxed text-foreground font-medium text-justify italic">{edital?.objeto}</p>
            </div>

            {/* Cronograma e Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-primary/[0.03] rounded-2xl border border-primary/5 shadow-sm space-y-3">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 text-primary/60">
                     <Calendar className="h-4 w-4"/> AGENDAMENTO
                  </p>
                  <div className="flex items-center gap-2 font-black text-foreground/90">
                    <span className="text-sm">ABERTURA DE PROPOSTAS:</span>
                    <span className="text-base text-primary">
                        {raw?.dataAberturaPropostaPncp
                            ? new Date(String(raw.dataAberturaPropostaPncp)).toLocaleDateString("pt-BR")
                            : "N/A"}
                    </span>
                  </div>
               </div>
               <div className="p-4 bg-emerald-50 dark:bg-emerald-900/5 rounded-2xl border border-emerald-100 dark:border-emerald-900/10 shadow-sm space-y-3">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    ESTIMATIVA FINANCEIRA
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-black text-emerald-900/50">VALOR TOTAL:</span>
                    <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                        {raw?.valorTotalEstimado
                            ? formatCurrency(Number(raw.valorTotalEstimado))
                            : "R$ 0,00"}
                    </span>
                  </div>
               </div>
            </div>

            {/* Documentos */}
            <DocumentosSection 
                processo={processo} 
                onRefresh={onRefresh} 
                onAnalyzeWithIA={(text) => { setPdfText(text); setAiOpen(true); }}
            />

            {/* Checklist */}
            <ChecklistSection 
                processo={processo} 
                onUpdate={(next) => updateChecklist.mutate(next)} 
            />

            {/* AI Analysis Dialog */}
            <AIAnalysisDialog
              open={aiOpen}
              onOpenChange={setAiOpen}
              objeto={edital?.objeto || ""}
              raw={edital?.raw_json}
              pdfText={pdfText}
            />

            {/* Itens */}
            <ItensSection 
                itens={itens} 
                loading={loadingItens || isLoadingParticipacoes} 
                participacoes={localParticipacoes}
                onToggleItem={toggleItem}
                onUpdateField={updateItemField}
            />

            {/* Footer Ações */}
            <div className="sticky bottom-0 bg-white/90 backdrop-blur-md p-6 flex justify-end gap-3 border-t mt-4 -mx-6 -mb-6 z-10 shadow-2xl shadow-black/10">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs h-12 px-6 font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 transition-all"
              >
                FECHAR
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveParticipacoes.isPending}
                className="text-xs h-12 px-8 font-black uppercase tracking-widest gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {saveParticipacoes.isPending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4" />}
                SALVAR PARTICIPAÇÃO
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
