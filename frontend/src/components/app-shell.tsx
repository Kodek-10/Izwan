import * as React from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Code2,
  Star,
  FolderKanban,
  Sparkles,
  Download,
  Settings,
  Moon,
  Sun,
  Bell,
  Search,
  BarChart3,
  LogOut,
  User,
  Loader2,
  Menu,
  Network,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IzwaLogo, IzwaWordmark } from "./izwan-logo";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { useTranslation } from "react-i18next";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = React.useState<{ username: string } | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await api.get<{ username: string }>("/auth/me");
        setUser(u);
      } catch (e) {
        console.error("Failed to fetch user in shell", e);
      }
    };
    if (api.isAuthenticated()) {
      fetchUser();
    }
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };
  
  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/snippets", label: t("nav.snippets"), icon: Code2 },
    { to: "/favorites", label: t("nav.favorites"), icon: Star },
    { to: "/collections", label: t("nav.collections"), icon: FolderKanban },
    { to: "/constellation", label: "Constellation", icon: Network },
    { to: "/assistant", label: t("nav.assistant"), icon: Sparkles },
    { to: "/statistics", label: t("nav.statistics"), icon: BarChart3 },
    { to: "/export", label: t("nav.export"), icon: Download },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const { theme, toggle } = useTheme();
  const [hasUnread, setHasUnread] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const current = navItems.find((i) => location.pathname.startsWith(i.to));

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // State for Semantic Search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      const results = await api.get<any[]>(`/search/semantic?query=${encodeURIComponent(query)}`);
      setSearchResults(results);
    } catch (e) {
      console.error("Search error", e);
    } finally {
      setIsSearching(false);
    }
  };

  const notifications = [
    { id: 1, title: t("shell.notif_new_title"), description: t("shell.notif_new_desc"), time: t("shell.notif_new_time") },
    { id: 2, title: t("shell.notif_ai_title"), description: t("shell.notif_ai_desc"), time: t("shell.notif_ai_time") },
    { id: 3, title: t("shell.notif_welcome_title"), description: t("shell.notif_welcome_desc"), time: t("shell.notif_welcome_time") },
  ];

  const handleLogout = () => {
    api.logout();
    toast.success(t("shell.logout_success"));
    navigate({ to: "/auth" });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <IzwaLogo className="h-9 w-9" />
        <IzwaWordmark size="md" />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {active && (
                <motion.div
                  layoutId={mobileMenuOpen ? "sidebar-active-mobile" : "sidebar-active"}
                  className="absolute inset-0 bg-sidebar-accent rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-left outline-none group"
              suppressHydrationWarning
            >
              <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-sm font-semibold text-white transition-transform group-hover:scale-105">
                {getInitials(user?.username || "??")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username || t("shell.user_label")}</p>
                <p className="text-xs text-muted-foreground truncate">{t("shell.user_status")}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuLabel>{t("shell.account")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { navigate({ to: "/settings" }); setMobileMenuOpen(false); }}>
              <User className="mr-2 h-4 w-4" />
              <span>{t("shell.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { navigate({ to: "/settings" }); setMobileMenuOpen(false); }}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("nav.settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("shell.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/30 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t("shell.nav_menu")}</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg md:text-xl font-display font-semibold truncate max-w-[150px] sm:max-w-none">
              {current?.label ?? "Izwan"}
            </h1>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Semantic Search - Hidden on small mobile, visible from sm up */}
            <div ref={searchRef} className="relative hidden sm:block">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm w-40 md:w-80 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <input
                  placeholder={t("shell.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                  className="bg-transparent border-0 outline-none flex-1 text-foreground placeholder:text-muted-foreground text-xs md:text-sm"
                  suppressHydrationWarning
                />
              </div>

              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl max-h-[400px] overflow-auto z-50 w-[280px] sm:w-full"
                  >
                    <div className="p-2">
                      {searchResults.length > 0 ? (
                        searchResults.map((s, idx) => (
                          <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            key={s.id}
                            onClick={() => {
                              navigate({ to: `/snippets/${s.id}` });
                              setShowResults(false);
                              setSearchQuery("");
                            }}
                            className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border-b border-border last:border-0"
                          >
                            <p className="font-medium text-sm truncate">{s.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold shrink-0">
                                {s.language}
                              </span>
                              <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                            </div>
                          </motion.button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {isSearching ? t("shell.searching") : t("shell.no_results")}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Mobile-only Search Button for very small screens */}
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Search className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {mounted && (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </Button>
            
            <DropdownMenu onOpenChange={(open) => open && setHasUnread(false)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {hasUnread && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
                <DropdownMenuLabel>{t("shell.notifications")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-default">
                      <div className="flex justify-between w-full">
                        <span className="font-semibold text-sm">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-primary font-medium cursor-pointer">
                  {t("shell.mark_as_read")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
