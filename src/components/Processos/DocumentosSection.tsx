import { useState } from "react";
import { FileText, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { pdfService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import type { Processo } from "@/types/processos";

interface DocumentosSectionProps {
  processo: Processo;
  onRefresh?: () => void;
  onAnalyzeWithIA: (text: string) => void;
}

export function DocumentosSection({ processo, onRefresh, onAnalyzeWithIA }: DocumentosSectionProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleIAAnalysis = async (doc: { url: string; nome: string }) => {
    setAnalyzing(true);
    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const file = new File([blob], doc.nome, { type: "application/pdf" });
      const text = await pdfService.extractText(file);
      onAnalyzeWithIA(text);
    } catch (err) {
      toast({
        title: "Erro na leitura",
        description: "Não foi possível ler este PDF.",
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-card shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Documentos Adicionais (PDF/Edital)
        </h3>
        <FileUpload processoId={processo.id} onUploadComplete={() => onRefresh && onRefresh()} />
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
        {processo.documentos && processo.documentos.length > 0 ? (
          processo.documentos.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-muted/20 hover:bg-primary/5 rounded-lg border border-border/10 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-1.5 rounded-md bg-white border border-border/50 shadow-sm text-primary group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <FileText className="h-4 w-4 shrink-0" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold truncate text-foreground/80">{doc.nome}</span>
                  <span className="text-[9px] text-muted-foreground uppercase opacity-60">PDF Document</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] gap-2 px-3 font-bold border-primary/20 text-primary hover:bg-primary/10 transition-all shadow-sm"
                  onClick={() => handleIAAnalysis(doc)}
                  disabled={analyzing}
                >
                  {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Analisar IA
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => window.open(doc.url, "_blank")}
                  title="Abrir Documento"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground italic space-y-2">
            <FileText className="h-6 w-6 opacity-20" />
            <p className="text-[10px]">Nenhum documento anexado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
