import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  user: User | null;
  profile: { id: string; nome: string; email: string } | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  canCreate: () => boolean;
  canManage: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({ id: "mock-user-123" } as User);
  const [profile, setProfile] = useState<{ id: string; nome: string; email: string } | null>({ 
    id: "mock-user-123", 
    nome: "Administrador (Local)", 
    email: "admin@local.test" 
  });
  const [role, setRole] = useState<AppRole | null>("admin");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Autenticação desativada temporariamente. Usuário mockado imediatamente.
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const hasRole = (r: AppRole) => role === r;
  const canCreate = () => role === "admin" || role === "comercial";
  const canManage = () => role === "admin";

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signIn, signUp, signOut, hasRole, canCreate, canManage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
