import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useProdutos } from "@/hooks/useProdutos";

interface Item {
  numeroItem: number;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  valorUnitarioEstimado: number;
  valorTotalEstimado: number;
}

interface ItensSectionProps {
  itens: Item[] | undefined;
  loading: boolean;
  participacoes: Record<number, { selecionado: boolean; valor: string; lote: string; produto_id: string }>;
  onToggleItem: (item: Item) => void;
  onUpdateField: (numeroItem: number, field: "valor" | "lote" | "produto_id", value: string) => void;
}

export function ItensSection({ itens, loading, participacoes, onToggleItem, onUpdateField }: ItensSectionProps) {
  const { data: produtos } = useProdutos();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-sm font-bold border-l-4 border-primary pl-3 uppercase tracking-tight text-foreground/80">
          Itens do Edital
        </h3>
        {itens && (
          <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
            {itens.length} {itens.length === 1 ? 'UNITÁRIO' : 'ITENS TOTAIS'}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/5 rounded-xl border border-dashed text-muted-foreground gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
          <p className="text-[10px] font-bold tracking-widest uppercase">Consultando Itens no PNCP...</p>
        </div>
      ) : itens && itens.length > 0 ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {itens.map((item) => {
            const part = participacoes[item.numeroItem];
            const isSelected = !!part?.selecionado;

            return (
              <div
                key={item.numeroItem}
                className={`p-4 bg-card border rounded-xl transition-all duration-200 group ${
                  isSelected 
                    ? 'border-primary shadow-md bg-gradient-to-br from-primary/[0.03] to-transparent' 
                    : 'hover:border-primary/30 hover:shadow-sm shadow-sm border-border/50'
                }`}
              >
                <div className="flex gap-4">
                  <div className="pt-1.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleItem(item)}
                      className="h-5 w-5 border-primary/40 data-[state=checked]:bg-primary transition-all"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className={`inline-flex self-start text-[10px] font-black px-2 py-0.5 rounded tracking-tighter transition-colors ${
                          isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-primary/10 text-primary'
                        }`}>
                          ITEM {item.numeroItem}
                        </span>
                        <p className="text-xs font-semibold leading-relaxed text-foreground/90 pr-2 line-clamp-2">
                          {item.descricao}
                        </p>
                      </div>
                      
                      {isSelected && (
                        <div className="flex gap-3">
                           {/* Lote Input */}
                           <div className="flex flex-col gap-1 w-20">
                             <Label className="text-[9px] font-black text-muted-foreground uppercase opacity-70">Lote</Label>
                             <Input 
                                placeholder="Nº"
                                className="h-8 text-xs font-bold bg-white"
                                value={part.lote}
                                onChange={(e) => onUpdateField(item.numeroItem, "lote", e.target.value)}
                             />
                           </div>

                           {/* Valor Input */}
                           <div className="flex flex-col items-end gap-1 w-32">
                             <Label className="text-[9px] font-black text-primary uppercase tracking-widest">PROPOSTA</Label>
                             <div className="relative w-full">
                               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/50">R$</span>
                               <Input
                                 className="h-8 pl-7 text-xs font-black bg-white border-primary/20 focus:ring-primary shadow-sm"
                                 type="number"
                                 step="0.01"
                                 value={part.valor}
                                 onChange={(e) => onUpdateField(item.numeroItem, "valor", e.target.value)}
                               />
                             </div>
                           </div>
                        </div>
                      )}
                    </div>

                    {isSelected && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-dashed border-border flex items-center gap-4">
                           <div className="flex flex-col gap-1 flex-1">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                                    <Package className="h-3 w-3" /> Vincular ao Estoque
                                </Label>
                                <Select 
                                    value={part.produto_id} 
                                    onValueChange={(val) => onUpdateField(item.numeroItem, "produto_id", val)}
                                >
                                    <SelectTrigger className="h-8 text-[11px] bg-white font-medium">
                                        <SelectValue placeholder="Selecione um produto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {produtos?.map(p => (
                                            <SelectItem key={p.id} value={p.id} className="text-xs">
                                                {p.nome} (Esq: {p.estoque} | Cust: {formatCurrency(p.preco_custo)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                           </div>
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-muted-foreground/80 font-medium border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-60 uppercase font-black">Qtd:</span>
                        <strong className="text-foreground">{item.quantidade} {item.unidadeMedida}</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-60 uppercase font-black">Est. Un:</span>
                        <strong className="text-foreground">{formatCurrency(item.valorUnitarioEstimado)}</strong>
                      </div>
                      {isSelected && part.valor && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100">
                          <span className="text-emerald-700 font-bold uppercase tracking-tighter text-[9px]">Margem:</span>
                          <strong className={`${(item.valorUnitarioEstimado - parseFloat(part.valor)) > 0 ? "text-emerald-600" : "text-destructive"} font-black text-xs`}>
                             {Math.round(((item.valorUnitarioEstimado - parseFloat(part.valor)) / item.valorUnitarioEstimado) * 100)}%
                          </strong>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="opacity-60 italic text-[9px]">TOTAL ESTIMADO DO ITEM:</span>
                        <strong className="text-foreground/90 font-black">{formatCurrency(item.valorTotalEstimado)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed border-border/50">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nenhum item detectado no edital via PNCP</p>
        </div>
      )}
    </div>
  );
}

