import { useAuth } from "@/hooks/useAuth";
import { CreateProcessoDialog } from "./CreateProcessoDialog";
import { useState } from "react";
import type { Edital } from "@/types/processos";
import type { CreateProcessoInput } from "@/hooks/useProcessos";

interface ProcessosHeaderProps {
  editais: Edital[];
  createProcesso: (data: CreateProcessoInput) => Promise<unknown>;
}

export function ProcessosHeader({ editais, createProcesso }: ProcessosHeaderProps) {
  const { canCreate } = useAuth();
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Processos</h1>
        <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-widest leading-none mt-1">
          Acompanhamento de processos internos
        </p>
      </div>
      {canCreate() && (
        <CreateProcessoDialog
          editais={editais}
          onCreate={async (data) => {
            setSaving(true);
            try {
              await createProcesso(data);
            } finally {
              setSaving(false);
            }
          }}
          loading={saving}
        />
      )}
    </div>
  );
}
