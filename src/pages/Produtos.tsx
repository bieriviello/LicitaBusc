import { Package } from "lucide-react";

export default function Produtos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Produtos</h1>
        <p className="text-muted-foreground mt-1">Catálogo de produtos e preços</p>
      </div>
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Módulo de produtos — em breve</p>
        </div>
      </div>
    </div>
  );
}
