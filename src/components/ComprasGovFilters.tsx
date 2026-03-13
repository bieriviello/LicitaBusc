import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MODALIDADES_PNCP, MODALIDADES_LEGADO, UFS_BRASIL } from "@/integrations/comprasGov/types";
import { Search, RotateCcw, Plus, Globe } from "lucide-react";

interface ComprasGovFiltersProps {
    onBuscar: (filtros: {
        dataInicial: string;
        dataFinal: string;
        modalidade: number;
        uf?: string;
        cnpjOrgao?: string;
        palavraChave?: string;
        modulo?: 'pncp' | 'legado' | 'pregao';
    }) => void;
    loading?: boolean;
    onSaveMonitoramento?: (nome: string, termo: string) => void;
}

function getDefaultDates() {
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    return {
        dataInicial: trintaDiasAtras.toISOString().split("T")[0],
        dataFinal: hoje.toISOString().split("T")[0],
    };
}

export function ComprasGovFilters({ onBuscar, onSaveMonitoramento, loading }: ComprasGovFiltersProps) {
    const defaults = getDefaultDates();
    const [dataInicial, setDataInicial] = useState(defaults.dataInicial);
    const [dataFinal, setDataFinal] = useState(defaults.dataFinal);
    const [modulo, setModulo] = useState<'pncp' | 'legado' | 'pregao'>('pncp');
    const [palavraChave, setPalavraChave] = useState("");
    const [modalidade, setModalidade] = useState("6");
    const [uf, setUf] = useState("");
    const [cnpjOrgao, setCnpjOrgao] = useState("");

    // Ajusta a modalidade ao trocar de módulo para evitar erros de código inválido
    useEffect(() => {
        if (modulo === 'legado') {
            setModalidade("5"); // Pregão (Legado)
        } else if (modulo === 'pncp') {
            setModalidade("6"); // Pregão Eletrônico (PNCP)
        }
    }, [modulo]);

    const handleBuscar = () => {
        onBuscar({
            dataInicial,
            dataFinal,
            modalidade: Number(modalidade),
            uf: uf || undefined,
            cnpjOrgao: cnpjOrgao || undefined,
            palavraChave: palavraChave || undefined,
            modulo,
        });
    };

    const handleReset = () => {
        const defaults = getDefaultDates();
        setDataInicial(defaults.dataInicial);
        setDataFinal(defaults.dataFinal);
        setModalidade(modulo === 'legado' ? "5" : "6");
        setUf("");
        setCnpjOrgao("");
        setPalavraChave("");
        setModulo('pncp');
    };

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
            {/* Busca por palavra-chave */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="palavraChave" className="text-sm font-semibold">Palavra-chave do Objeto</Label>
                    <Input
                        id="palavraChave"
                        type="text"
                        value={palavraChave}
                        onChange={(e) => setPalavraChave(e.target.value)}
                        placeholder="Ex: luva cirúrgica, seringa, equipamento médico, gaze..."
                        className="h-10 text-base"
                        onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                    />
                    <div className="absolute right-3 top-[34px] flex gap-2">
                        {palavraChave && (
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => {
                                    const nome = prompt("Dê um nome para este monitoramento:", palavraChave);
                                    if (nome && onSaveMonitoramento) onSaveMonitoramento(nome, palavraChave);
                                }}
                             >
                                <Plus className="h-3 w-3" />
                                Salvar Filtro
                             </Button>
                        )}
                    </div>
                </div>
                
                {/* Sugestões Rápidas: Foco Hospitalar */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">Filtro rápido da área da Saúde:</Label>
                    <div className="flex flex-wrap gap-2">
                        {["Medicamento", "Hospitalar", "Seringa", "Luva de Procedimento", "Gaze", "Cateter", "Fio Cirúrgico", "Soro", "Equipamento Médico"].map(termo => (
                            <Badge 
                                key={termo}
                                variant={palavraChave.toLowerCase() === termo.toLowerCase() ? "default" : "secondary"}
                                className="cursor-pointer hover:bg-primary/20 transition-colors py-1"
                                onClick={() => {
                                    setPalavraChave(termo);
                                    onBuscar({
                                        dataInicial,
                                        dataFinal,
                                        modalidade: Number(modalidade),
                                        uf: uf || undefined,
                                        cnpjOrgao: cnpjOrgao || undefined,
                                        palavraChave: termo,
                                    });
                                }}
                            >
                                {termo}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {modulo !== 'pregao' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="dataInicial" className="text-xs font-medium">Data Inicial</Label>
                            <Input
                                id="dataInicial"
                                type="date"
                                value={dataInicial}
                                onChange={(e) => setDataInicial(e.target.value)}
                                className="h-9"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dataFinal" className="text-xs font-medium">Data Final</Label>
                            <Input
                                id="dataFinal"
                                type="date"
                                value={dataFinal}
                                onChange={(e) => setDataFinal(e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <Label className="text-xs font-medium">Modalidade</Label>
                    <Select value={modalidade} onValueChange={setModalidade}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {(modulo === 'legado' ? MODALIDADES_LEGADO : MODALIDADES_PNCP).map((m) => (
                                <SelectItem key={m.codigo} value={String(m.codigo)}>
                                    {m.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-medium">UF</Label>
                    <Select value={uf} onValueChange={setUf}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {UFS_BRASIL.map((sigla) => (
                                <SelectItem key={sigla} value={sigla}>
                                    {sigla}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-xs font-medium">CNPJ Órgão</Label>
                    <Input
                        id="cnpj"
                        type="text"
                        value={cnpjOrgao}
                        onChange={(e) => setCnpjOrgao(e.target.value)}
                        placeholder="00.000.000/0000-00"
                        className="h-9"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-medium">Portal / Fonte</Label>
                    <Select value={modulo} onValueChange={(v: any) => setModulo(v)}>
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pncp">PNCP (Lei 14.133)</SelectItem>
                            <SelectItem value="legado">Compras.gov (Legado)</SelectItem>
                            <SelectItem value="pregao">Pregões (Legado)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {modulo === 'pregao' && (
                    <div className="lg:col-span-2 flex items-end pb-1.5 h-full">
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 w-full justify-center">
                            <Plus className="h-3 w-3" />
                            Mostrando apenas pregões ativos (não vencidos)
                        </Badge>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 pt-1">
                <Button onClick={handleBuscar} disabled={loading} className="gap-2">
                    <Search className="h-4 w-4" />
                    {loading ? "Buscando..." : "Buscar Licitações"}
                </Button>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Limpar
                </Button>
            </div>
        </div>
    );
}
