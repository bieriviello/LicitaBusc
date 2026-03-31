import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileCheck, Plus, Trash2, Edit2, FileText, Loader2, Save } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { PROPOSTA_STATUS_OPTIONS } from "@/constants/statuses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePropostas, useCreateProposta, useUpdateProposta, useDeleteProposta, useProcessosDropdown } from "@/hooks/usePropostas";

interface PropostaFormState {
  processoId: string;
  valor: string;
  status: string;
  margem: string;
  impostos: string;
}

const EMPTY_FORM: PropostaFormState = {
  processoId: "",
  valor: "",
  status: "Rascunho",
  margem: "",
  impostos: "",
};

export default function Propostas() {
  const { canCreate } = useAuth();
  const { toast } = useToast();

  const { data: propostas, isLoading } = usePropostas();
  const { data: processos } = useProcessosDropdown();
  const criarProposta = useCreateProposta();
  const editarProposta = useUpdateProposta();
  const deletarProposta = useDeleteProposta();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<PropostaFormState>(EMPTY_FORM);

  const resetForm = () => setForm(EMPTY_FORM);

  const updateForm = (field: keyof PropostaFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ─── Create ────────────────────────────────

  const handleCreate = async () => {
    if (!form.processoId || !form.valor) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      await criarProposta.mutateAsync({
        processo_id: form.processoId,
        valor_total: parseFloat(form.valor),
        impostos: form.impostos ? parseFloat(form.impostos) : undefined,
        margem: form.margem ? parseFloat(form.margem) : undefined,
        status: form.status,
      });
      toast({ title: "Proposta criada com sucesso!" });
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      toast({
        title: "Erro ao criar proposta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // ─── Edit ──────────────────────────────────

  const openEditDialog = (proposta: NonNullable<typeof propostas>[number]) => {
    setEditTargetId(proposta.id);
    setForm({
      processoId: proposta.processo_id || "",
      valor: String(proposta.valor_total ?? ""),
      status: proposta.status || "Rascunho",
      margem: proposta.margem != null ? String(proposta.margem) : "",
      impostos: proposta.impostos != null ? String(proposta.impostos) : "",
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editTargetId || !form.valor) {
      toast({ title: "Preencha o valor", variant: "destructive" });
      return;
    }

    try {
      await editarProposta.mutateAsync({
        id: editTargetId,
        valor_total: parseFloat(form.valor),
        impostos: form.impostos ? parseFloat(form.impostos) : undefined,
        margem: form.margem ? parseFloat(form.margem) : undefined,
        status: form.status,
      });
      toast({ title: "Proposta atualizada!" });
      setEditDialogOpen(false);
      resetForm();
      setEditTargetId(null);
    } catch (error: unknown) {
      toast({
        title: "Erro ao atualizar proposta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // ─── Delete ────────────────────────────────

  const openDeleteDialog = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deletarProposta.mutateAsync(deleteTargetId);
      toast({ title: "Proposta removida!" });
    } catch (error: unknown) {
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  // ─── Render ────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Propostas</h1>
          <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-widest leading-none mt-1">
            Gestão de propostas comerciais
          </p>
        </div>

        {canCreate() && (
          <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Nova Proposta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Proposta</DialogTitle>
              </DialogHeader>
              <PropostaForm
                form={form}
                updateForm={updateForm}
                processos={processos}
                showProcessoSelect
                onSubmit={handleCreate}
                isPending={criarProposta.isPending}
                submitLabel="Salvar Proposta"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!propostas || propostas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-lg">
          <FileText className="h-12 w-12 mb-4 opacity-30" />
          <p>Nenhuma proposta cadastrada ainda.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-md border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                <TableHead>Processo</TableHead>
                <TableHead>Órgão</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propostas.map((prop) => {
                const badgeColor = PROPOSTA_STATUS_OPTIONS.find((s) => s.value === prop.status)?.color || "bg-slate-100";

                return (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">
                      {prop.processos?.numero_interno || "N/A"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={prop.processos?.editais?.orgao || ""}>
                      {prop.processos?.editais?.orgao || "-"}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(prop.valor_total || 0)}
                    </TableCell>
                    <TableCell>
                      {prop.margem ? `${prop.margem}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${badgeColor} border-0 shadow-none`}>
                        {prop.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(prop.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-amber-500"
                          onClick={() => openEditDialog(prop)}
                          title="Editar proposta"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600 focus:text-red-600"
                          onClick={() => openDeleteDialog(prop.id)}
                          title="Excluir proposta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { resetForm(); setEditTargetId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Proposta</DialogTitle>
          </DialogHeader>
          <PropostaForm
            form={form}
            updateForm={updateForm}
            onSubmit={handleEdit}
            isPending={editarProposta.isPending}
            submitLabel="Atualizar Proposta"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Proposta"
        description="Tem certeza que deseja excluir esta proposta? Os itens associados também serão removidos. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── Subcomponent: PropostaForm ──────────────

interface PropostaFormProps {
  form: PropostaFormState;
  updateForm: (field: keyof PropostaFormState, value: string) => void;
  processos?: Array<{ id: string; numero_interno: string; editais: { orgao: string; objeto: string } | null }>;
  showProcessoSelect?: boolean;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}

function PropostaForm({ form, updateForm, processos, showProcessoSelect, onSubmit, isPending, submitLabel }: PropostaFormProps) {
  return (
    <div className="space-y-4 py-4">
      {showProcessoSelect && processos && (
        <div className="space-y-2">
          <Label>Processo Vinculado</Label>
          <Select value={form.processoId} onValueChange={(v) => updateForm("processoId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o processo" />
            </SelectTrigger>
            <SelectContent>
              {processos.map((p) => {
                const orgao = p.editais?.orgao || "Sem órgão";
                return (
                  <SelectItem key={p.id} value={p.id}>
                    {p.numero_interno} - {orgao.length > 30 ? orgao.substring(0, 30) + "..." : orgao}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor Total (R$)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="Ex: 50000.00"
            value={form.valor}
            onChange={(e) => updateForm("valor", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPOSTA_STATUS_OPTIONS.map((so) => (
                <SelectItem key={so.value} value={so.value}>
                  {so.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Margem Lucro (%)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Ex: 15.5"
            value={form.margem}
            onChange={(e) => updateForm("margem", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Impostos (%)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Ex: 18"
            value={form.impostos}
            onChange={(e) => updateForm("impostos", e.target.value)}
          />
        </div>
      </div>

      <Button className="w-full mt-4" onClick={onSubmit} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        {submitLabel}
      </Button>
    </div>
  );
}
