import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  Zap,
  Code,
  WifiOff,
  Search,
  Cpu,
  Monitor,
  Folder,
  Shield,
  Check,
  Download,
  ExternalLink,
  Globe,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IzwaLogo, IzwaWordmark } from "@/components/izwan-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Izwan — Votre cerveau numérique pour le code" }],
  }),
  component: LandingPage,
});

const GITHUB_RELEASES = "https://github.com/Kodek-10/Izwan/releases";

function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();

    const vsSource = `attribute vec2 position;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  v_texCoord = position * 0.5 + 0.5;
}`;

    const fsSource = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;
void main() {
  vec2 uv = v_texCoord;
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec3 color1 = vec3(0.969, 0.957, 0.957);
  vec3 color2 = vec3(0.957, 0.875, 0.886);
  float noise = 0.0;
  for(float i = 1.0; i < 4.0; i++) {
    p.x += 0.3 / i * sin(i * 3.0 * p.y + u_time * 0.3);
    p.y += 0.3 / i * cos(i * 3.0 * p.x + u_time * 0.3);
    noise += 0.1 / length(p);
  }
  vec3 finalColor = mix(color1, color2, clamp(noise * 0.15, 0.0, 1.0));
  gl_FragColor = vec4(finalColor, 1.0);
}`;

    function createShader(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, "u_time")!;
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution")!;

    let startTime = Date.now();
    let animationId: number;

    const render = () => {
      const time = (Date.now() - startTime) / 1000;
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* WebGL Animated Background */}
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3">
          <IzwaLogo className="h-8 w-8 text-primary" />
          <IzwaWordmark size="sm" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Tarifs</a>
          <a href="#docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" className="text-sm font-medium">Se connecter</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-primary text-white hover:bg-primary/90 text-sm font-medium">S'inscrire</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-4 py-1.5 mb-8 border border-border/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-xs font-medium text-muted-foreground">V2.0 Maintenant disponible</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-primary mb-6 max-w-4xl leading-tight">
          Votre cerveau numérique pour le code
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Organisez, recherchez et réutilisez vos snippets de code à travers vos projets. Une puissante seconde mémoire pour les développeurs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/signup">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105">
              Commencer gratuitement
            </Button>
          </Link>
          <a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="px-8 py-6 text-base font-semibold rounded-xl border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all">
              <Download className="mr-2 h-5 w-5" />
              Télécharger localement
            </Button>
          </a>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="relative z-10 px-6 md:px-12 lg:px-20 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">Une plateforme pensée pour votre flux</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Alimenté par une IA locale et conçu pour une organisation technique avancée.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
          {/* Feature 1: Snippet Management (Large) */}
          <div className="lg:col-span-2 card-blur rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 group relative overflow-hidden hover:border-primary/30 transition-colors border border-border/50 bg-card/80 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] transition-all duration-700 group-hover:bg-primary/10" />
            <div className="flex-1 z-10">
              <div className="w-12 h-12 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-primary mb-2">Gestion des Snippets</h3>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Créez, éditez et organisez vos blocs de code dans des collections. Syntax-highlighting intelligent pour toutes les langues.
              </p>
            </div>
            <div className="w-full md:w-1/2 h-48 rounded-xl bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center z-10 shadow-inner">
              <div className="flex flex-col gap-2 p-4 w-full opacity-80">
                <div className="h-2 w-3/4 bg-muted-foreground/20 rounded-full" />
                <div className="h-2 w-1/2 bg-primary/20 rounded-full" />
                <div className="h-2 w-2/3 bg-muted-foreground/20 rounded-full" />
              </div>
            </div>
          </div>

          {/* Feature 2: Offline AI (Small) */}
          <div className="card-blur rounded-2xl p-8 flex flex-col justify-between group relative overflow-hidden hover:border-primary/30 transition-colors border border-border/50 bg-card/80 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-accent/10" />
            <div className="z-10">
              <div className="w-12 h-12 rounded-lg bg-accent/5 border border-accent/10 flex items-center justify-center mb-4">
                <WifiOff className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-primary mb-2">IA Locale</h3>
              <p className="font-sans text-base text-muted-foreground">
                Interagissez avec une IA directement sur votre machine. Zéro latence, confidentialité totale, même hors ligne.
              </p>
            </div>
            <div className="mt-6 z-10 w-full h-24 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
              <Cpu className="h-8 w-8 text-primary/20" />
            </div>
          </div>

          {/* Feature 3: Multi-surface (Small) */}
          <div className="card-blur rounded-2xl p-8 flex flex-col group relative overflow-hidden hover:border-primary/30 transition-colors border border-border/50 bg-card/80 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-accent/10" />
            <div className="w-12 h-12 rounded-lg bg-accent/5 border border-accent/10 flex items-center justify-center mb-4 z-10">
              <Monitor className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-primary z-10 mb-2">Multi-surfaces</h3>
            <p className="font-sans text-base text-muted-foreground z-10">
              Synchronisez vos données entre Web, Desktop et CLI. Un accès universel à votre base de connaissances.
            </p>
          </div>

          {/* Feature 4: Search & Organization (Large) */}
          <div className="lg:col-span-2 card-blur rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center group relative overflow-hidden hover:border-primary/30 transition-colors border border-border/50 bg-card/80 backdrop-blur-md">
            <div className="absolute bottom-0 left-1/2 w-80 h-40 bg-primary/5 rounded-full blur-[80px] -translate-x-1/2 transition-all duration-700 group-hover:bg-primary/10" />
            <div className="flex-1 z-10">
              <div className="w-12 h-12 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-primary mb-2">Recherche & Organisation</h3>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Trouvez instantanément ce dont vous avez besoin grâce à un moteur de recherche sémantique et des collections intelligemment structurées.
              </p>
            </div>
            <div className="w-full md:w-1/2 h-48 rounded-xl bg-background border border-border flex items-center justify-center z-10 shadow-inner">
              <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-full shadow-sm w-3/4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Rechercher des snippets...</span>
              </div>
            </div>
          </div>

          {/* Feature 5: Security (Small) */}
          <div className="card-blur rounded-2xl p-8 flex flex-col group relative overflow-hidden hover:border-primary/30 transition-colors border border-border/50 bg-card/80 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-accent/10" />
            <div className="w-12 h-12 rounded-lg bg-accent/5 border border-accent/10 flex items-center justify-center mb-4 z-10">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-primary z-10 mb-2">Sécurité Avancée</h3>
            <p className="font-sans text-base text-muted-foreground z-10">
              Chiffrement de bout en bout pour toutes les données sensibles. Votre code reste entre vos mains.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto p-12 rounded-3xl bg-gradient-to-br from-primary/5 to-background border border-border/50 shadow-2xl shadow-primary/5">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">Prêt à libérer votre productivité ?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Rejoinez les développeurs qui organisent leur savoir-faire avec Izwan. Commencez gratuitement dès maintenant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105">
                Créer un compte gratuit
              </Button>
            </Link>
            <a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="px-8 py-6 text-base font-semibold rounded-xl border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all">
                <ExternalLink className="mr-2 h-5 w-5" />
                Voir sur GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <IzwaLogo className="h-6 w-6 text-primary" />
            <span className="font-display font-semibold text-sm">Izwan</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">Licence</a>
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Izwan. Open source.</p>
        </div>
      </footer>
    </div>
  );
}
