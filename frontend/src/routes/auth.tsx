import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Code, Lock, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IzwaLogo } from "@/components/izwan-logo";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import "./auth-layout.css";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (api.isAuthenticated()) {
      api.get<{ role?: string }>("/auth/me")
        .then((me) => { navigate({ to: me.role === "ADMIN" ? "/admin" : "/dashboard" }); })
        .catch(() => { navigate({ to: "/dashboard" }); });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.login(username, password);
      toast.success(t("auth.login_success"));
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message || t("auth.invalid_credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page min-h-screen flex overflow-x-hidden bg-surface-container-lowest">
      {/* Left Panel */}
      <section className="hidden lg:flex w-1/2 min-h-screen relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2b121c] to-[#1a0c12]" />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/70 to-black/40" />
        <div className="relative z-20 flex flex-col items-center text-center max-w-lg px-8">
          <div className="mb-10">
            <span className="font-display text-5xl text-white font-black tracking-tighter">Izwan</span>
            <div className="h-1 w-12 bg-white mx-auto rounded-full mt-1" />
          </div>
          <h1 className="font-headline-lg text-3xl text-white mb-6 leading-tight">
            Maîtrisez votre code avec élégance
          </h1>
          <p className="font-body-lg text-lg text-white/80 max-w-md">
            Une plateforme de gestion de snippets conçue pour les artisans du logiciel exigeants. Structurez vos idées, accélérez votre workflow.
          </p>
          <div className="mt-10 glass-panel p-6 rounded-xl flex items-center gap-4 animate-pulse">
            <Code className="text-white h-8 w-8" />
            <div className="text-left">
              <div className="h-2 w-24 bg-white/30 rounded mb-2" />
              <div className="h-2 w-16 bg-white/20 rounded" />
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-surface-container-lowest">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <IzwaLogo className="h-8 w-8 text-primary" />
              <span className="font-headline-md text-2xl text-primary font-bold">Izwan</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-headline-lg text-3xl text-[var(--on-surface)]">Content de vous revoir</h2>
            <p className="text-[var(--on-surface-variant)] font-body-md text-lg">Entrez vos identifiants pour accéder à votre espace de travail.</p>
          </div>

          {/* Socials */}
          <div className="grid grid-cols-2 gap-4">
            <button className="auth-btn-social" onClick={() => toast("Google Auth coming soon")}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="auth-btn-social" onClick={() => toast("GitHub Auth coming soon")}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full h-px bg-[var(--outline-variant)]" />
            <span className="absolute px-4 bg-[var(--surface-container-lowest)] text-[var(--on-surface-variant)] font-label-caps text-[10px] tracking-[0.1em]">
              Ou continuer avec
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label htmlFor="identifier" className="block font-label-caps text-[var(--on-surface-variant)] mb-1">
                  Nom d'utilisateur ou Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--outline)]" />
                  <input id="identifier" name="identifier" type="text" autoComplete="username" required
                    placeholder="jean_dupont ou jean@exemple.com" className="auth-input pl-12"
                    value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
              </div>
              <div className="group">
                <label htmlFor="password" className="block font-label-c_List text-[var(--on-surface-variant)] mb-1">
                  Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--outline)]" />
                  <input id="password" name="password" type={showPw ? "text" : "password"}
                    autoComplete="current-password" required placeholder="••••••••"
                    className="auth-input pl-12 pr-12" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--outline)] hover:text-[var(--primary)] transition-colors"
                    onClick={() => setShowPw((s) => !s)}>
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="auth-checkbox" />
                <span className="font-body-sm text-[var(--on-surface-variant)] group-hover:text-[var(--on-surface)] transition-colors">
                  Se souvenir de moi
                </span>
              </label>
              <span className="font-body-sm text-[var(--primary)] font-semibold hover:underline cursor-pointer">
                Mot de passe oublié ?
              </span>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Connexion"}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="font-body-md text-[var(--on-surface-variant)]">
              Nouveau sur Izwan ?{" "}
              <Link to="/signup" className="text-[var(--primary)] font-bold hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>

          <footer className="pt-8 border-t border-[var(--outline-variant)]/20">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-label-caps text-[var(--outline)]">
              <span className="hover:text-[var(--primary)] transition-colors cursor-pointer">Aide</span>
              <span className="hover:text-[var(--primary)] transition-colors cursor-pointer">Confidentialité</span>
              <span className="hover:text-[var(--primary)] transition-colors cursor-pointer">Conditions</span>
            </div>
            <p className="text-center text-[10px] text-[var(--outline)]/60 mt-4">
              © {new Date().getFullYear()} Izwan. Tous droits réservés.
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
