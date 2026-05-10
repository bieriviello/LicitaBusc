import { useState, useCallback } from "react";
import { FileText, Search, AlertTriangle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComprasGovFilters } from "@/components/ComprasGovFilters";
import { ContratacaoCard } from "@/components/ContratacaoCard";
import { PaginationControls } from "@/components/PaginationControls";
import { useEditaisUnificados, type FiltrosUnificados } from "@/hooks/useComprasGov";
import { useAuth } from "@/hooks/useAuth";
import { useImportarEdital } from "@/hooks/useImportarEdital";
import { useMonitoramentos } from "@/hooks/useMonitoramentos";
import { MonitoramentosSidebar } from "@/components/Editais/MonitoramentosSidebar";

// Badge de label por portal
const PORTAL_BADGE: Record<string, { label: string; className: string }> = {
    pncp:       { label: "PNCP",        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    comprasgov: { label: "Legado 8.666",className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    pregao:     { label: "Pregão",      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
};

export default function Editais() {
    const { user } = useAuth();
    const importarEdital = useImportarEdital();

    const [filtros, setFiltros] = useState<FiltrosUnificados | null>(null);
    const [pagina, setPagina] = useState(1);
    
    const { 
        monitoramentos, 
        saveMonitoramento, 
        deleteMonitoramento 
    } = useMonitoramentos();

    const { data, isLoading, isError, error } = useEditaisUnificados(
        filtros ? { ...filtros, pagina } : null
    );

    const handleSaveMonitoramento = async (nome: string, termo: string) => {
        if (!user) return;
        await saveMonitoramento({
            user_id: user.id,
            nome,
            palavra_chave: termo,
            filtros: { modulo: "unificado" },
        });
    };

    const handleDeleteMonitoramento = async (id: string) => {
        await deleteMonitoramento(id);
    };

    const handleBuscar = (f: FiltrosUnificados) => {
        setPagina(1);
        setFiltros(f);
    };

    const handleImportar = useCallback(
        (edital: Parameters<typeof importarEdital.mutateAsync>[0]) => {
            importarEdital.mutateAsync(edital);
        },
        [importarEdital]
    );

    const handleExportCsv = useCallback(() => {
        if (!data?.editais.length) return;

        const sanitize = (value: string) => {
            // Previne CSV injection removendo caracteres perigosos no início
            let safe = String(value).replace(/"/g, '""');
            if (/^[=+\-@\t\r]/.test(safe)) safe = "'" + safe;
            return `"${safe}"`;
        };

        const headers = ["Portal", "Órgão", "Modalidade", "Objeto", "Publicação", "Valor Estimado"];
        const rows = data.editais.map((e) => [
            sanitize(e.portal),
            sanitize(e.orgao),
            sanitize(e.modalidade),
            sanitize(e.objeto || ""),
            sanitize(e.dataPublicacao || ""),
            sanitize(String(e.valor ?? "")),
        ]);

        const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `licitacoes_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [data]);

    const temErros = data && Object.keys(data.erros).length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Editais</h1>
                    <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-widest leading-none mt-1">
                        Busca unificada em Multiportais
                    </p>
                </div>
                {data && data.editais.length > 0 && (
                    <Button variant="outline" className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95" onClick={handleExportCsv}>
                        <Download className="h-4 w-4" />
                        Baixar CSV
                    </Button>
                )}
            </div>

            {/* Filtros + Monitoramentos */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <ComprasGovFilters
                        onBuscar={handleBuscar}
                        onSaveMonitoramento={handleSaveMonitoramento}
                        loading={isLoading}
                    />
                </div>

                <MonitoramentosSidebar 
                    monitoramentos={monitoramentos} 
                    onDelete={handleDeleteMonitoramento} 
                />
            </div>

            {/* Aviso de erros parciais */}
            {temErros && !isLoading && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-800 dark:text-amber-200">
                        <p className="font-semibold mb-1">Alguns portais não responderam:</p>
                        <ul className="space-y-0.5">
                            {data?.erros.pncp && <li>• PNCP: {data.erros.pncp}</li>}
                            {data?.erros.legado && <li>• Legado: {data.erros.legado}</li>}
                            {data?.erros.pregao && <li>• Pregões: {data.erros.pregao}</li>}
                        </ul>
                        <p className="mt-1 text-amber-700 dark:text-amber-300">Os resultados disponíveis dos portais que responderam estão sendo exibidos abaixo.</p>
                    </div>
                </div>
            )}

            {/* Estado inicial */}
            {!filtros && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="p-4 rounded-full bg-primary/5 mb-4">
                        <Search className="h-10 w-10 opacity-40" />
                    </div>
                    <p className="text-base font-medium">Busque licitações para começar</p>
                    <p className="text-sm mt-1">Os resultados virão de todos os portais ao mesmo tempo</p>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-sm font-medium">Consultando todos os portais simultaneamente...</p>
                    <div className="flex gap-2 mt-3">
                        {["PNCP", "Legado 8.666", "Pregões"].map((p) => (
                            <Badge key={p} variant="outline" className="text-[10px] animate-pulse">
                                {p}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Erro total */}
            {isError && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="p-4 rounded-full bg-destructive/10 mb-4">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <p className="text-base font-medium text-destructive">Erro na consulta</p>
                    <p className="text-sm mt-1 max-w-md text-center">
                        {(error as Error)?.message || "Não foi possível consultar as APIs."}
                    </p>
                </div>
            )}

            {/* Resultados */}
            {data && !isLoading && (
                <>
                    {/* Contadores por portal */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                            {data.editais.length} resultado{data.editais.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-muted-foreground text-xs">de</span>
                        {Object.entries(PORTAL_BADGE).map(([key, val]) => {
                            const count = data.totalPorPortal[key as keyof typeof data.totalPorPortal];
                            const temErro = !!data.erros[key as keyof typeof data.erros];
                            return (
                                <Badge
                                    key={key}
                                    variant="secondary"
                                    className={`gap-1 text-[11px] ${val.className} ${temErro ? "opacity-40 line-through" : ""}`}
                                >
                                    {val.label}: {temErro ? "erro" : count}
                                </Badge>
                            );
                        })}
                    </div>

                    {data.editais.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <FileText className="h-10 w-10 opacity-30 mb-3" />
                            <p className="text-base font-medium">Nenhum resultado encontrado</p>
                            <p className="text-sm mt-1">Tente ajustar os filtros ou a palavra-chave</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {data.editais.map((edital) => (
                                <ContratacaoCard
                                    key={`${edital.portal}-${edital.id}`}
                                    edital={edital}
                                    onImportar={handleImportar}
                                />
                            ))}
                        </div>
                    )}

                    <PaginationControls
                        pagina={pagina}
                        totalPaginas={data.totalPaginas}
                        totalRegistros={data.totalRegistros}
                        onPaginaChange={setPagina}
                    />
                </>
            )}
        </div>
    );
}
