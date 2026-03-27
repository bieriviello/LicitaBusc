import { useAuth } from "@/hooks/useAuth";
import { CreateProcessoDialog } from "./CreateProcessoDialog";
import { useState } from "react";
import type { Edital } from "@/types/processos";

interface ProcessosHeaderProps {
  editais: Edital[];
  createProcesso: (data: any) => Promise<any>;
}

export function ProcessosHeader({ editais, createProcesso }: ProcessosHeaderProps) {
  const { canCreate } = useAuth();
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Processos</h1>
        <p className="text-muted-foreground mt-1">Acompanhe os processos internos vinculados a editais</p>
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
