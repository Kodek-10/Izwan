import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Code2,
  Cpu,
  ScrollText,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Sun,
  Moon,
  Settings,
  User,
} from "lucide-react";
import { IzwaLogo } from "@/components/izwan-logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { AdminSettingsDialog } from "@/components/admin-settings-dialog";
import { LogoutConfirmDialog } from "@/components/logout-confirm-dialog";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

// `done: false` = écran pas encore reconstruit (affiché en grisé, sans lien).
const adminNav = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true, done: true },
  { to: "/admin/users", label: "Utilisateurs", icon: Users, done: true },
  { to: "/admin/snippets", label: "Snippets", icon: Code2, done: true },
  { to: "/admin/ia-systeme", label: "IA & Système", icon: Cpu, done: true },
  { to: "/admin/audit", label: "Audit", icon: ScrollText, done: true },
  { to: "/admin/roles", label: "Rôles & permissions", icon: ShieldCheck, done: true },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem("admin-sidebar-collapsed") === "1");
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ role?: string; username?: string }>("/auth/me")
      .then((me) => {
        if (cancelled) return;
        if (me.role === "ADMIN") {
          setAllowed(true);
          setUsername(me.username || "");
        } else {
          setAllowed(false);
          navigate({ to: "/dashboard" });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAllowed(false);
        navigate({ to: "/auth" });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const toggleCollapse = () =>
    setCollapsed((c) => {
      localStorage.setItem("admin-sidebar-collapsed", c ? "0" : "1");
      return !c;
    });

  const handleLogout = async () => {
    await api.logout();
    navigate({ to: "/auth" });
  };

  if (allowed === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!allowed) return null;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar rétractable */}
      <aside
        className={`flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <IzwaLogo className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold leading-tight">Izwan</p>
              <p className="truncate text-xs text-muted-foreground">Admin Console</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            const base = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${collapsed ? "justify-center" : ""}`;
            if (!item.done) {
              return (
                <div
                  key={item.to}
                  title={collapsed ? `${item.label} (à venir)` : undefined}
                  className={`${base} cursor-not-allowed text-muted-foreground/40`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex w-full items-center justify-between truncate">
                      {item.label}
                      <span className="font-mono text-[10px] uppercase">bientôt</span>
                    </span>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`${base} transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setLogoutOpen(true)}
            title="Déconnexion"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Zone principale */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleCollapse} aria-label="Replier la barre latérale">
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            <span className="font-display text-lg font-semibold">Administration</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Thème">
              {mounted && (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-sm font-semibold text-white outline-none"
                  aria-label="Compte"
                >
                  {username ? username.slice(0, 2).toUpperCase() : <User className="h-4 w-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{username || "Administrateur"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLogoutOpen(true)} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <AdminSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        username={username}
        onUsernameChange={setUsername}
      />
      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={handleLogout} />
    </div>
  );
}
