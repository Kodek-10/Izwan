import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Palette, User, Loader2, Sun, Moon, Lock, Save, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Paramètres — Izwan" }] }),
  loader: async () => {
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

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

function SettingsPage() {
  const { i18n } = useTranslation();
  const data = Route.useLoaderData();
  const { theme, setTheme } = useTheme();

  const [username, setUsername] = useState(data?.user?.username || "Utilisateur");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    if (data?.needsClientFetch) {
      const fetchUser = async () => {
        setIsLoading(true);
        try {
          const u = await api.get<{ username: string }>("/auth/me");
          setUsername(u.username);
        } catch {
          /* ignore */
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    }
  }, [data?.needsClientFetch]);

  const handleUpdateProfile = async () => {
    if (!username.trim()) return;
    setUpdatingProfile(true);
    try {
      await api.put("/auth/me", { username: username.trim() });
      toast.success("Profil mis à jour");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setIsChangingPw(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPw,
        new_password: newPw,
      });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Mot de passe changé avec succès");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setIsChangingPw(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre profil, votre apparence et votre sécurité.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Profil */}
        <section className="flex flex-col items-start gap-8 rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-7 md:flex-row md:p-8">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-2 border-border bg-muted md:h-28 md:w-28">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="w-full flex-grow space-y-6">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-foreground">Profil</h3>
              <p className="text-sm text-muted-foreground">Votre nom d'utilisateur sur Izwan.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Nom d'utilisateur
              </label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-background" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpdateProfile} disabled={updatingProfile || !username.trim()}>
                {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </div>
        </section>

        {/* Apparence */}
        <section className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-5 md:p-8">
          <div className="mb-6">
            <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Palette className="h-5 w-5 text-primary" /> Apparence
            </h3>
            <p className="text-sm text-muted-foreground">Thème et langue de l'interface.</p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
                  theme === "dark" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
                }`}
              >
                <Moon className="h-4 w-4" /> <span className="text-sm font-medium">Sombre</span>
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
                  theme === "light" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
                }`}
              >
                <Sun className="h-4 w-4" /> <span className="text-sm font-medium">Clair</span>
              </button>
            </div>
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Globe className="h-3.5 w-3.5" /> Langue
              </label>
              <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Mot de passe */}
        <section className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-12 md:p-8">
          <div className="mb-6">
            <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Lock className="h-5 w-5 text-primary" /> Mot de passe
            </h3>
            <p className="text-sm text-muted-foreground">Changez votre mot de passe pour sécuriser votre compte.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Mot de passe actuel</label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="bg-background" placeholder="••••••••" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="bg-background" placeholder="••••••••" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Confirmer</label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="bg-background" placeholder="••••••••" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleChangePassword} disabled={isChangingPw}>
              {isChangingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Enregistrer
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
