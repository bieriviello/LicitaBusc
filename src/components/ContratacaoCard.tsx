import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComprasGovContratacao } from "@/integrations/comprasGov/types";
import {
    Building2,
    MapPin,
    Calendar,
    DollarSign,
    FileDown,
    ExternalLink,
    Gavel,
} from "lucide-react";
import { ArquivosDialog } from "./ArquivosDialog";

interface ContratacaoCardProps {
    contratacao: ComprasGovContratacao;
    onImportar?: (contratacao: ComprasGovContratacao) => void;
}

function formatCurrency(value: number | null): string {
    if (value === null || value === undefined) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    }).format(value);
}

function formatDate(dateString: string | null): string {
    if (!dateString) return "—";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
}

function getSituacaoColor(situacao: string): string {
    const map: Record<string, string> = {
        "Divulgada": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        "Aberta": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        "Encerrada": "bg-muted text-muted-foreground",
        "Suspensa": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        "Revogada": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        "Anulada": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return map[situacao] || "bg-muted text-muted-foreground";
}

export function ContratacaoCard({ contratacao, onImportar }: ContratacaoCardProps) {
    const pncpUrl = `https://pncp.gov.br/app/editais/${contratacao.orgaoEntidadeCnpj}/${contratacao.anoCompraPncp}/${contratacao.sequencialCompraPncp}`;

    return (
        <Card className="border-border/50 hover:shadow-md transition-all duration-200 hover:border-primary/20">
            <CardContent className="p-4 space-y-3">
                {/* Header: Objeto + Status */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground leading-snug line-clamp-2">
                            {contratacao.objetoCompra || "Objeto não informado"}
                        </p>
                    </div>
                    <Badge
                        variant="secondary"
                        className={`shrink-0 text-[10px] ${getSituacaoColor(contratacao.situacaoCompraNomePncp)}`}
                    >
                        {contratacao.situacaoCompraNomePncp}
                    </Badge>
                </div>

                {/* Informações do órgão */}
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="truncate" title={contratacao.unidadeOrgaoNomeUnidade}>
                            {contratacao.unidadeOrgaoNomeUnidade}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span>
                            {contratacao.unidadeOrgaoMunicipioNome
                                ? `${contratacao.unidadeOrgaoMunicipioNome} - ${contratacao.unidadeOrgaoUfSigla}`
                                : contratacao.unidadeOrgaoUfSigla}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Gavel className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span>{contratacao.modalidadeNome}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span>Publicado: {formatDate(contratacao.dataPublicacaoPncp)}</span>
                    </div>
                </div>

                {/* Valores e CNPJ */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-semibold text-foreground">
                            {formatCurrency(contratacao.valorTotalEstimado)}
                        </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                        CNPJ: {contratacao.orgaoEntidadeCnpj}
                    </span>
                </div>

                {/* Número PNCP + Processo */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>PNCP: {contratacao.numeroControlePNCP}</span>
                    {contratacao.processo && (
                        <>
                            <span>•</span>
                            <span>Proc: {contratacao.processo}</span>
                        </>
                    )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => window.open(pncpUrl, "_blank")}
                    >
                        <ExternalLink className="h-3 w-3" />
                        Ver no PNCP
                    </Button>
                    <ArquivosDialog
                        cnpj={contratacao.orgaoEntidadeCnpj}
                        ano={contratacao.anoCompraPncp}
                        sequencial={contratacao.sequencialCompraPncp}
                    />
                    {onImportar && (
                        <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => onImportar(contratacao)}
                        >
                            Acompanhar Processo
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
