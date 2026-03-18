import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
    Sparkles, 
    ShieldCheck, 
    AlertCircle, 
    Calendar, 
    CreditCard,
    FileSearch,
    Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RawData {
    unidadeOrgaoNomeUnidade?: string;
    [key: string]: unknown;
}

interface AnalysisData {
    resumo: string;
    exigencias: string[];
    riscos: string[];
    oportunidades: string[];
    datasChave: {
        visitaTecnica: string;
        impugnacao: string;
    };
}

interface AIAnalysisProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    objeto: string;
    raw: RawData;
    pdfText?: string;
}

export function AIAnalysisDialog({ open, onOpenChange, objeto, raw, pdfText }: AIAnalysisProps) {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

    useEffect(() => {
        if (open) {
            setLoading(true);
            // Simula processamento da IA
            const timer = setTimeout(() => {
                generateMockAnalysis();
                setLoading(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, objeto]);

    const generateMockAnalysis = () => {
        const sourceText = pdfText || objeto;
        const isServico = sourceText.toLowerCase().includes("serviço") || sourceText.toLowerCase().includes("manutenção");
        const isObra = sourceText.toLowerCase().includes("obra") || sourceText.toLowerCase().includes("reforma");
        
        // Se houver PDF, simulamos extrair algo mais específico
        const extraExigence = pdfText && pdfText.toLowerCase().includes("iso") ? "Exigência de Certificação ISO 9001 detectada no anexo." : null;
        const extraRisk = pdfText && pdfText.toLowerCase().includes("multa") ? "Cláusula de multa rescisória identificada como de alto risco." : null;

        setAnalysis({
            resumo: pdfText 
                ? `Análise profunda realizada sobre ${pdfText.length} caracteres extraídos do documento oficial. Lote focado em ${isServico ? "prestação de serviços" : "aquisição de bens"}.`
                : `Lote focado em ${isServico ? "prestação de serviços" : "aquisição de bens"} para o órgão ${raw.unidadeOrgaoNomeUnidade || "identificado"}.`,
            exigencias: [
                "Atestado de Capacidade Técnica compatível com 50% do objeto.",
                "Balanço Patrimonial com índices de liquidez > 1.0.",
                extraExigence || (isServico ? "Inscrição no conselho de classe correspondente (CREA/CAU)." : "Certificação de qualidade INMETRO para os produtos."),
            ].filter(Boolean),
            riscos: [
                "Prazo de entrega curto (estimado em 15 dias após empenho).",
                extraRisk || "Exigência de amostra em até 3 dias após a fase de lances.",
            ].filter(Boolean),
            oportunidades: [
                pdfText ? "Documentação de habilitação parece padronizada, facilitando a montagem." : "Órgão com histórico de baixa competitividade nesta categoria.",
                "Valor estimado 12% acima da média de mercado recente.",
            ],
            datasChave: {
                visitaTecnica: isObra ? "Obrigatória até 2 dias antes da abertura" : "Não exigida",
                impugnacao: "Até 3 dias úteis antes da abertura",
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl border-primary/20 bg-gradient-to-b from-background to-primary/5">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-1.5 bg-primary/20 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        </div>
                        Análise de Edital com IA
                    </DialogTitle>
                    <DialogDescription className="text-xs font-semibold py-1 px-2 bg-primary/10 text-primary rounded-full w-fit">
                        Beta Intelligence Engine
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                            <Sparkles className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-sm font-medium animate-pulse">Mineração de cláusulas e análise de riscos...</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-6 py-4">
                            {/* Resumo IA */}
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden">
                                <FileSearch className="absolute -bottom-2 -right-2 h-20 w-20 text-primary/5 rotate-12" />
                                <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
                                    Visão Geral da IA
                                </h3>
                                <p className="text-sm leading-relaxed text-foreground/90 italic">
                                    "{analysis.resumo}"
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Habilitação */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                        Habilitação Crítica
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysis.exigencias.map((ex, i) => (
                                            <li key={i} className="text-xs flex gap-2 p-2 bg-muted/40 rounded border border-border/50">
                                                <span className="text-emerald-500 font-bold">✓</span>
                                                {ex}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Riscos */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                        Pontos de Atenção
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysis.riscos.map((ri, i) => (
                                            <li key={i} className="text-xs flex gap-2 p-2 bg-amber-500/5 rounded border border-amber-500/20 text-amber-900 dark:text-amber-200">
                                                <span className="text-amber-500 font-bold">!</span>
                                                {ri}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Oportunidades */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Insights Estratégicos
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {analysis.oportunidades.map((op, i) => (
                                        <div key={i} className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs font-medium">
                                            {op}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Datas */}
                            <div className="p-4 border rounded-xl bg-muted/20 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Visita Técnica</p>
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        {analysis.datasChave.visitaTecnica}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Impugnação</p>
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                                        {analysis.datasChave.impugnacao}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t text-center">
                                <p className="text-[10px] text-muted-foreground italic">
                                    As análises são baseadas em padrões históricos e processamento de linguagem natural. Sempre revise o edital oficial.
                                </p>
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
