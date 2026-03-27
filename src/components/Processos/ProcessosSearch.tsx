import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProcessosSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function ProcessosSearch({ searchTerm, setSearchTerm }: ProcessosSearchProps) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por processo, edital ou órgão..."
        className="pl-9 pr-8 bg-background"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
