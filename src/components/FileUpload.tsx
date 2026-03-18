import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
    processoId: string;
    onUploadComplete: () => void;
}

export function FileUpload({ processoId, onUploadComplete }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast({
                title: "Arquivo inválido",
                description: "Por enquanto, suportamos apenas arquivos PDF.",
                variant: "destructive"
            });
            return;
        }

        setUploading(true);
        try {
            // 1. Upload para o Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${processoId}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('documentos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Pegar URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('documentos')
                .getPublicUrl(filePath);

            // 3. Salvar na tabela documentos
            const { error: dbError } = await supabase
                .from('documentos')
                .insert({
                    processo_id: processoId,
                    nome: file.name,
                    url: publicUrl
                });

            if (dbError) throw dbError;

            toast({
                title: "Sucesso!",
                description: "Arquivo enviado e vinculado ao processo.",
            });

            onUploadComplete();
        } catch (error: unknown) {
            toast({
                title: "Erro no upload",
                description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar o arquivo.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={uploading}
            />
            <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2 border-dashed border-primary/40 hover:border-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4" />
                )}
                Anexar PDF do Edital
            </Button>
        </div>
    );
}
