import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MODALIDADES_PNCP, UFS_BRASIL } from "@/integrations/comprasGov/types";
import { Search, RotateCcw } from "lucide-react";

interface ComprasGovFiltersProps {
    onBuscar: (filtros: {
        dataInicial: string;
        dataFinal: string;
        modalidade: number;
        uf?: string;
        cnpjOrgao?: string;
        palavraChave?: string;
    }) => void;
    loading?: boolean;
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

export function ComprasGovFilters({ onBuscar, loading }: ComprasGovFiltersProps) {
    const defaults = getDefaultDates();
    const [dataInicial, setDataInicial] = useState(defaults.dataInicial);
    const [dataFinal, setDataFinal] = useState(defaults.dataFinal);
    const [modalidade, setModalidade] = useState("6"); // Pregão Eletrônico
    const [uf, setUf] = useState("");
    const [cnpjOrgao, setCnpjOrgao] = useState("");
    const [palavraChave, setPalavraChave] = useState("");

    const handleBuscar = () => {
        onBuscar({
            dataInicial,
            dataFinal,
            modalidade: Number(modalidade),
            uf: uf || undefined,
            cnpjOrgao: cnpjOrgao || undefined,
            palavraChave: palavraChave || undefined,
        });
    };

    const handleReset = () => {
        const defaults = getDefaultDates();
        setDataInicial(defaults.dataInicial);
        setDataFinal(defaults.dataFinal);
        setModalidade("6");
        setUf("");
        setCnpjOrgao("");
        setPalavraChave("");
    };

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
            {/* Busca por palavra-chave */}
            <div className="space-y-2">
                <Label htmlFor="palavraChave" className="text-xs font-medium">Palavra-chave</Label>
                <Input
                    id="palavraChave"
                    type="text"
                    value={palavraChave}
                    onChange={(e) => setPalavraChave(e.target.value)}
                    placeholder="Ex: computador, mobiliário, serviço de limpeza..."
                    className="h-9"
                    onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

                <div className="space-y-2">
                    <Label className="text-xs font-medium">Modalidade</Label>
                    <Select value={modalidade} onValueChange={setModalidade}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {MODALIDADES_PNCP.map((m) => (
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
