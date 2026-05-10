import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
    pagina: number;
    totalPaginas: number;
    totalRegistros: number;
    onPaginaChange: (pagina: number) => void;
}

export function PaginationControls({
    pagina,
    totalPaginas,
    totalRegistros,
    onPaginaChange,
}: PaginationControlsProps) {
    return (
        <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
                {totalRegistros.toLocaleString("pt-BR")} resultado{totalRegistros !== 1 ? "s" : ""} •
                Página {pagina} de {totalPaginas || 1}
            </p>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pagina <= 1}
                    onClick={() => onPaginaChange(1)}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pagina <= 1}
                    onClick={() => onPaginaChange(pagina - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pagina >= totalPaginas}
                    onClick={() => onPaginaChange(pagina + 1)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pagina >= totalPaginas}
                    onClick={() => onPaginaChange(totalPaginas)}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
