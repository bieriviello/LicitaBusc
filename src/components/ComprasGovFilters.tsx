import { useState } from "react";
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
import { UFS_BRASIL } from "@/integrations/comprasGov/types";
import { Search, RotateCcw, Plus } from "lucide-react";
import type { FiltrosUnificados } from "@/hooks/useComprasGov";

interface ComprasGovFiltersProps {
    onBuscar: (filtros: FiltrosUnificados) => void;
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

const SUGESTOES = [
    "Medicamento", "Hospitalar", "Seringa", "Luva de Procedimento",
    "Gaze", "Cateter", "Fio Cirúrgico", "Soro", "Equipamento Médico",
];

export function ComprasGovFilters({ onBuscar, onSaveMonitoramento, loading }: ComprasGovFiltersProps) {
    const defaults = getDefaultDates();
    const [dataInicial, setDataInicial] = useState(defaults.dataInicial);
    const [dataFinal, setDataFinal] = useState(defaults.dataFinal);
    const [palavraChave, setPalavraChave] = useState("");
    const [uf, setUf] = useState("");
    const [cnpjOrgao, setCnpjOrgao] = useState("");

    const buildFiltros = (kw?: string): FiltrosUnificados => ({
        dataInicial,
        dataFinal,
        palavraChave: kw ?? (palavraChave || undefined),
        uf: uf || undefined,
        cnpjOrgao: cnpjOrgao || undefined,
    });

    const handleBuscar = () => onBuscar(buildFiltros());

    const handleReset = () => {
        const d = getDefaultDates();
        setDataInicial(d.dataInicial);
        setDataFinal(d.dataFinal);
        setPalavraChave("");
        setUf("");
        setCnpjOrgao("");
    };

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
            {/* Palavra-chave */}
            <div className="space-y-2">
                <Label htmlFor="palavraChave" className="text-sm font-semibold">
                    Palavra-chave do Objeto
                </Label>
                <div className="relative">
                    <Input
                        id="palavraChave"
                        type="text"
                        value={palavraChave}
                        onChange={(e) => setPalavraChave(e.target.value)}
                        placeholder="Ex: luva cirúrgica, seringa, equipamento médico..."
                        className="h-10 text-base pr-32"
                        onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                    />
                    {palavraChave && onSaveMonitoramento && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-[10px] gap-1 px-2 text-primary hover:bg-primary/10"
                            onClick={() => {
                                const nome = prompt("Nome para este monitoramento:", palavraChave);
                                if (nome) onSaveMonitoramento(nome, palavraChave);
                            }}
                        >
                            <Plus className="h-3 w-3" />
                            Salvar Filtro
                        </Button>
                    )}
                </div>

                {/* Sugestões rápidas */}
                <div className="flex flex-wrap gap-1.5">
                    {SUGESTOES.map((termo) => (
                        <Badge
                            key={termo}
                            variant={palavraChave.toLowerCase() === termo.toLowerCase() ? "default" : "secondary"}
                            className="cursor-pointer hover:bg-primary/20 transition-colors py-0.5 text-[11px]"
                            onClick={() => {
                                setPalavraChave(termo);
                                onBuscar(buildFiltros(termo));
                            }}
                        >
                            {termo}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Filtros secundários */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                    <Label htmlFor="dataInicial" className="text-xs font-medium">Data Inicial</Label>
                    <Input
                        id="dataInicial"
                        type="date"
                        value={dataInicial}
                        onChange={(e) => setDataInicial(e.target.value)}
                        className="h-9"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="dataFinal" className="text-xs font-medium">Data Final</Label>
                    <Input
                        id="dataFinal"
                        type="date"
                        value={dataFinal}
                        onChange={(e) => setDataFinal(e.target.value)}
                        className="h-9"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">UF</Label>
                    <Select value={uf} onValueChange={setUf}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {UFS_BRASIL.map((sigla) => (
                                <SelectItem key={sigla} value={sigla}>{sigla}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
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
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-1">
                <Button onClick={handleBuscar} disabled={loading} className="gap-2">
                    <Search className="h-4 w-4" />
                    {loading ? "Buscando em todos os portais..." : "Buscar em Todos os Portais"}
                </Button>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Limpar
                </Button>
            </div>
        </div>
    );
}
