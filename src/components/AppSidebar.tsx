import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  FileCheck,
  Package,
  LogOut,
  Shield,
  Users,
  Calendar,
  Bell,
  Trash
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
        fetchNotifications();
        
        // Subscription para tempo real
        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
