import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Download,
  Search,
  Cpu,
  Layers,
  Wand2,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Github,
  ArrowRight,
  Monitor,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IzwaLogo, IzwaWordmark } from "@/components/izwan-logo";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Izwan — Votre cerveau numérique pour le code" }],
  }),
  component: LandingPage,
});

const GITHUB_RELEASES = "https://github.com/Kodek-10/Izwan/releases";

const features = [
  {
    icon: Search,
    title: "Recherche sémantique",
    desc: "Ne cherchez plus par mots-clés. Décrivez ce que fait le code : l'IA comprend l'intention, même si vous avez oublié le nom de la fonction.",
  },
  {
    icon: Cpu,
    title: "IA locale",
    desc: "Des modèles d'inférence légers qui tournent directement sur votre machine. Zéro latence, zéro dépendance au cloud.",
  },
  {
    icon: Layers,
    title: "Multi-surfaces",
    desc: "Vos snippets synchronisés entre l'application web, l'extension VS Code et le bureau.",
  },
  {
    icon: Wand2,
    title: "Organisation auto-magique",
    desc: "Fini les dossiers chaotiques : l'IA tague, catégorise et relie vos snippets automatiquement à la capture.",
  },
];

function LandingPage() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand">
              <IzwaLogo className="h-5 w-5 text-white" />
            </div>
            <IzwaWordmark size="md" />
          </div>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#privacy" className="transition-colors hover:text-foreground">Confidentialité</a>
            <a href="#download" className="transition-colors hover:text-foreground">Télécharger</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Thème">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/auth" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline">
              Connexion
            </Link>
            <Link to="/signup">
              <Button className="gradient-brand border-0 text-white hover:opacity-90">Commencer</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 flex flex-wrap gap-2">
            {["Gratuit", "Open source", "Fonctionne hors-ligne"].map((chip) => (
              <span key={chip} className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
                {chip}
              </span>
            ))}
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Votre <span className="gradient-text">cerveau numérique</span> pour le code
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Capturez, retrouvez et réutilisez vos snippets grâce à l'IA — en local et en
            toute confidentialité. Un espace de travail fluide, conçu pour les développeurs
            exigeants.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#download">
              <Button size="lg" className="w-full gradient-brand border-0 text-white hover:opacity-90 sm:w-auto">
                <Download className="mr-2 h-4 w-4" /> Télécharger
              </Button>
            </a>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Ouvrir l'app web <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Windows · Linux — open source, sans publicité
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glow rounded-xl border border-border bg-card p-3 shadow-lg"
        >
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
{`def verify_token(req, res, next):
    token = req.headers.get("Authorization")
    payload = jwt.decode(token, SECRET, ["HS256"])
    req.user = payload["sub"]
    return next()`}
            </pre>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
          Une architecture pensée pour le <span className="gradient-text">flow state</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          Pas de distraction, pas de latence. Vos connaissances techniques, indexées
          intelligemment et disponibles instantanément.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 rounded-2xl border border-border bg-card p-8 lg:grid-cols-2 lg:p-12">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              Confidentialité avancée
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              Vos snippets restent chez vous.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Votre code propriétaire ne doit jamais servir à entraîner des modèles tiers
              sans votre consentement. Izwan peut fonctionner 100 % hors-ligne, en mode
              air-gapped.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Recherche et IA locales (FastEmbed / Ollama)",
              "Stockage local SQLite",
              "Mode air-gapped : aucune sortie réseau",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
          Prêt à optimiser votre workflow ?
        </h2>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Téléchargez Izwan et commencez à construire votre base de connaissances.
        </p>
        <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          {[
            { icon: Monitor, os: "Windows", detail: "Installeur .exe · 64-bit" },
            { icon: Terminal, os: "Linux", detail: "AppImage / .deb · x86_64" },
          ].map((d) => {
            const Icon = d.icon;
            return (
              <a
                key={d.os}
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center transition-colors hover:border-primary/50"
              >
                <Icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-display text-lg font-semibold">{d.os}</p>
                  <p className="font-mono text-xs text-muted-foreground">{d.detail}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Télécharger
                </Button>
              </a>
            );
          })}
        </div>
        <p className="mt-6 text-center font-mono text-xs text-muted-foreground">macOS bientôt disponible</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <IzwaLogo className="h-5 w-5" />
            <span className="font-display font-semibold text-foreground">Izwan</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#privacy" className="transition-colors hover:text-foreground">Confidentialité</a>
            <a href={GITHUB_RELEASES} target="_blank" rel="noreferrer" className="flex items-center gap-1 transition-colors hover:text-foreground">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
          <p className="text-xs">© 2026 Izwan · Licence MIT</p>
        </div>
      </footer>
    </div>
  );
}
