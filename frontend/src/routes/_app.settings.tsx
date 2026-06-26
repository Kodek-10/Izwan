import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Palette,
  Code,
  Key,
  User,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Copy,
  Trash2,
  Plus,
  Save,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/_app/settings")({
  head: ({ loaderData }: any) => ({
    meta: [
      {
        title: `${
          loaderData?.t?.("settings.title") || "Paramètres"
        } — Izwan`,
      },
    ],
  }),
  loader: async () => {
    if (typeof window === "undefined") {
      return { user: { username: "Utilisateur" }, needsClientFetch: true };
    }
    try {
      const user = await api.get<{ username: string; email?: string }>(
        "/auth/me"
      );
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
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
];

const TAB_SIZES = ["2", "4", "8"];

const MOCK_API_KEYS = [
  {
    name: "Clé de Production Principale",
    value: "iz_prod_************************",
    lastUsed: "hier",
    active: true,
  },
  {
    name: "Accès Développement Local",
    value: "iz_dev_************************",
    lastUsed: "2 jours",
    active: true,
  },
];

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const data = Route.useLoaderData();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState(
    data?.user || { username: "Utilisateur", email: "" }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState("4");
  const [ligatures, setLigatures] = useState(true);

  useEffect(() => {
    if (data?.needsClientFetch) {
      const fetch = async () => {
        setIsLoading(true);
        try {
          const u = await api.get<{ username: string; email?: string }>(
            "/auth/me"
          );
          setUser(u);
        } catch {
          /* ignore */
        } finally {
          setIsLoading(false);
        }
      };
      fetch();
    }
  }, [data?.needsClientFetch]);

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      await api.put("/auth/me", {
        username: user.username,
        email: user.email,
      });
      toast.success("Profil mis à jour");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez vos préférences utilisateur, thèmes et configurations d'API.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Section (Wide) */}
        <section className="md:col-span-8 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden group shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 border-border flex-shrink-0 shadow-sm bg-muted flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="flex-grow w-full space-y-6 relative">
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-1">
                Profil Public
              </h3>
              <p className="text-sm text-muted-foreground">
                Vos informations de base affichées aux autres membres de l'Équipe.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Nom d'affichage
                </label>
                <Input
                  value={user.username}
                  onChange={(e) =>
                    setUser((u) => ({ ...u, username: e.target.value }))
                  }
                  className="bg-background border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Adresse Email
                </label>
                <Input
                  type="email"
                  value={user.email || "alexandre@izwan.dev"}
                  onChange={(e) =>
                    setUser((u) => ({ ...u, email: e.target.value }))
                  }
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleUpdateProfile}
                disabled={updatingProfile}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updatingProfile && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </section>

        {/* Appearance (Square) */}
        <section className="md:col-span-4 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 md:p-8 flex flex-col shadow-sm">
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Apparence
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Personnalisez l'interface utilisateur.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center w-full justify-between p-4 rounded-lg border transition-all ${
                theme === "dark"
                  ? "border-primary ring-1 ring-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-foreground" />
                <span className="text-sm font-medium">Sombre</span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  theme === "dark"
                    ? "border-primary"
                    : "border-muted-foreground/20"
                }`}
              >
                {theme === "dark" && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                )}
              </div>
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center w-full justify-between p-4 rounded-lg border transition-all ${
                theme === "light"
                  ? "border-primary ring-1 ring-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5 text-foreground" />
                <span className="text-sm font-medium">Clair</span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  theme === "light"
                    ? "border-primary"
                    : "border-muted-foreground/20"
                }`}
              >
                {theme === "light" && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                )}
              </div>
            </button>
          </div>
        </section>

        {/* Editor Preferences */}
        <section className="md:col-span-6 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <h3 className="font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
            <Code className="h-5 w-5 text-tertiary" />
            Préférences Éditeur
          </h3>
          <p className="text-sm text-muted-foreground mb-8">
            Configuration de l'environnement de code.
          </p>
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Taille de police (px)
                </label>
                <span className="font-mono text-xs text-tertiary bg-muted px-2 py-1 rounded">
                  {fontSize}px
                </span>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => setFontSize(v[0])}
                max={24}
                min={10}
                step={1}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Taille de tabulation
              </label>
              <select
                value={tabSize}
                onChange={(e) => setTabSize(e.target.value)}
                className="bg-background border border-border rounded-lg px-4 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary appearance-none w-full shadow-sm"
              >
                {TAB_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s} espaces
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Changer la langue
              </label>
              <Select
                value={i18n.language}
                onValueChange={(val) => i18n.changeLanguage(val)}
              >
                <SelectTrigger className="bg-background border-border">
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
            <div className="pt-4 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={ligatures}
                    onChange={(e) => setLigatures(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border-2 border-border peer-checked:bg-tertiary peer-checked:border-tertiary transition-colors flex items-center justify-center">
                    {ligatures && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  Activer les ligatures de police
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* API Keys */}
        <section className="md:col-span-6 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 md:p-8 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Clés API
              </h3>
              <p className="text-sm text-muted-foreground">
                Gérez l'accès à l'API Izwan Constellation.
              </p>
            </div>
            <Button
              onClick={() => toast.info("Création de clé API non implémentée")}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle
            </Button>
          </div>
          <div className="flex-grow space-y-3">
            {MOCK_API_KEYS.map((key, i) => (
              <div
                key={i}
                className="bg-background rounded-lg p-4 flex items-center justify-between border border-border group hover:border-primary/50 transition-colors shadow-sm"
              >
                <div>
                  <div className="text-xs font-semibold text-foreground mb-1">
                    {key.name}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                    {key.value}
                    <span className="text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded text-[10px]">
                      Dernier usage : {key.lastUsed}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(key.value);
                      toast.success("Clé copiée");
                    }}
                    title="Copier"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toast.info("Révocation non implémentée")}
                    className="hover:text-destructive"
                    title="Révoquer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
