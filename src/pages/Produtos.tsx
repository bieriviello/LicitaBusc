import { Package } from "lucide-react";

export default function Produtos() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Produtos</h1>
        <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-widest leading-none mt-1">
          Catálogo de produtos e preços
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="p-4 rounded-full bg-primary/5 mb-4">
          <Package className="h-10 w-10 opacity-30" />
        </div>
        <p className="text-base font-medium">Módulo de produtos</p>
        <p className="text-sm mt-1">Este módulo está em desenvolvimento e estará disponível em breve.</p>
      </div>
    </div>
  );
}
