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
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/settings")({
  head: ({ loaderData }: any) => ({ meta: [{ title: `${loaderData?.t?.('settings.title') || 'Paramètres'} — Izwan` }] }),
  loader: async () => {
    // We can't use useTranslation here, but we can return the title key
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

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const data = Route.useLoaderData();
  
  const tabs = [
    { id: "general", label: t("settings.tabs.general"), icon: SettingsIcon },
    { id: "profile", label: t("settings.tabs.profile"), icon: User },
    { id: "ai", label: t("settings.tabs.ai"), icon: Sparkles },
    { id: "editor", label: t("settings.tabs.editor"), icon: Code },
    { id: "shortcuts", label: t("settings.tabs.shortcuts"), icon: Keyboard },
    { id: "backup", label: t("settings.tabs.backup"), icon: Save },
    { id: "about", label: t("settings.tabs.about"), icon: Info },
  ];

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
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    if (!username.trim()) return;
    setIsUpdatingProfile(true);
    try {
      await api.put("/auth/me", { username });
      toast.success(t("common.success"));
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      toast.error(t("settings.profile.fill_fields"));
      return;
    }
    if (newPw !== confirmPw) {
      toast.error(t("settings.profile.pw_mismatch"));
      return;
    }
    setIsChangingPw(true);
    try {
      await api.post("/auth/change-password", { current_password: currentPw, new_password: newPw });
      toast.success(t("common.success"));
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
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
                  <Palette className="h-4 w-4" /> {t("settings.general.appearance")}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 border border-border gap-4">
                  <div className="space-y-0.5">
                    <Label>{t("settings.general.theme")}</Label>
                    <p className="text-xs text-muted-foreground">{t("settings.general.theme_desc")}</p>
                  </div>
                  <Select value={theme} onValueChange={() => toggle()}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">{t("settings.general.dark")}</SelectItem>
                      <SelectItem value="light">{t("settings.general.light")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" /> {t("settings.general.regional")}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 border border-border gap-4">
                  <div className="space-y-0.5">
                    <Label>{t("settings.general.language")}</Label>
                    <p className="text-xs text-muted-foreground">{t("settings.general.language_desc")}</p>
                  </div>
                  <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4" /> {t("settings.general.notifications")}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                    <Label className="text-sm">{t("settings.general.desktop_notif")}</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                    <Label className="text-sm">{t("settings.general.security_alerts")}</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("settings.profile.title")}</h3>
                <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t("settings.profile.username")}</Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                    />
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile || username === initialUser.username} className="w-full sm:w-auto gradient-brand text-white border-0">
                    {isUpdatingProfile && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("settings.profile.update_profile")}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" /> {t("settings.profile.security")}
                </h3>
                <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-2">
                    <Label htmlFor="current-pw">{t("settings.profile.current_pw")}</Label>
                    <Input id="current-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-pw">{t("settings.profile.new_pw")}</Label>
                    <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pw">{t("settings.profile.confirm_pw")}</Label>
                    <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  </div>
                  <Button onClick={handleChangePassword} disabled={isChangingPw} variant="secondary" className="w-full">
                    {isChangingPw && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("settings.profile.change_pw")}
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
                  {t("settings.ai.title")}
                </div>
                <p className="text-xs text-muted-foreground">{t("settings.ai.desc")}</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-sm">{t("settings.ai.auto_tags")}</Label>
                    <p className="hidden xs:block text-[10px] text-muted-foreground">{t("settings.ai.auto_tags_desc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-sm">{t("settings.ai.high_perf")}</Label>
                    <p className="hidden xs:block text-[10px] text-muted-foreground">{t("settings.ai.high_perf_desc")}</p>
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
                  <Label className="text-sm">{t("settings.editor.line_numbers")}</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-sm">{t("settings.editor.auto_complete")}</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-sm">{t("settings.editor.font_size")}</Label>
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
                { label: t("settings.shortcuts.new_snippet"), keys: "Ctrl + N" },
                { label: t("settings.shortcuts.global_search"), keys: "Ctrl + K" },
                { label: t("settings.shortcuts.save"), keys: "Ctrl + S" },
                { label: t("settings.shortcuts.open_assistant"), keys: "Ctrl + I" },
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
                  <Info className="h-4 w-4" /> {t("settings.backup.zone")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("settings.backup.desc")}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" variant="outline" onClick={() => navigate({ to: "/export" })}>
                  <Download className="h-4 w-4 mr-2" /> {t("settings.backup.export")}
                </Button>
                <Button className="flex-1" variant="outline">
                  <Save className="h-4 w-4 mr-2" /> {t("settings.backup.sync")}
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
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("settings.about.version")} 1.2.0-beta</p>
                </div>
              </div>
              <p className="max-w-md mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("settings.about.desc")}
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4 text-[10px] sm:text-xs text-muted-foreground">
                <a href="#" className="hover:text-primary underline">{t("settings.about.terms")}</a>
                <a href="#" className="hover:text-primary underline">{t("settings.about.privacy")}</a>
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
