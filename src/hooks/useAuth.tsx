import { createContext, useContext, ReactNode } from "react";
import type { Database } from "@/integrations/supabase/types";

// User tipo mockado para o hub funcionar sem login
type AppRole = Database["public"]["Enums"]["app_role"];

interface Profile {
  id: string;
  nome: string;
  email: string;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
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

// Perfil de Administrador Padrão (bypass login)
const DEFAULT_ADMIN_PROFILE: Profile = {
  id: "admin-user-id",
  nome: "Administrador LicitaBusc",
  email: "contato@licitabusc.com",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Sempre logado como admin para o Hub funcionar sem tela de login externa
  const profile = DEFAULT_ADMIN_PROFILE;
  const role: AppRole = "admin";
  const user = { id: profile.id, email: profile.email };
  const loading = false;

  const signIn = async () => { console.log("Login desativado - modo hub aberto"); };
  const signUp = async () => { console.log("Cadastro desativado - modo hub aberto"); };
  const signOut = async () => { console.log("Logout desativado - modo hub aberto"); };

  const hasRole = (r: AppRole) => role === r;
  const canCreate = () => true;
  const canManage = () => true;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        role, 
        loading, 
        signIn, 
        signUp, 
        signOut, 
        hasRole, 
        canCreate, 
        canManage 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
