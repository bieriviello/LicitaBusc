import React, { useState, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    MapPin,
    Calendar,
    DollarSign,
    ExternalLink,
    Gavel,
    Info,
    Sparkles,
    Clock,
    Scale,
    FileText
} from "lucide-react";
import { ArquivosDialog } from "./ArquivosDialog";
import { AIAnalysisDialog } from "./AIAnalysisDialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { BaseEdital } from "@/integrations/comprasGov/types";
import { formatCurrency, formatDate, getSituacaoColor } from "@/lib/formatters";
import { PORTAL_NAMES } from "@/constants/comprasGov";

interface ContratacaoCardProps {
    edital: BaseEdital;
    onImportar?: (edital: BaseEdital) => void;
}

export const ContratacaoCard = React.memo(function ContratacaoCard({ edital, onImportar }: ContratacaoCardProps) {
    const [aiOpen, setAiOpen] = useState(false);
    
    const getPortalUrl = () => {
        if (edital.link) return edital.link;
        if (edital.portal === 'pncp') {
             return `https://pncp.gov.br/app/editais/${edital.cnpj}/${edital.raw.anoCompraPncp}/${edital.raw.sequencialCompraPncp}`;
        }
        return `https://comprasnet.gov.br/livre/pregao/pregao_detalhes.asp?coduasg=${edital.raw.uasg || edital.raw.co_uasg}&numprp=${edital.raw.numero_aviso || edital.raw.numero}`;
    };

    const portalLabel = PORTAL_NAMES[edital.portal] || edital.portal.toUpperCase();
    const situacao = (edital.raw.situacaoCompraNomePncp || edital.raw.ds_situacao_pregao || "Divulgada") as string;

    return (
        <Card className="border-border/50 hover:shadow-md transition-all duration-200 hover:border-primary/20">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground leading-snug line-clamp-2" title={edital.objeto}>
                            {edital.objeto || "Objeto não informado"}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            {portalLabel}
                        </Badge>
                        <Badge variant="secondary" className={`text-[10px] ${getSituacaoColor(situacao)}`}>
                            {situacao}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="truncate" title={edital.orgao}>{edital.orgao}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="truncate">{edital.municipio ? `${edital.municipio} - ${edital.uf}` : edital.uf || "Nacional"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Gavel className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="truncate">{edital.modalidade}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span>Publicado: {formatDate(edital.dataPublicacao)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-semibold text-foreground">{formatCurrency(edital.valor)}</span>
                    </div>
                    {edital.cnpj && (
                         <span className="text-[10px] text-muted-foreground font-mono">CNPJ: {edital.cnpj}</span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium pt-1">
                    {edital.numeroControle && <span>ID: {edital.numeroControle}</span>}
                    {edital.processo && (
                        <>
                            {edital.numeroControle && <span>•</span>}
                            <span>PROC: {edital.processo}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/30 overflow-x-auto pb-1">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 shrink-0">
                                <Info className="h-3 w-3" /> Detalhes
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Detalhes do Edital</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <section>
                                    <h4 className="font-semibold text-sm mb-1.5 text-primary flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Objeto
                                    </h4>
                                    <p className="text-sm text-foreground/80 leading-relaxed text-justify">{edital.objeto || "Não informado"}</p>
                                </section>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <DetailBox icon={<Building2 className="h-3.5 w-3.5"/>} label="Órgão / Entidade" value={edital.orgao} subValue={edital.cnpj ? `CNPJ: ${edital.cnpj}` : undefined} />
                                    <DetailBox icon={<MapPin className="h-3.5 w-3.5"/>} label="Localidade" value={edital.municipio || "Não informado"} subValue={edital.uf || "Brasil"} />
                                    <DetailBox icon={<Gavel className="h-3.5 w-3.5"/>} label="Modalidade" value={edital.modalidade} />
                                    <DetailBox icon={<DollarSign className="h-3.5 w-3.5"/>} label="Valor Estimado" value={formatCurrency(edital.valor)} valueClassName="text-emerald-600 dark:text-emerald-400 text-lg font-bold" />
                                    
                                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground font-medium text-[10px] uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                                            <Clock className="h-3.5 w-3.5 text-primary/60"/> Cronograma
                                        </p>
                                        <div className="text-xs space-y-1 font-medium">
                                            <div className="flex justify-between"><span>Publicação:</span> <span className="font-normal">{formatDate(edital.dataPublicacao)}</span></div>
                                            {edital.dataAbertura && <div className="flex justify-between"><span>Abertura:</span> <span className="font-normal">{formatDate(edital.dataAbertura)}</span></div>}
                                        </div>
                                    </div>

                                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                        <p className="text-muted-foreground font-medium text-[10px] uppercase mb-1.5 tracking-wider">Situação</p>
                                        <Badge variant="secondary" className={`text-[10px] ${getSituacaoColor(situacao)}`}>{situacao}</Badge>
                                        <div className="mt-2 space-y-1">
                                            {edital.processo && <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Processo: {edital.processo}</p>}
                                            {edital.numeroControle && <p className="text-[10px] text-muted-foreground">ID: {edital.numeroControle}</p>}
                                        </div>
                                    </div>
                                </div>

                                {(edital.raw.amparoLegalNome || edital.raw.informacaoComplementar) && (
                                    <div className="pt-4 mt-2 border-t border-border/50 space-y-3">
                                        {edital.raw.amparoLegalNome && (
                                            <div className="space-y-1.5 bg-muted/20 p-3 rounded border border-border/30 text-xs text-foreground/80">
                                                <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
                                                    <Scale className="h-3.5 w-3.5 text-primary/70" /> Amparo Legal
                                                </h4>
                                                <p className="leading-relaxed">{String(edital.raw.amparoLegalNome)} - {String(edital.raw.amparoLegalDescricao)}</p>
                                            </div>
                                        )}
                                        {edital.raw.informacaoComplementar && (
                                            <div className="space-y-1.5 bg-muted/20 p-3 rounded border border-border/30 text-xs text-foreground/80">
                                                <h4 className="font-semibold text-foreground">Informações Complementares</h4>
                                                <p className="whitespace-pre-wrap leading-relaxed">{String(edital.raw.informacaoComplementar)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 shrink-0" onClick={() => window.open(getPortalUrl(), "_blank")}>
                        <ExternalLink className="h-3 w-3" /> Ver no Portal
                    </Button>
                    
                    {edital.portal === 'pncp' && (
                         <ArquivosDialog 
                            cnpj={edital.cnpj!} 
                            ano={Number(edital.raw.anoCompraPncp)} 
                            sequencial={Number(edital.raw.sequencialCompraPncp)} 
                        />
                    )}

                    {onImportar && (
                        <Button size="sm" className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onImportar(edital)}>
                            <Gavel className="h-3.5 w-3.5" /> Acompanhar
                        </Button>
                    )}
                    
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary hover:bg-primary/10 shrink-0" title="Análise com IA" onClick={() => setAiOpen(true)}>
                        <Sparkles className="h-3.5 w-3.5" />
                    </Button>

                    <AIAnalysisDialog open={aiOpen} onOpenChange={setAiOpen} objeto={edital.objeto || ""} raw={edital.raw} />
                </div>
            </CardContent>
        </Card>
    );
});

interface DetailBoxProps {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    subValue?: string;
    valueClassName?: string;
}

function DetailBox({ icon, label, value, subValue, valueClassName = "" }: DetailBoxProps) {
    return (
        <div className="space-y-1 text-sm bg-muted/40 p-3 rounded-lg border border-border/50">
            <p className="text-muted-foreground font-medium text-[10px] uppercase flex items-center gap-1.5 mb-1.5 tracking-wider">
                {icon} {label}
            </p>
            <div className={`font-semibold leading-tight ${valueClassName}`}>{value}</div>
            {subValue && <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{subValue}</p>}
        </div>
    );
}


