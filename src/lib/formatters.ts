export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    }).format(value);
}

export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "—";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
}

export function getSituacaoColor(situacao: string): string {
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
