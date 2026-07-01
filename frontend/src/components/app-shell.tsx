import * as React from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Code2,
  Star,
  FolderKanban,
  Network,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  Shield,
  Loader2,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IzwaLogo, IzwaWordmark } from "./izwan-logo";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { FloatingAssistant } from "./floating-assistant";
import { CreateSnippetDialog } from "./create-snippet-dialog";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/snippets", label: "Snippets", icon: Code2 },
  { to: "/collections", label: "Collections", icon: FolderKanban },
  { to: "/favorites", label: "Favoris", icon: Star },
  { to: "/constellation", label: "Constellation", icon: Network },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const [user, setUser] = React.useState<{ username: string; role?: string } | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [hoveredDock, setHoveredDock] = React.useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);
  const [pressedDock, setPressedDock] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setCreateOpen(true);
    window.addEventListener("snippet:new", handler);
    return () => window.removeEventListener("snippet:new", handler);
  }, []);

  React.useEffect(() => {
    setMounted(true);
    if (api.isAuthenticated()) {
      api.get<{ username: string; role?: string }>("/auth/me").then(setUser).catch(() => {});
    }
  }, []);

  const getInitials = (name: string) => (name ? name.slice(0, 2).toUpperCase() : "??");

  React.useEffect(() => {
    setSelectedLabel(null);
  }, [location.pathname]);

  // --- Recherche sémantique globale ---
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    setShowResults(true);
    try {
      const results = await api.get<any[]>(`/search/semantic?query=${encodeURIComponent(q)}`);
      setSearchResults(results);
    } catch {
      /* ignore */
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    toast.success("Déconnecté");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <IzwaLogo className="h-8 w-8" />
            <span className="hidden sm:block"><IzwaWordmark size="md" /></span>
          </Link>

          {/* Recherche */}
          <div ref={searchRef} className="relative mx-auto w-full max-w-md">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground focus-within:ring-1 focus-within:ring-ring">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                placeholder="Rechercher des snippets, tags…"
                className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                suppressHydrationWarning
              />
            </div>
            {showResults && (
              <div className="absolute left-0 right-0 top-full mt-2 max-h-[360px] overflow-auto rounded-xl border border-border bg-popover p-2 shadow-xl">
                {searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        navigate({ to: "/snippets/$id", params: { id: s.id.toString() } });
                        setShowResults(false);
                        setSearchQuery("");
                      }}
                      className="block w-full rounded-lg p-3 text-left transition-colors hover:bg-muted"
                    >
                      <p className="truncate text-sm font-medium">{s.title}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{s.language}</p>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {isSearching ? "Recherche…" : "Aucun résultat"}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Thème">
              {mounted && (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune notification pour le moment.
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-sm font-semibold text-white outline-none"
                  suppressHydrationWarning
                >
                  {getInitials(user?.username || "")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user?.username || "Compte"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/export" })}>
                  <Download className="mr-2 h-4 w-4" /> Exportations
                </DropdownMenuItem>
                {user?.role === "ADMIN" && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield className="mr-2 h-4 w-4" /> Administration
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6">{children}</main>

      {/* Dock flottant avec effet tiroir */}
      <nav className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <div
                key={item.to}
                className="relative flex items-center h-10 rounded-full transition-all duration-300"
                onMouseEnter={() => setHoveredDock(item.to)}
                onMouseLeave={() => setHoveredDock(null)}
              >
                <Link
                  to={item.to}
                  onClick={(e) => {
                    if (active) {
                      e.preventDefault();
                      setSelectedLabel((prev) => (prev === item.to ? null : item.to));
                    }
                  }}
                  onMouseDown={() => setPressedDock(item.to)}
                  onMouseUp={() => setPressedDock(null)}
                  onMouseLeave={() => setPressedDock(null)}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors z-10"
                >
                  {active && (
                    <motion.span
                      layoutId="dock-active"
                      className="absolute inset-0 rounded-full gradient-brand"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className={`relative h-5 w-5 ${active ? "text-white" : "text-muted-foreground"} ${hoveredDock === item.to || pressedDock === item.to ? "scale-110" : ""} transition-transform`} />
                </Link>
                <AnimatePresence>
                  {(active || selectedLabel === item.to) && (
                    <motion.span
                      initial={{ width: 0, opacity: 0, x: -4 }}
                      animate={{ width: "auto", opacity: 1, x: 0 }}
                      exit={{ width: 0, opacity: 0, x: -4 }}
                      transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden pr-3 text-foreground"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Assistant flottant (panneau coulissant depuis la droite) */}
      <FloatingAssistant />
      <CreateSnippetDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
