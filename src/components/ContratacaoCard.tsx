import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComprasGovContratacao } from "@/integrations/comprasGov/types";
import {
    Building2,
    MapPin,
    Calendar,
    DollarSign,
    ExternalLink,
    Gavel,
    Info,
    Scale,
    Clock
} from "lucide-react";
import { ArquivosDialog } from "./ArquivosDialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { BaseEdital } from "@/integrations/comprasGov/types";

interface ContratacaoCardProps {
    edital: BaseEdital;
    onImportar?: (edital: BaseEdital) => void;
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

export function ContratacaoCard({ edital, onImportar }: ContratacaoCardProps) {
    const pncpUrl = edital.link || (edital.portal === 'pncp' 
        ? `https://pncp.gov.br/app/editais/${edital.cnpj}/${edital.raw.anoCompraPncp}/${edital.raw.sequencialCompraPncp}`
        : `https://comprasnet.gov.br/livre/pregao/pregao_detalhes.asp?coduasg=${edital.raw.uasg || edital.raw.co_uasg}&numprp=${edital.raw.numero_aviso || edital.raw.numero}`);

    const portalLabel = {
        pncp: "PNCP",
        comprasgov: "Compras.gov",
        pregao: "Pregões"
    }[edital.portal];

    return (
        <Card className="border-border/50 hover:shadow-md transition-all duration-200 hover:border-primary/20">
            <CardContent className="p-4 space-y-3">
                {/* Header: Objeto + Status */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground leading-snug line-clamp-2">
                            {edital.objeto || "Objeto não informado"}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge
                            variant="secondary"
                            className="text-[10px] bg-primary/10 text-primary border-primary/20"
                        >
                            {portalLabel}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className={`text-[10px] ${getSituacaoColor(edital.raw.situacaoCompraNomePncp || edital.raw.ds_situacao_pregao || "Divulgada")}`}
                        >
                            {edital.raw.situacaoCompraNomePncp || edital.raw.ds_situacao_pregao || "Divulgada"}
                        </Badge>
                    </div>
                </div>

                {/* Informações do órgão */}
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="truncate" title={edital.orgao}>
                            {edital.orgao}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span>
                            {edital.municipio
                                ? `${edital.municipio} - ${edital.uf}`
                                : edital.uf || "Nacional"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Gavel className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span>{edital.modalidade}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span>Publicado: {formatDate(edital.dataPublicacao)}</span>
                    </div>
                </div>

                {/* Valores e CNPJ */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-semibold text-foreground">
                            {formatCurrency(edital.valor)}
                        </span>
                    </div>
                    {edital.cnpj && (
                         <span className="text-[10px] text-muted-foreground font-mono">
                            CNPJ: {edital.cnpj}
                        </span>
                    )}
                </div>

                {/* Número + Processo */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {edital.numeroControle && <span>ID: {edital.numeroControle}</span>}
                    {edital.processo && (
                        <>
                            {edital.numeroControle && <span>•</span>}
                            <span>Proc: {edital.processo}</span>
                        </>
                    )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/30 overflow-x-auto pb-1">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 shrink-0">
                                <Info className="h-3 w-3" />
                                Detalhes
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Detalhes do Edital</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm">Objeto</h4>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {edital.objeto || "Não informado"}
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1 text-sm bg-muted/40 p-3 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground font-medium flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5"/> Órgão / Entidade</p>
                                        <p className="font-medium">{edital.orgao}</p>
                                        {edital.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {edital.cnpj}</p>}
                                    </div>
                                    <div className="space-y-1 text-sm bg-muted/40 p-3 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/> Localidade</p>
                                        <p className="font-medium">{edital.municipio || "Não informado"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {edital.uf || "Brasil"}
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-sm bg-muted/40 p-3 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground font-medium flex items-center gap-1.5"><Gavel className="h-3.5 w-3.5"/> Modalidade</p>
                                        <p className="font-medium">
                                            {edital.modalidade}
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-sm bg-muted/40 p-3 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground font-medium flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5"/> Valor Estimado</p>
                                        <p className="font-medium text-emerald-600 dark:text-emerald-400 text-base">
                                            {formatCurrency(edital.valor)}
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-sm bg-muted/40 p-3 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground font-medium flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> Histórico de Datas</p>
                                        <p className="font-medium text-xs space-y-1.5 mt-1">
                                            <span className="block">Publicação: <span className="font-normal text-muted-foreground">{formatDate(edital.dataPublicacao)}</span></span>
                                            {edital.dataAbertura && <span className="block">Abertura: <span className="font-normal text-muted-foreground">{formatDate(edital.dataAbertura)}</span></span>}
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-sm bg-muted/40 p-3 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground font-medium mb-2">Situação Atual</p>
                                        <Badge className={`hover:bg-transparent cursor-default px-2 py-1 ${getSituacaoColor(edital.raw.situacaoCompraNomePncp || edital.raw.ds_situacao_pregao || "Divulgada")}`}>
                                            {edital.raw.situacaoCompraNomePncp || edital.raw.ds_situacao_pregao || "Divulgada"}
                                        </Badge>
                                        {edital.processo && (
                                            <p className="text-xs text-muted-foreground mt-2">Processo: {edital.processo}</p>
                                        )}
                                        {edital.numeroControle && <p className="text-xs text-muted-foreground mt-1">ID: {edital.numeroControle}</p>}
                                    </div>
                                </div>

                                {(edital.raw.amparoLegalNome || edital.raw.informacaoComplementar) && (
                                    <div className="pt-4 mt-2 border-t border-border/50 space-y-3">
                                        {edital.raw.amparoLegalNome && (
                                            <div className="space-y-1 bg-muted/20 p-3 rounded border border-border/30">
                                                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                                                    <Scale className="h-4 w-4 text-primary/70" /> Amparo Legal
                                                </h4>
                                                <p className="text-xs text-foreground/80 leading-relaxed">{edital.raw.amparoLegalNome} - {edital.raw.amparoLegalDescricao}</p>
                                            </div>
                                        )}
                                        {edital.raw.informacaoComplementar && (
                                            <div className="space-y-1 bg-muted/20 p-3 rounded border border-border/30">
                                                <h4 className="font-semibold text-sm">Informações Complementares</h4>
                                                <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">{edital.raw.informacaoComplementar}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 shrink-0"
                        onClick={() => window.open(pncpUrl, "_blank")}
                    >
                        <ExternalLink className="h-3 w-3" />
                        Ver no Portal
                    </Button>
                    {edital.portal === 'pncp' && (
                         <ArquivosDialog
                             cnpj={edital.cnpj!}
                             ano={edital.raw.anoCompraPncp}
                             sequencial={edital.raw.sequencialCompraPncp}
                         />
                    )}
                    {onImportar && (
                        <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => onImportar(edital)}
                        >
                            <Gavel className="h-3.5 w-3.5" />
                            Acompanhar Processo
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
