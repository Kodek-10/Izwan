import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Settings as SettingsIcon, Sparkles, Code, Keyboard, Save, Info, User, Lock, Loader2, Globe, Bell, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Paramètres — Izwan" }] }),
  loader: async () => {
    // On server, we can't access localStorage for the auth token.
    if (typeof window === "undefined") {
      return { user: { username: "Utilisateur" }, needsClientFetch: true };
    }

    try {
      const user = await api.get<{ username: string }>("/auth/me");
      return { user, needsClientFetch: false };
    } catch (e) {
      return { user: { username: "Utilisateur" }, needsClientFetch: false };
    }
  },
  component: SettingsPage,
});

const tabs = [
// ... (rest of tabs)
  { id: "general", label: "Général", icon: SettingsIcon },
  { id: "profile", label: "Profil & Sécurité", icon: User },
  { id: "ai", label: "IA & Assistant", icon: Sparkles },
  { id: "editor", label: "Éditeur", icon: Code },
  { id: "shortcuts", label: "Raccourcis", icon: Keyboard },
  { id: "backup", label: "Sauvegarde", icon: Save },
  { id: "about", label: "À propos", icon: Info },
];

function SettingsPage() {
  const data = Route.useLoaderData();
  const [user, setUser] = useState(data?.user || { username: "Utilisateur" });
  const initialUser = user;
  
  const [tab, setTab] = useState("general");
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  // Profile State
  const [username, setUsername] = useState(initialUser.username);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(false);
  
  // Update username if initialUser changes
  useEffect(() => {
    if (initialUser.username) {
      setUsername(initialUser.username);
    }
  }, [initialUser.username]);

  useEffect(() => {
    // If the loader ran on server, we need to re-fetch on client where token is available
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const u = await api.get<{ username: string }>("/auth/me");
          setUser(u);
          setUsername(u.username);
        } catch (e) {
          console.error("Failed to fetch user profile on client", e);
        } finally {
          setIsClientLoading(false);
        }
      };
      fetchOnClient();
    }
  }, [data?.needsClientFetch]);
  
  // Password State
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  if (isClientLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement de vos paramètres...</p>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    if (!username.trim()) return;
    setIsUpdatingProfile(true);
    try {
      await api.put("/auth/me", { username });
      toast.success("Profil mis à jour");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setIsChangingPw(true);
    try {
      await api.post("/auth/change-password", { current_password: currentPw, new_password: newPw });
      toast.success("Mot de passe modifié");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du changement");
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] gap-6 max-w-5xl mx-auto">
      <aside className="bg-card border border-border rounded-xl p-2 h-fit space-y-1 flex md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                tab === t.id ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted/50 text-muted-foreground"
              }`}
              suppressHydrationWarning
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </aside>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 min-h-[500px]">
        <h2 className="font-display font-semibold text-lg sm:text-xl mb-6 flex items-center gap-2">
          {(() => {
            const t = tabs.find((x) => x.id === tab);
            const Icon = t?.icon || SettingsIcon;
            return <><Icon className="h-5 w-5 text-primary" /> {t?.label}</>;
          })()}
        </h2>

        <div className="space-y-6">
          {tab === "general" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Apparence
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 border border-border gap-4">
                  <div className="space-y-0.5">
                    <Label>Thème de l'interface</Label>
                    <p className="text-xs text-muted-foreground">Basculez entre le mode clair et sombre.</p>
                  </div>
                  <Select value={theme} onValueChange={() => toggle()}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="light">Clair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Régional
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 border border-border gap-4">
                  <div className="space-y-0.5">
                    <Label>Langue</Label>
                    <p className="text-xs text-muted-foreground">Langue utilisée dans l'application.</p>
                  </div>
                  <Select defaultValue="fr">
                    <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English (Coming soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Notifications
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                    <Label className="text-sm">Notifications de bureau</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                    <Label className="text-sm">Alertes de sécurité</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profil Utilisateur</h3>
                <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                    />
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile || username === initialUser.username} className="w-full sm:w-auto gradient-brand text-white border-0">
                    {isUpdatingProfile && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Mettre à jour le profil
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Sécurité
                </h3>
                <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-2">
                    <Label htmlFor="current-pw">Mot de passe actuel</Label>
                    <Input id="current-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-pw">Nouveau mot de passe</Label>
                    <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pw">Confirmer le nouveau mot de passe</Label>
                    <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  </div>
                  <Button onClick={handleChangePassword} disabled={isChangingPw} variant="secondary" className="w-full">
                    {isChangingPw && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Changer le mot de passe
                  </Button>
                </div>
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Sparkles className="h-5 w-5" />
                  Configurations IA
                </div>
                <p className="text-xs text-muted-foreground">Personnalisez le comportement de l'assistant intelligent.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Auto-génération de tags</Label>
                    <p className="hidden xs:block text-[10px] text-muted-foreground">Suggérer des tags dès la création d'un snippet.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Modèle haute performance</Label>
                    <p className="hidden xs:block text-[10px] text-muted-foreground">Utiliser des modèles plus puissants.</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          )}

          {tab === "editor" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-sm">Numéros de ligne</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-sm">Auto-complétion</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-sm">Taille de la police</Label>
                  <Select defaultValue="14">
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12px</SelectItem>
                      <SelectItem value="14">14px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="18">18px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {tab === "shortcuts" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {[
                { label: "Nouveau snippet", keys: "Ctrl + N" },
                { label: "Recherche globale", keys: "Ctrl + K" },
                { label: "Sauvegarder", keys: "Ctrl + S" },
                { label: "Ouvrir l'assistant", keys: "Ctrl + I" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <span className="text-sm">{s.label}</span>
                  <kbd className="px-2 py-1 rounded bg-muted border border-border text-[10px] font-mono shrink-0">{s.keys}</kbd>
                </div>
              ))}
            </div>
          )}

          {tab === "backup" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-2">
                <h3 className="text-amber-500 font-semibold flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" /> Zone importante
                </h3>
                <p className="text-xs text-muted-foreground">Assurez-vous de sauvegarder régulièrement vos données localement ou sur le cloud.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" variant="outline" onClick={() => navigate({ to: "/export" })}>
                  <Download className="h-4 w-4 mr-2" /> Exporter les données
                </Button>
                <Button className="flex-1" variant="outline">
                  <Save className="h-4 w-4 mr-2" /> Cloud Sync (Beta)
                </Button>
              </div>
            </div>
          )}

          {tab === "about" && (
            <div className="space-y-6 animate-in fade-in duration-300 text-center py-4 sm:py-8">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20">
                  <Code className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold">Izwan</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Version 1.2.0-beta</p>
                </div>
              </div>
              <p className="max-w-md mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Izwan est un gestionnaire de snippets intelligent conçu pour les développeurs modernes. 
                Gérez, partagez et optimisez votre code avec l'aide de l'IA.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4 text-[10px] sm:text-xs text-muted-foreground">
                <a href="#" className="hover:text-primary underline">Conditions d'utilisation</a>
                <a href="#" className="hover:text-primary underline">Politique de confidentialité</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Download(props: any) {
  return <Save {...props} />
}
