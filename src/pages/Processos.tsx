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
} from "lucide-react";
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
  };
}

interface Edital {
  id: string;
  numero: string;
  objeto: string;
  orgao: string;
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

  // Form state
  const [novoNumero, setNovoNumero] = useState("");
  const [novoEditalId, setNovoEditalId] = useState("");
  const [novoStatus, setNovoStatus] = useState("em_andamento");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novoObs, setNovoObs] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [processosRes, editaisRes] = await Promise.all([
      supabase
        .from("processos")
        .select("*, editais(objeto, orgao, numero, status)")
        .order("created_at", { ascending: false }),
      supabase.from("editais").select("id, numero, objeto, orgao").order("created_at", { ascending: false }),
    ]);

    if (processosRes.data) setProcessos(processosRes.data as Processo[]);
    if (editaisRes.data) setEditais(editaisRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const novoEdital = searchParams.get("novo_edital");
    if (!loading && novoEdital && editais.length > 0) {
      const exists = editais.find(e => e.id === novoEdital);
      if (exists) {
        setNovoEditalId(novoEdital);
        setDialogOpen(true);
      }
      // Remove o parâmetro da URL para não reabrir em refresh
      setSearchParams(new URLSearchParams());
    }
  }, [loading, searchParams, editais, setSearchParams]);

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
              <Card key={proc.id} className="border-border/50 hover:shadow-md transition-all duration-200">
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
    </div>
  );
}
