import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useArquivosPncp } from "@/hooks/useComprasGov";
import { FileDown, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArquivosDialogProps {
    cnpj: string;
    ano: number;
    sequencial: number;
}

export function ArquivosDialog({ cnpj, ano, sequencial }: ArquivosDialogProps) {
    const [open, setOpen] = useState(false);
    const { data: arquivos, isLoading, isError } = useArquivosPncp(cnpj, ano, sequencial, open);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <FileDown className="h-3 w-3" />
                    Arquivos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Arquivos e Anexos do Edital</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
                            <p className="text-sm">Buscando arquivos...</p>
                        </div>
                    )}

                    {isError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Não foi possível carregar os arquivos. Tente novamente mais tarde.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !isError && arquivos?.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Nenhum arquivo ou anexo foi encontrado para esta licitação.
                        </p>
                    )}

                    {!isLoading && !isError && arquivos && arquivos.length > 0 && (
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {arquivos.map((arq, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-muted/30 gap-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium leading-tight truncate" title={arq.titulo}>
                                                {arq.titulo}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {arq.tipoDocumentoNome}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => window.open(arq.url, "_blank")}
                                            className="shrink-0 gap-2"
                                        >
                                            <FileDown className="h-3 w-3" />
                                            Baixar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
