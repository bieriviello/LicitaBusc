import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout({ children }: { children?: ReactNode }) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Decorative Background Blob */}
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <header className="h-16 border-b border-border flex items-center px-6 gap-4 glass-nav">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
               <span className="text-xs font-semibold text-muted-foreground hidden sm:block uppercase tracking-wider">
                 {profile?.nome}
               </span>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 lg:p-10 z-0">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
