import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Building2, Clock, Globe, Briefcase } from "lucide-react";
import { STATUS_OPTIONS } from "@/types/processos";
import { useToast } from "@/hooks/use-toast";
import { useClientes } from "@/hooks/useClientes";
import { useEmpresas } from "@/hooks/useEmpresas";
import type { CreateProcessoInput } from "@/hooks/useProcessos";

interface EditaisOptions {
  id: string;
  numero: string;
  objeto: string;
  orgao: string;
}

interface ItemForm {
  numero_item: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_estimado: number;
}

interface CreateProcessoDialogProps {
  editais: EditaisOptions[];
  onCreate: (data: CreateProcessoInput) => Promise<void>;
  loading?: boolean;
}

const PORTAIS = [
  { value: "compras_gov", label: "Compras.gov.br (PNCP)" },
  { value: "comprasnet", label: "ComprasNet" },
  { value: "bec_sp", label: "BEC/SP" },
  { value: "licitanet", label: "Licitanet" },
  { value: "bll", label: "BLL" },
  { value: "bemlicitado", label: "BemLicitado" },
  { value: "outro", label: "Outro" },
];

const ITEM_VAZIO: Omit<ItemForm, "numero_item"> = {
  descricao: "",
  quantidade: 1,
  unidade: "UN",
  valor_estimado: 0,
};

