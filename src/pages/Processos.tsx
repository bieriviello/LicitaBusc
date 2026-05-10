import { useState, useMemo, useCallback } from "react";
import { FolderOpen, Loader2, Search } from "lucide-react";
import type { Processo } from '@/types/processos';
import { EditalDetailsDialog } from '@/components/Processos/EditalDetailsDialog';
import { useProcessos, useEditaisDropdown, useCreateProcesso, useUpdateProcessoStatus } from "@/hooks/useProcessos";
import { UasgProfile } from "@/components/UasgProfile";
import { useSearchParams } from "react-router-dom";

import { ProcessosHeader } from "@/components/Processos/ProcessosHeader";
import { ProcessosSearch } from "@/components/Processos/ProcessosSearch";
import { ProcessosBoard } from "@/components/Processos/ProcessosBoard";

export default function Processos() {
  const [searchParams] = useSearchParams();

  const { data: processos = [], isLoading: loadingProcessos, refetch } = useProcessos();
  const { data: editais = [], isLoading: loadingEditais } = useEditaisDropdown();
  const { mutateAsync: createProcesso } = useCreateProcesso();
  const { mutateAsync: updateProcessoStatus } = useUpdateProcessoStatus();

  const loading = loadingProcessos || loadingEditais;
  
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [uasgProfileOpen, setUasgProfileOpen] = useState(false);
  const [selectedOrgao, setSelectedOrgao] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const processosFiltrados = useMemo(() => {
    return processos.filter((p) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.numero_interno?.toLowerCase().includes(term) ||
        p.editais?.objeto?.toLowerCase().includes(term) ||
        p.editais?.orgao?.toLowerCase().includes(term)
      );
    });
  }, [processos, searchTerm]);

  const handleCardClick = useCallback((proc: Processo) => {
    setSelectedProcesso(proc);
    setDetailsOpen(true);
  }, []);

  const handleOrgaoClick = useCallback((orgao: string) => {
    setSelectedOrgao(orgao);
    setUasgProfileOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <ProcessosHeader editais={editais} createProcesso={createProcesso} />

      {!loading && processos.length > 0 && (
        <ProcessosSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Carregando processos...</p>
        </div>
      )}

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

      {!loading && processos.length > 0 && searchTerm && processosFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 opacity-30 mb-3" />
          <p className="text-sm font-medium">Nenhum processo encontrado para "{searchTerm}"</p>
          <button onClick={() => setSearchTerm("")} className="text-xs text-primary mt-2 hover:underline">Limpar busca</button>
        </div>
      )}

      {!loading && processos.length > 0 && (!searchTerm || processosFiltrados.length > 0) && (
        <ProcessosBoard
          processos={processos}
          processosFiltrados={processosFiltrados}
          updateProcessoStatus={updateProcessoStatus}
          onCardClick={handleCardClick}
          onOrgaoClick={handleOrgaoClick}
        />
      )}

      <EditalDetailsDialog
        processo={selectedProcesso}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onRefresh={refetch}
      />

      <UasgProfile
        orgao={selectedOrgao}
        open={uasgProfileOpen}
        onOpenChange={setUasgProfileOpen}
      />
    </div>
  );
}
