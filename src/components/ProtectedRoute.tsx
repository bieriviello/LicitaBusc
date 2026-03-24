import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Wrapper que protege rotas autenticadas.
 * Mostra loading enquanto verifica sessão; redireciona para /auth se não logado.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
