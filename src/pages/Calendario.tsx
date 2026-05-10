import { useState, useMemo } from "react";
import { useCalendarioProcessos } from "@/hooks/useCalendarioProcessos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Calendar as CalendarIcon, 
    Clock, 
    Building2, 
    FileText, 
    AlertTriangle,
    ChevronRight,
    Loader2
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export default function Calendario() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { data: processos = [], isLoading: loading } = useCalendarioProcessos();

    const deadlinesNoDia = useMemo(
        () => processos.filter(p => 
            p.prazo && isSameDay(parseISO(p.prazo), date || new Date())
        ),
        [processos, date]
    );

    const deadlinesSemana = useMemo(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
        return processos
            .filter(p => {
                if (!p.prazo) return false;
                return isWithinInterval(parseISO(p.prazo), { start, end });
            })
            .sort((a, b) => (a.prazo! > b.prazo! ? 1 : -1));
    }, [processos]);

    const diasComPrazo = useMemo(
        () => processos.map(p => parseISO(p.prazo!)),
        [processos]
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Calendário</h1>
                <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-widest leading-none mt-1">
                    Prazos e compromissos de licitações
                </p>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-sm">Carregando calendário...</p>
                </div>
            )}

            {!loading && (
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Calendário */}
                    <Card className="lg:col-span-5 border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                Seleção de Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                locale={ptBR}
                                className="rounded-md border-none"
                                modifiers={{ highlighted: diasComPrazo }}
                                modifiersClassNames={{
                                    highlighted: "bg-primary/20 text-primary font-bold border-b-2 border-primary"
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Detalhes do Dia e Semana */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Próximos na Semana */}
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        Prazos desta Semana
                                    </span>
                                    <Badge variant="outline">{deadlinesSemana.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[200px]">
                                    {deadlinesSemana.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <p className="text-sm italic">Nenhum prazo para esta semana.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/40">
                                            {deadlinesSemana.map((p) => (
                                                <div key={p.id} className="p-3 hover:bg-muted/30 transition-colors flex items-center justify-between">
                                                    <div className="min-w-0 pr-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded uppercase">
                                                                {format(parseISO(p.prazo!), "EEE, dd/MM", { locale: ptBR })}
                                                            </span>
                                                            <span className="text-xs font-semibold truncate">{p.numero_interno}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground truncate">{p.editais.objeto}</p>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Vencendo Hoje ou Data Selecionada */}
                        <Card className="border-primary/20 bg-primary/5 shadow-sm">
                            <CardHeader className="pb-3 border-b border-primary/10">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-primary" />
                                    Prazos em {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : "hoje"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                {deadlinesNoDia.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">Nenhum prazo para esta data.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {deadlinesNoDia.map((p) => (
                                            <div key={p.id} className="bg-card p-3 rounded-lg border border-border/50 shadow-sm flex items-start gap-3">
                                                <div className="p-2 bg-primary/10 rounded-full">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{p.numero_interno}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.editais.objeto}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                            <Building2 className="h-3 w-3" />
                                                            <span className="truncate">{p.editais.orgao}</span>
                                                        </div>
                                                        <Badge className="text-[9px] uppercase tracking-tighter h-4">
                                                            {p.status.replace("_", " ")}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
