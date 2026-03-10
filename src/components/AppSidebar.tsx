import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  FileCheck,
  Package,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Editais", url: "/editais", icon: FileText },
  { title: "Processos", url: "/processos", icon: FolderOpen },
  { title: "Propostas", url: "/propostas", icon: FileCheck },
  { title: "Produtos", url: "/produtos", icon: Package },
];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  comercial: "Comercial",
  juridico: "Jurídico",
};

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  comercial: "bg-primary/10 text-primary border-primary/20",
  juridico: "bg-accent text-accent-foreground border-border",
};

export function AppSidebar() {
  const { profile, role, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const initials = profile?.nome
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            LB
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sm text-foreground leading-none">LicitaBusc</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Gestão de Licitações</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.nome}</p>
              {role && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mt-0.5 ${roleColors[role] || ""}`}>
                  {roleLabels[role] || role}
                </Badge>
              )}
            </div>
          )}
          {!collapsed && (
            <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors p-1">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
