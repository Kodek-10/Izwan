import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Monitor, Terminal, Puzzle, ExternalLink, Globe, Package } from "lucide-react";
import { Link } from "@tanstack/react-router";

// Liens de téléchargement STABLES : ils pointent toujours sur la dernière release publiée.
// (nécessite que les builds nomment les fichiers sans version — voir desktop/package.json `artifactName`.)
const REL = "https://github.com/Kodek-10/Izwan/releases/latest/download";
const DL = {
  windows: `${REL}/Izwan-Setup.exe`,
  appimage: `${REL}/Izwan.AppImage`,
  deb: `${REL}/Izwan.deb`,
};
// Extension VS Code publiée sur le Marketplace.
const EXTENSION_URL = "https://marketplace.visualstudio.com/items?itemName=kodek10.izwan-vscode";
const EXTENSION_ID = "kodek10.izwan-vscode";

type OS = "windows" | "linux" | "mac" | "other";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "mac";
  if (ua.includes("linux") && !ua.includes("android")) return "linux";
  return "other";
}

export function DownloadSection() {
  const [os, setOs] = useState<OS>("other");
  useEffect(() => setOs(detectOS()), []);

  const isWin = os === "windows";
  const isLinux = os === "linux";

  return (
    <section id="download" className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-24">
      <motion.div
        className="text-center mb-14 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Emportez Izwan partout</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Application de bureau, extension pour votre éditeur, ou directement dans le navigateur.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 relative overflow-hidden rounded-2xl p-8 border border-border/50 bg-card/90 shadow-sm"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Application de bureau</h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-lg">
              Une fenêtre native pour Izwan, avec recherche rapide (<span className="font-mono text-xs">Alt+Space</span>) et icône dans la barre système.
            </p>

            {/* Bouton principal selon l'OS détecté */}
            <div className="flex flex-col sm:flex-row gap-3">
              {os === "mac" ? (
                <Link
                  to="/signup"
                  className="flex-1 brand-gradient-bg text-white font-semibold px-6 py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Globe className="h-5 w-5" /> Ouvrir l'app web
                </Link>
              ) : (
                <a
                  href={isLinux ? DL.appimage : DL.windows}
                  className="flex-1 brand-gradient-bg text-white font-semibold px-6 py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  {isLinux ? "Télécharger pour Linux (.AppImage)" : "Télécharger pour Windows"}
                </a>
              )}
            </div>

            {/* Toutes les options */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Toutes les plateformes</p>
              <div className="flex flex-wrap gap-2">
                <DlPill href={DL.windows} icon={<Monitor className="h-4 w-4" />} label="Windows (.exe)" highlight={isWin} />
                <DlPill href={DL.appimage} icon={<Package className="h-4 w-4" />} label="Linux (.AppImage)" highlight={isLinux} />
                <DlPill href={DL.deb} icon={<Package className="h-4 w-4" />} label="Debian/Ubuntu (.deb)" />
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground"
                >
                  <Globe className="h-4 w-4" /> Version web
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Linux : <span className="font-mono">chmod +x Izwan.AppImage</span> puis double-clic, ou <span className="font-mono">sudo dpkg -i Izwan.deb</span>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Extension VS Code */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl p-8 border border-border/50 bg-card/90 shadow-sm flex flex-col"
        >
          <div className="absolute top-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-[60px]" />
          <div className="relative z-10 flex-1">
            <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Puzzle className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Extension VS Code</h3>
            <p className="text-muted-foreground mb-6">
              Capturez une sélection, insérez vos snippets et laissez l'IA travailler — sans quitter l'éditeur.
            </p>
          </div>
          <div className="relative z-10 space-y-3">
            <a
              href={EXTENSION_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-background text-primary border border-primary/20 font-medium px-5 py-3 rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" /> Voir sur le Marketplace
            </a>
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 border border-border px-3 py-2">
              <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="text-xs text-muted-foreground truncate">ext install {EXTENSION_ID}</code>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DlPill({ href, icon, label, highlight }: { href: string; icon: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
        highlight
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground"
      }`}
    >
      {icon} {label}
    </a>
  );
}
