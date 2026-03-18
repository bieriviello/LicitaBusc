import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Shield } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, nome);
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu e-mail para confirmar a conta.",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">LicitaBusc</h1>
          <p className="text-sm text-muted-foreground">Gestão de Licitações Públicas</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">{isLogin ? "Entrar" : "Criar conta"}</CardTitle>
            <CardDescription>
              {isLogin ? "Acesse sua conta para gerenciar licitações" : "Preencha os dados para criar sua conta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
