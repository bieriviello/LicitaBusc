import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { STATUS_OPTIONS } from "@/types/processos";
import { useToast } from "@/hooks/use-toast";

import type { Processo } from "@/types/processos";

interface EditaisOptions {
  id: string;
  numero: string;
  objeto: string;
}

type CreateProcessoData = Omit<Processo, 'id' | 'created_at' | 'editais' | 'participacao_itens' | 'checklist' | 'documentos'>;

interface CreateProcessoDialogProps {
  editais: EditaisOptions[];
  onCreate: (data: CreateProcessoData) => Promise<void>;
  loading?: boolean;
}

export function CreateProcessoDialog({ editais, onCreate, loading }: CreateProcessoDialogProps) {
  const [open, setOpen] = useState(false);
  const [numero, setNumero] = useState("");
  const [editalId, setEditalId] = useState("");
  const [status, setStatus] = useState("em_andamento");
  const [prazo, setPrazo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!numero || !editalId) {
      toast({ title: "Atenção", description: "Preencha o número e selecione um edital.", variant: "destructive" });
      return;
    }
    
    try {
      await onCreate({
        numero_interno: numero,
        edital_id: editalId,
        status: status,
        prazo: prazo || null,
        observacoes: observacoes || null,
      });

      toast({ title: "Sucesso", description: `Processo ${numero} criado com sucesso!` });
      resetForm();
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Ocorreu um erro ao criar o processo.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setNumero("");
    setEditalId("");
    setStatus("em_andamento");
    setPrazo("");
    setObservacoes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <div className="space-y-4 pt-4">
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
            <Label>Edital Vinculado *</Label>
            <Select value={editalId} onValueChange={setEditalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um edital" />
              </SelectTrigger>
              <SelectContent>
                {editais.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum edital disponível
                  </SelectItem>
                ) : (
                  editais.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.numero} — {e.objeto?.substring(0, 50)}...
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
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
              <Label htmlFor="prazo">Prazo (Opcional)</Label>
              <Input
                id="prazo"
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações adicionais..."
              className="resize-none"
              rows={3}
            />
          </div>

          <Button onClick={handleCreate} className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar Processo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
