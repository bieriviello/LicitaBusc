import { useState } from "react";
import { FileText, Search, AlertTriangle, Loader2, Download, Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComprasGovFilters } from "@/components/ComprasGovFilters";
import { ContratacaoCard } from "@/components/ContratacaoCard";
import { PaginationControls } from "@/components/PaginationControls";
import { useEditaisUnificados, type FiltrosUnificados } from "@/hooks/useComprasGov";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { BaseEdital } from "@/integrations/comprasGov/types";
import type { Json } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { useMonitoramentos } from "@/hooks/useMonitoramentos";

// Badge de label por portal
const PORTAL_BADGE: Record<string, { label: string; className: string }> = {
    pncp:       { label: "PNCP",        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    comprasgov: { label: "Legado 8.666",className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    pregao:     { label: "Pregão",      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
};

export default function Editais() {
    const { canCreate, user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

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

    const handleImportar = async (edital: BaseEdital) => {
        try {
            const { data: editalSalvo, error: insertError } = await supabase
                .from("editais")
                .insert({
                    numero: edital.numeroControle || edital.id,
                    orgao: edital.orgao,
                    objeto: edital.objeto || "Sem descrição",
                    data_abertura: edital.dataAbertura?.split("T")[0] || null,
                    status: "ativo",
                    raw_json: edital.raw as unknown as Json,
                })
                .select("id")
                .single();

            if (insertError) throw insertError;

            if (editalSalvo) {
                const numeroInterno =
                    edital.processo ||
                    `PROC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
                        .toString()
                        .padStart(4, "0")}`;
                const { error: procError } = await supabase.from("processos").insert({
                    edital_id: editalSalvo.id,
                    numero_interno: numeroInterno,
                    status: "triagem",
                    observacoes: `Importado de ${edital.portal.toUpperCase()}`,
                });
                if (procError) throw procError;
            }

            toast({ title: "✅ Importação concluída!", description: "Edital e processo criados." });
            navigate("/processos");
        } catch (err: unknown) {
            toast({
                title: "Erro ao importar",
                description: err instanceof Error ? err.message : "Erro desconhecido",
                variant: "destructive",
            });
        }
    };

    const handleExportCsv = () => {
        if (!data?.editais.length) return;
        const headers = ["Portal", "Órgão", "Modalidade", "Objeto", "Publicação", "Valor Estimado"];
        const rows = data.editais.map((e) => [
            `"${e.portal}"`,
            `"${e.orgao}"`,
            `"${e.modalidade}"`,
            `"${(e.objeto || "").replace(/"/g, '""')}"`,
            `"${e.dataPublicacao || ""}"`,
            `"${e.valor ?? ""}"`,
        ]);
        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `licitacoes_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Activity className="h-4 w-4 text-primary animate-pulse" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                            Monitoramentos
                        </h2>
                    </div>
                    <div className="glass-card p-5 space-y-4 min-h-[140px]">
                        {monitoramentos.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">
                                Nenhum monitoramento salvo.
                            </p>
                        ) : (
                            monitoramentos.map((m) => (
                                <div
                                    key={m.id}
                                    className="group flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">{m.nome}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Termo: {m.palavra_chave}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteMonitoramento(m.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
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