export function CreateProcessoDialog({ editais, onCreate, loading }: CreateProcessoDialogProps) {
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<"manual" | "edital">("manual");

  const [numero, setNumero] = useState("");
  const [status, setStatus] = useState("triagem");
  const [prazo, setPrazo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [orgaoManual, setOrgaoManual] = useState("");
  const [dataPregao, setDataPregao] = useState("");
  const [horaPregao, setHoraPregao] = useState("");
  const [portalPregao, setPortalPregao] = useState("");

  const [empresaId, setEmpresaId] = useState("");
  const [editalId, setEditalId] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([]);

  const { toast } = useToast();
  const { data: clientes = [] } = useClientes();
  const { data: empresas = [] } = useEmpresas();

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);
  const editalSelecionado = editais.find((e) => e.id === editalId);

  const orgaoNomeResolvido =
    modo === "manual"
      ? clienteSelecionado?.nome || orgaoManual
      : editalSelecionado?.orgao || "";

  const adicionarItem = () => {
    setItens((prev) => [
      ...prev,
      { numero_item: prev.length + 1, ...ITEM_VAZIO },
    ]);
  };

  const removerItem = (index: number) => {
    setItens((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, numero_item: i + 1 }))
    );
  };

  const atualizarItem = (index: number, campo: keyof ItemForm, valor: string | number) => {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const handleCreate = async () => {
    if (!numero) {
      toast({ title: "Atenção", description: "Informe o número interno do processo.", variant: "destructive" });
      return;
    }
    if (modo === "edital" && !editalId) {
      toast({ title: "Atenção", description: "Selecione um edital.", variant: "destructive" });
      return;
    }
    if (modo === "manual" && !clienteId && !orgaoManual) {
      toast({ title: "Atenção", description: "Informe o órgão ou selecione um cliente.", variant: "destructive" });
      return;
    }

    const orgaoNome =
      modo === "manual"
        ? clienteSelecionado?.nome || orgaoManual
        : editalSelecionado?.orgao || "";

    const payload: CreateProcessoInput = {
      numero_interno: numero,
      status,
      edital_id: modo === "edital" ? editalId : null,
      orgao_nome: orgaoNome || null,
      cliente_id: clienteId || null,
      data_pregao: dataPregao || null,
      hora_pregao: horaPregao || null,
      portal_pregao: portalPregao || null,
      empresa_id: empresaId || null,
      prazo: prazo || null,
      observacoes: observacoes || null,
      itens: itens.length > 0 ? itens : undefined,
    };

    try {
      await onCreate(payload);
      toast({ title: "Sucesso", description: `Processo ${numero} criado com sucesso!` });
      resetForm();
      setOpen(false);
    } catch {
      toast({ title: "Erro", description: "Ocorreu um erro ao criar o processo.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setNumero("");
    setStatus("triagem");
    setPrazo("");
    setObservacoes("");
    setClienteId("");
    setOrgaoManual("");
    setDataPregao("");
    setHoraPregao("");
    setPortalPregao("");
    setEmpresaId("");
    setEditalId("");
    setItens([]);
    setModo("manual");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Processo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Processo</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Tipo de cadastro */}
          <Tabs value={modo} onValueChange={(v) => setModo(v as "manual" | "edital")}>
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1">Cadastro Manual</TabsTrigger>
              <TabsTrigger value="edital" className="flex-1">Via Edital Importado</TabsTrigger>
            </TabsList>

            <TabsContent value="edital" className="mt-3">
              <div className="space-y-2">
                <Label>Edital Vinculado *</Label>
                <Select value={editalId} onValueChange={setEditalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um edital importado" />
                  </SelectTrigger>
                  <SelectContent>
                    {editais.length === 0 ? (
                      <SelectItem value="none" disabled>Nenhum edital disponível</SelectItem>
                    ) : (
                      editais.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          <span className="font-medium">{e.numero}</span>
                          <span className="text-muted-foreground ml-2">
                            — {e.objeto?.substring(0, 50)}{e.objeto?.length > 50 ? "..." : ""}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {editalSelecionado && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{editalSelecionado.orgao}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-0" />
          </Tabs>

          {/* ── Dados do Pregão ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Dados do Pregão
            </p>

            {modo === "manual" && (
              <div className="space-y-2">
                <Label>Órgão *</Label>
                {clientes.length > 0 && (
                  <Select value={clienteId} onValueChange={(v) => { setClienteId(v); setOrgaoManual(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente cadastrado" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-medium">{c.nome}</span>
                          {c.cnpj && <span className="text-muted-foreground ml-2 text-xs">{c.cnpj}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  value={orgaoManual}
                  onChange={(e) => { setOrgaoManual(e.target.value); setClienteId(""); }}
                  placeholder={clientes.length > 0 ? "Ou digite o nome do órgão manualmente" : "Nome do órgão"}
                  className="text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="data_pregao" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Data do Pregão
                </Label>
                <Input
                  id="data_pregao"
                  type="date"
                  value={dataPregao}
                  onChange={(e) => setDataPregao(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_pregao">Horário</Label>
                <Input
                  id="hora_pregao"
                  type="time"
                  value={horaPregao}
                  onChange={(e) => setHoraPregao(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Portal do Pregão</Label>
              <Select value={portalPregao} onValueChange={setPortalPregao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o portal" />
                </SelectTrigger>
                <SelectContent>
                  {PORTAIS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Empresa Participante ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Empresa Participante
            </p>
            {empresas.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma empresa cadastrada ainda.
              </p>
            ) : (
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa que vai participar" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex items-center gap-2">
                        {e.is_principal && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Principal</Badge>
                        )}
                        <span className="font-medium">{e.nome}</span>
                        <span className="text-muted-foreground text-xs">{e.cnpj}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ── Itens de Participação ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Itens de Participação
              </p>
              <Button type="button" variant="outline" size="sm" onClick={adicionarItem} className="gap-1.5 h-7 text-xs">
                <Plus className="h-3.5 w-3.5" /> Adicionar Item
              </Button>
            </div>

            {itens.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-2">
                Nenhum item. Você pode adicionar após criar o processo.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {itens.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[40px_1fr_70px_60px_110px_36px] gap-2 items-center p-2 rounded-md border border-border/50 bg-muted/20"
                  >
                    <span className="text-xs text-center font-semibold text-muted-foreground">
                      #{item.numero_item}
                    </span>
                    <Input
                      value={item.descricao}
                      onChange={(e) => atualizarItem(index, "descricao", e.target.value)}
                      placeholder="Descrição"
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(index, "quantidade", Number(e.target.value))}
                      placeholder="Qtd"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={item.unidade}
                      onChange={(e) => atualizarItem(index, "unidade", e.target.value)}
                      placeholder="UN"
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.valor_estimado}
                      onChange={(e) => atualizarItem(index, "valor_estimado", Number(e.target.value))}
                      placeholder="Valor est. R$"
                      className="h-7 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removerItem(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground text-right pr-1">
                  Colunas: Nº · Descrição · Qtd · Unid. · Valor Est. (R$)
                </p>
              </div>
            )}
          </div>

          {/* ── Dados Internos ── */}
          <div className="space-y-3 pt-1 border-t border-border/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">
              Dados Internos
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="numero">Número Interno *</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ex: PROC-2025-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo Interno</Label>
              <Input
                id="prazo"
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais sobre o processo..."
                className="resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Resumo */}
          {(orgaoNomeResolvido || dataPregao || empresaId) && (
            <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-xs space-y-1">
              <p className="font-semibold text-primary mb-1.5">Resumo</p>
              {orgaoNomeResolvido && (
                <p><span className="text-muted-foreground">Órgão:</span> {orgaoNomeResolvido}</p>
              )}
              {dataPregao && (
                <p>
                  <span className="text-muted-foreground">Pregão:</span>{" "}
                  {new Date(dataPregao + "T00:00").toLocaleDateString("pt-BR")}
                  {horaPregao ? ` às ${horaPregao}` : ""}
                </p>
              )}
              {portalPregao && (
                <p><span className="text-muted-foreground">Portal:</span> {PORTAIS.find(p => p.value === portalPregao)?.label}</p>
              )}
              {empresaId && (
                <p><span className="text-muted-foreground">Empresa:</span> {empresas.find(e => e.id === empresaId)?.nome}</p>
              )}
              {itens.length > 0 && (
                <p><span className="text-muted-foreground">Itens:</span> {itens.length} item(s)</p>
              )}
            </div>
          )}

          <Button onClick={handleCreate} className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar Processo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
