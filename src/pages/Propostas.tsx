import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileCheck, Plus, Trash2, Edit2, FileText, Loader2, Save } from "lucide-react";
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
import { usePropostas, useCreateProposta, useDeleteProposta, useProcessosDropdown } from "@/hooks/usePropostas";

const STATUS_OPCOES = [
  { value: "Rascunho", bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  { value: "Enviada", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "Venceu", bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { value: "Perdeu", bg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
];

export default function Propostas() {
  const { canCreate } = useAuth();
  const { toast } = useToast();
  
  const { data: propostas, isLoading } = usePropostas();
  const { data: processos } = useProcessosDropdown();
  const criarProposta = useCreateProposta();
  const deletarProposta = useDeleteProposta();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoProcessoId, setNovoProcessoId] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoStatus, setNovoStatus] = useState("Rascunho");
  const [novaMargem, setNovaMargem] = useState("");
  const [novosImpostos, setNovosImpostos] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCreate = async () => {
    if (!novoProcessoId || !novoValor) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      await criarProposta.mutateAsync({
        processo_id: novoProcessoId,
        valor_total: parseFloat(novoValor),
        impostos: novosImpostos ? parseFloat(novosImpostos) : undefined,
        margem: novaMargem ? parseFloat(novaMargem) : undefined,
        status: novoStatus,
      });
      toast({ title: "Proposta criada com sucesso!" });
      setDialogOpen(false);
      
      // Reset form
      setNovoProcessoId("");
      setNovoValor("");
      setNovoStatus("Rascunho");
      setNovaMargem("");
      setNovosImpostos("");
    } catch (error: unknown) {
      toast({ title: "Erro ao criar proposta", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir esta proposta? Os itens dela também serão removidos.")) {
      try {
        await deletarProposta.mutateAsync(id);
        toast({ title: "Proposta removida!" });
      } catch (error: unknown) {
        toast({ title: "Erro ao remover", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
      }
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" />
            Propostas
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie suas propostas comerciais enviadas e em rascunho</p>
        </div>

        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Nova Proposta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Proposta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Processo Vinculado</Label>
                  <Select value={novoProcessoId} onValueChange={setNovoProcessoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o processo" />
                    </SelectTrigger>
                    <SelectContent>
                      {processos?.map((p) => {
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 50000.00"
                      value={novoValor}
                      onChange={(e) => setNovoValor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={novoStatus} onValueChange={setNovoStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPCOES.map((so) => (
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
                      value={novaMargem}
                      onChange={(e) => setNovaMargem(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Impostos (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 18"
                      value={novosImpostos}
                      onChange={(e) => setNovosImpostos(e.target.value)}
                    />
                  </div>
                </div>

                <Button className="w-full mt-4" onClick={handleCreate} disabled={criarProposta.isPending}>
                  {criarProposta.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Proposta
                </Button>
              </div>
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
                const badgeColor = STATUS_OPCOES.find((s) => s.value === prop.status)?.bg || "bg-slate-100";
                
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-amber-500">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(prop.id)}
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
    </div>
  );
}
