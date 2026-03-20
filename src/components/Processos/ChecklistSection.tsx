import { Checkbox as CustomCheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import type { Processo } from "@/types/processos";

interface ChecklistSectionProps {
    processo: Processo;
    onUpdate: (checklist: any[]) => void;
}

const CHECKLIST_ITEMS = [
    "Balanço Patrimonial",
    "Certidões Negativas (Federal, RS, Municipal)",
    "Atestados de Capacidade Técnica",
    "Contrato Social / Estatuto",
    "Certidão de Falência",
    "CRC / Cadastro no Portal"
];

export function ChecklistSection({ processo, onUpdate }: ChecklistSectionProps) {
    const handleCheckChange = async (doc: string, checked: boolean) => {
        const current = processo.checklist || [];
        let next;
        if (current.find(c => c.label === doc)) {
            next = current.map(c => c.label === doc ? { ...c, completed: checked } : c);
        } else {
            next = [...current, { id: crypto.randomUUID(), label: doc, completed: checked }];
        }
        onUpdate(next);
    };

    return (
        <div className="space-y-3 p-4 border rounded-lg bg-card/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Checklist de Documentação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CHECKLIST_ITEMS.map(doc => {
                    const isCompleted = !!processo.checklist?.find(c => c.label === doc && c.completed);
                    return (
                        <div key={doc} className="flex items-center gap-2">
                            <CustomCheckbox
                                id={`doc-${doc}`}
                                checked={isCompleted}
                                onCheckedChange={(checked) => handleCheckChange(doc, !!checked)}
                            />
                            <Label htmlFor={`doc-${doc}`} className="text-xs cursor-pointer">{doc}</Label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
