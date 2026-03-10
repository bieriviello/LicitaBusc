import { FileCheck } from "lucide-react";

export default function Propostas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Propostas</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas propostas comerciais</p>
      </div>
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="text-center">
          <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Módulo de propostas — em breve</p>
        </div>
      </div>
    </div>
  );
}
