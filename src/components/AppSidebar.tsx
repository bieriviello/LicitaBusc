import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  FileCheck,
  Package,
  Calendar,
  Bell,
  Trash
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
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
  { title: "Calendário", url: "/calendario", icon: Calendar },
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
  const { profile, role, signOut, user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
  } = useNotifications(user?.id);

  const initials = profile?.nome
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="LicitaBusc" className="w-10 h-10 rounded-xl shadow-lg shadow-primary/20 ring-4 ring-primary/10" />
          {!collapsed && (
            <div>
              <h2 className="font-bold text-sm text-foreground leading-none tracking-tight">LicitaBusc</h2>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-medium opacity-80">Gestão de Licitações</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-primary/5 group"
                      activeClassName="bg-primary/10 text-primary font-bold shadow-sm"
                    >
                      <item.icon className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                      <span className="text-sm tracking-tight">{item.title}</span>
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
              <div className="flex items-center gap-2 mt-0.5">
                  {role && (
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${roleColors[role] || ""}`}>
                      {roleLabels[role] || role}
                    </Badge>
                  )}
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="relative p-1 text-muted-foreground hover:text-primary transition-colors">
                        <Bell className="h-3.5 w-3.5" />
                        {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-destructive border-2 border-background rounded-full" />
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                       <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                          <h3 className="text-xs font-bold uppercase tracking-wider">Notificações</h3>
                          {unreadCount > 0 && <Badge className="h-4 text-[9px]">{unreadCount} novas</Badge>}
                       </div>
                       <ScrollArea className="h-64">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-xs italic">
                               Nenhuma notificação por enquanto.
                            </div>
                          ) : (
                            <div className="divide-y divide-border/40">
                               {notifications.map(n => (
                                 <div key={n.id} className={`p-3 transition-colors ${n.read ? 'opacity-60' : 'bg-primary/5'}`}>
                                    <div className="flex justify-between gap-2">
                                       <p className="text-xs font-bold leading-tight">{n.title}</p>
                                       <button onClick={() => deleteNotification(n.id)} className="text-muted-foreground hover:text-destructive">
                                          <Trash className="h-3 w-3" />
                                       </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                                    <div className="flex items-center justify-between mt-2">
                                       <span className="text-[9px] text-muted-foreground/60">{new Date(n.created_at).toLocaleDateString()}</span>
                                       {!n.read && (
                                          <button 
                                            onClick={() => markAsRead(n.id)}
                                            className="text-[9px] font-bold text-primary hover:underline"
                                          >
                                            Marcar como lida
                                          </button>
                                       )}
                                    </div>
                                 </div>
                               ))}
                            </div>
                          )}
                       </ScrollArea>
                    </PopoverContent>
                  </Popover>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
