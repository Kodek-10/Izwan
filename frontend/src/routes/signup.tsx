import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IzwaLogo } from "@/components/izwan-logo";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import "./auth-layout.css";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (api.isAuthenticated()) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("settings.profile.pw_mismatch"));
      return;
    }
    setLoading(true);
    try {
      await api.signup(username, email, password, displayName || undefined);
      toast.success(t("auth.signup_success"));
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message || t("auth.signup_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel: Pattern & Branding */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-[var(--surface-container-low)] overflow-hidden items-center justify-center border-r border-[var(--outline-variant)]/30">
        <div className="absolute inset-0 bento-pattern opacity-40" />
        <div className="relative z-10 p-16 flex flex-col items-start max-w-lg">
          <div className="mb-12">
            <span className="text-[var(--primary)] font-headline-md text-2xl font-bold tracking-tight">Izwan</span>
          </div>
          <h1 className="font-display text-5xl text-[var(--primary)] leading-tight mb-6">
            Rejoignez la communauté Izwan
          </h1>
          <p className="text-[var(--on-surface-variant)] font-body-lg text-lg mb-12">
            Gérez vos snippets, automatisez vos workflows et collaborez avec une précision technique absolue dans notre environnement premium.
          </p>
          <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-[var(--outline-variant)]/30 relative bg-gradient-to-br from-[#e9e0e1] to-[#d5c2c5]">
            <div className="absolute inset-0 flex items-center justify-center">
              <IzwaLogo className="h-16 w-16 text-[var(--primary)] opacity-20" />
            </div>
            <div className="absolute inset-0 bg-[var(--primary)]/5 mix-blend-overlay" />
          </div>
          <div className="mt-12 flex gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--surface)] bg-[var(--primary-container)] flex items-center justify-center text-white text-xs font-bold">JD</div>
              <div className="w-10 h-10 rounded-full border-2 border-[var(--surface)] bg-[var(--secondary)] flex items-center justify-center text-white text-xs font-bold">AL</div>
              <div className="w-10 h-10 rounded-full border-2 border-[var(--surface)] bg-[var(--tertiary)] flex items-center justify-center text-white text-xs font-bold">MK</div>
            </div>
            <span className="text-[var(--on-surface-variant)] text-sm font-medium self-center">+2k ingénieurs déjà inscrits</span>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[var(--surface-container-high)] rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[var(--primary-container)]/5 rounded-full blur-3xl opacity-50" />
      </section>

      {/* Right Panel: Form */}
      <section className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 md:px-12 lg:px-24">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-12 flex items-center gap-2">
          <IzwaLogo className="h-8 w-8 text-[var(--primary)]" />
          <span className="text-[var(--primary)] font-headline-md text-2xl font-bold">Izwan</span>
        </div>

        <div className="w-full max-w-md">
          <header className="mb-10">
            <h2 className="font-headline-lg text-3xl text-[var(--on-surface)] mb-2">Créer un compte</h2>
            <p className="text-[var(--on-surface-variant)] font-body-md">Prêt à porter votre code vers de nouveaux sommets ?</p>
          </header>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button className="auth-btn-social group" onClick={() => api.oauthLogin("google")}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium text-[var(--on-surface-variant)]">Google</span>
            </button>
            <button className="auth-btn-social group" onClick={() => api.oauthLogin("github")}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span className="text-sm font-medium text-[var(--on-surface-variant)]">GitHub</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-8">
            <div className="w-full h-px bg-[var(--outline-variant)]/30" />
            <span className="absolute px-4 bg-white text-[var(--on-surface-variant)] text-[10px] font-label-caps uppercase tracking-[0.1em]">
              ou avec email
            </span>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom d'utilisateur */}
            <div className="space-y-1.5">
              <label className="font-label-caps text-[var(--on-surface-variant)] px-1 uppercase tracking-wider" htmlFor="username">
                Nom d'utilisateur
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="jean_dupont"
                  className="auth-input pl-12"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            {/* Nom affiché (optionnel) */}
            <div className="space-y-1.5">
              <label className="font-label-caps text-[var(--on-surface-variant)] px-1 uppercase tracking-wider" htmlFor="displayName">
                Nom affiché (optionnel)
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  placeholder="Jean Dupont"
                  className="auth-input pl-12"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-label-caps text-[var(--on-surface-variant)] px-1 uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="jean@exemple.com"
                  className="auth-input pl-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="font-label-caps text-[var(--on-surface-variant)] px-1 uppercase tracking-wider" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="auth-input pl-12 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--outline)] hover:text-[var(--primary)] transition-colors"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {/* Confirmation */}
            <div className="space-y-1.5">
              <label className="font-label-caps text-[var(--on-surface-variant)] px-1 uppercase tracking-wider" htmlFor="password_confirm">
                Confirmation du mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="auth-input pl-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            {/* Terms */}
            <div className="flex items-start gap-3 py-2">
              <input className="auth-checkbox mt-1" id="terms" type="checkbox" required />
              <label htmlFor="terms" className="text-sm text-[var(--on-surface-variant)] leading-tight">
                J'accepte les <span className="text-[var(--primary)] font-semibold hover:underline cursor-pointer">Conditions d'utilisation</span> et la <span className="text-[var(--primary)] font-semibold hover:underline cursor-pointer">Politique de confidentialité</span>.
              </label>
            </div>
            {/* Submit */}
            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Créer un compte"}
            </button>
          </form>

          <footer className="mt-10 text-center">
            <p className="text-[var(--on-surface-variant)]">
              Déjà un compte ? <Link to="/auth" className="text-[var(--primary)] font-bold hover:underline">Connexion</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
