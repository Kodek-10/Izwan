import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IzwaLogo, IzwaWordmark } from "@/components/izwan-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const ALLOWED_EXTENSION_REDIRECTS = [
  "vscode:",
  "vscode-insiders:",
  "izwan:",
];

function getExtensionRedirectUrl(token: string, search = window.location.search): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(search);
  const redirectUri = params.get("redirect_uri");
  const state = params.get("state");

  if (!redirectUri || !state) return null;

  try {
    const url = new URL(redirectUri);
    const isAllowedProtocol = ALLOWED_EXTENSION_REDIRECTS.includes(url.protocol);
    const isLegacyIzwanCallback = url.protocol === "izwan:" && url.hostname === "auth";
    const isVsCodeCallback = url.hostname === "kodek10.izwa-vscode" && url.pathname === "/auth";

    if (!isAllowedProtocol || (!isLegacyIzwanCallback && !isVsCodeCallback)) {
      return null;
    }

    url.hash = new URLSearchParams({ token, state }).toString();
    return url.toString();
  } catch {
    return null;
  }
}

function AuthPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!api.isAuthenticated()) {
      return;
    }

    const token = localStorage.getItem("token");
    const extensionRedirectUrl = token ? getExtensionRedirectUrl(token) : null;
    if (extensionRedirectUrl) {
      window.location.assign(extensionRedirectUrl);
      return;
    }

    navigate({ to: "/dashboard" });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = await api.login(username, password);
      toast.success(t("auth.login_success"));
      const extensionRedirectUrl = getExtensionRedirectUrl(auth.access_token);
      if (extensionRedirectUrl) {
        window.location.assign(extensionRedirectUrl);
        return;
      }
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message || t("auth.invalid_credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center shadow-xl shadow-primary/20 mb-2 transition-transform hover:rotate-6">
            <IzwaLogo className="h-10 w-10 text-white" />
          </div>
          <IzwaWordmark size="lg" />
          <p className="text-muted-foreground text-sm max-w-[280px]">
            {t("auth.tagline")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input
                id="username"
                placeholder={t("auth.username_placeholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 gradient-brand text-white border-0 hover:opacity-90 font-medium text-base shadow-lg shadow-primary/20" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.login")}
            </Button>
          </form>

        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t("auth.no_account")}{" "}
            <Link 
              to="/signup" 
              className="text-primary font-medium hover:underline"
            >
              {t("auth.create_account")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
