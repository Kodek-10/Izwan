import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  Zap, Code2, WifiOff, Search, Cpu, Monitor, FolderKanban,
  ShieldCheck, Check, ExternalLink, Mail, Terminal, Laptop,
  ArrowRight, Download, Sun, Moon
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IzwaLogo, IzwaWordmark } from "@/components/izwan-logo";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Izwan — Votre cerveau numérique pour le code" }],
  }),
  component: LandingPage,
});

const vsSource = 'attribute vec2 a_position;\nvarying vec2 v_texCoord;\nvoid main() {\n  v_texCoord = a_position * 0.5 + 0.5;\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}';

const fsSourceDark = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    vec3 color1 = vec3(0.053, 0.090, 0.145);
    vec3 color2 = vec3(0.910, 0.478, 0.392);
    
    float noise = 0.0;
    for(float i = 1.0; i < 4.0; i++) {
        p.x += 0.3 / i * sin(i * 3.0 * p.y + u_time * 0.5);
        p.y += 0.3 / i * cos(i * 3.0 * p.x + u_time * 0.5);
        noise += 0.1 / length(p);
    }
    
    vec3 finalColor = mix(color1, color2, clamp(noise * 0.4, 0.0, 1.0));
    gl_FragColor = vec4(finalColor, 1.0);
}`;

const fsSourceLight = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    vec3 color1 = vec3(0.945, 0.945, 0.965);
    vec3 color2 = vec3(0.960, 0.396, 0.326);
    
    float noise = 0.0;
    for(float i = 1.0; i < 4.0; i++) {
        p.x += 0.3 / i * sin(i * 3.0 * p.y + u_time * 0.5);
        p.y += 0.3 / i * cos(i * 3.0 * p.x + u_time * 0.5);
        noise += 0.1 / length(p);
    }
    
    vec3 finalColor = mix(color1, color2, clamp(noise * 0.4, 0.0, 1.0));
    gl_FragColor = vec4(finalColor, 1.0);
}`;

const GITHUB_RELEASES = "https://github.com/Kodek-10/Izwan/releases";

/* Framer Motion variants */
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const fsSource = isDark ? fsSourceDark : fsSourceLight;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    function resize() {
      if (!canvas || !gl) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.floor(canvas.clientWidth * ratio);
      const displayHeight = Math.floor(canvas.clientHeight * ratio);
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resize);
    resize();

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

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, "u_time")!;
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution")!;

    let startTime = Date.now();
    let animationId: number;

    const render = () => {
      const time = (Date.now() - startTime) / 1000;
      gl!.uniform1f(timeLocation, time);
      gl!.uniform2f(resolutionLocation, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <div className="min-h-screen font-sans text-foreground">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <IzwaLogo className="h-8 w-8 text-primary" />
            <IzwaWordmark size="sm" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Tarifs</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Thème">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link to="/auth" className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors text-sm font-medium px-4 py-2">
              Connexion
            </Link>
            <Link to="/signup">
              <Button className="bg-primary text-white hover:bg-primary/90 text-sm font-medium px-5 py-2.5 rounded-lg shadow-md">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="relative flex flex-col overflow-hidden text-foreground h-screen min-h-[600px]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
        {/* Overlay pour assurer lisibilité sur les deux thèmes */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-background/80 via-background/30 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 widescreen:px-8 pt-20 pb-24 md:pt-32 md:pb-40 flex-1 flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col gap-8">
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary-foreground border border-primary/25 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  <Zap className="h-3.5 w-3.5" />
                  Gratuit
                </span>
                <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary-foreground border border-primary/25 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  <Code2 className="h-3.5 w-3.5" />
                  Open source
                </span>
                <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary-foreground border border-primary/25 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  <WifiOff className="h-3.5 w-3.5" />
                  Fonctionne hors-ligne
                </span>
              </div>
              {/* Headline */}
              <div className="flex flex-col gap-4">
                <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  Votre <span className="text-primary">cerveau numérique</span> pour le code
                </h1>
                <p className="text-base md:text-lg text-foreground/80 max-w-2xl leading-relaxed">
                  Capturez, retrouvez et réutilisez vos snippets grâce à l'IA — en local et en toute confidentialité. Un espace de travail fluide, conçu pour les développeurs exigeants.
                </p>
              </div>
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <a href={GITHUB_RELEASES} target="_blank" rel="noreferrer" className="w-full sm:w-auto brand-gradient-bg text-white font-mono text-xs font-semibold px-8 py-4 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-lg">
                  <ExternalLink className="h-5 w-5" />
                  Télécharger pour Windows
                </a>
                <Link to="/signup" className="w-full sm:w-auto bg-background text-primary border border-primary/20 font-mono text-xs font-medium px-8 py-4 rounded-lg hover:bg-muted transition-all flex items-center justify-center gap-2 shadow-sm">
                  Ouvrir l'app web
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <p className="text-xs text-foreground/60 font-mono">Version 2.4.0 • Nécessite Windows 10+ ou macOS 12+</p>
            </div>
            {/* Right Column: Dashboard Visual */}
            <motion.div
              className="lg:col-span-6 relative hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <div
                className="glow-effect relative rounded-xl border border-primary/10 overflow-hidden bg-card shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                style={{ transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(2deg)'; }}
              >
                {/* Fake Window Header */}
                <div className="bg-muted border-b border-primary/10 h-10 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                {/* Fake App Content */}
                <div className="flex h-[400px]">
                  {/* Sidebar */}
                  <div className="w-48 bg-muted/50 border-r border-primary/10 p-4 flex flex-col gap-4 hidden sm:flex">
                    <div className="h-6 w-24 bg-primary/10 rounded" />
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="h-8 w-full bg-primary/10 rounded flex items-center px-2 border-l-2 border-primary">
                        <div className="h-2 w-16 bg-primary/60 rounded" />
                      </div>
                      <div className="h-8 w-full hover:bg-muted rounded flex items-center px-2">
                        <div className="h-2 w-20 bg-muted-foreground/40 rounded" />
                      </div>
                      <div className="h-8 w-full hover:bg-muted rounded flex items-center px-2">
                        <div className="h-2 w-12 bg-muted-foreground/40 rounded" />
                      </div>
                    </div>
                  </div>
                  {/* Main Area */}
                  <div className="flex-1 bg-background p-6 flex flex-col gap-4 relative overflow-hidden">
                    {/* Search Bar */}
                    <div className="h-10 w-full bg-muted rounded-lg border border-primary/20 flex items-center px-4 shadow-sm">
                      <Search className="h-4 w-4 text-muted-foreground mr-3" />
                      <div className="h-2 w-32 bg-muted-foreground/40 rounded" />
                    </div>
                    {/* Code Block Snippet */}
                    <div className="bg-muted rounded-lg p-4 flex-1 flex flex-col gap-3 border border-primary/10">
                      <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                        <div className="h-4 w-40 bg-foreground/80 rounded" />
                        <div className="h-5 w-16 bg-primary/10 text-primary rounded text-[10px] flex items-center justify-center font-bold font-mono">PYTHON</div>
                      </div>
                      <div className="font-mono text-sm text-muted-foreground mt-2 flex flex-col gap-2">
                        <div className="h-3 w-full bg-primary/10 rounded" />
                        <div className="h-3 w-5/6 bg-primary/10 rounded" />
                        <div className="h-3 w-3/4 bg-primary/10 rounded" />
                        <div className="h-3 w-full bg-primary/10 rounded mt-2" />
                        <div className="h-3 w-2/3 bg-primary/10 rounded" />
                      </div>
                    </div>
                    {/* Hover Detail Widget */}
                    <div className="absolute bottom-6 right-6 w-48 bg-card rounded-lg p-3 shadow-lg border border-primary/20">
                      <div className="h-2 w-20 bg-primary/60 rounded mb-2" />
                      <div className="h-1.5 w-full bg-muted-foreground/30 rounded mb-1" />
                      <div className="h-1.5 w-4/5 bg-muted-foreground/30 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Style) */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <motion.div 
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Une plateforme pensée pour votre flux</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Alimenté par une IA locale et conçu pour une organisation technique avancée.</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Feature 1: Snippet Management (Large) */}
          <motion.div 
            variants={fadeInUp} 
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className="lg:col-span-2 relative overflow-hidden rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-border/50 bg-card/90 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] transition-all duration-700 group-hover:bg-primary/10" />
            <div className="flex-1 z-10">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestion des Snippets</h3>
              <p className="text-muted-foreground leading-relaxed">
                Créez, éditez et organisez vos blocs de code dans des collections. Syntax-highlighting intelligent pour toutes les langues.
              </p>
            </div>
            <div className="w-full md:w-1/2 h-48 rounded-xl bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center z-10">
              <div className="flex flex-col gap-2 p-4 w-full opacity-80 max-w-xs">
                <div className="h-2 w-3/4 bg-foreground/10 rounded-full" />
                <div className="h-2 w-1/2 bg-primary/30 rounded-full" />
                <div className="h-2 w-2/3 bg-foreground/10 rounded-full" />
                <div className="h-2 w-4/5 bg-foreground/10 rounded-full mt-2" />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Offline AI (Tall) */}
          <motion.div 
            variants={fadeInUp} 
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className="relative rounded-2xl p-8 flex flex-col border border-border/50 bg-card/90 shadow-sm hover:shadow-md transition-shadow group overflow-hidden row-span-1 md:row-span-2"
          >
            <div className="absolute top-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-accent/10" />
            <div className="flex-1 z-10">
              <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <WifiOff className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">IA Locale</h3>
              <p className="text-muted-foreground leading-relaxed">
                Interagissez avec une IA directement sur votre machine. Zéro latence, confidentialité totale, même hors ligne.
              </p>
            </div>
            <div className="mt-6 z-10 flex-1 flex items-end justify-center">
              <div className="relative w-full aspect-square max-h-48 rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                <Cpu className="h-16 w-16 text-primary/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Search & Organization (Large) */}
          <motion.div 
            variants={fadeInUp} 
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className="lg:col-span-2 relative rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center border border-border/50 bg-card/90 shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
          >
            <div className="absolute bottom-0 left-1/2 w-80 h-40 bg-primary/5 rounded-full blur-[80px] -translate-x-1/2 transition-all duration-700 group-hover:bg-primary/10" />
            <div className="flex-1 z-10">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recherche & Organisation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Trouvez instantanément ce dont vous avez besoin grâce à un moteur de recherche sémantique et des collections intelligemment structurées.
              </p>
            </div>
            <div className="w-full md:w-1/2 h-48 rounded-xl bg-background border border-border flex items-center justify-center z-10">
              <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-full shadow-sm w-full max-w-xs">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">Rechercher des snippets...</span>
              </div>
            </div>
          </motion.div>

          {/* Feature 4: Multi-surface */}
          <motion.div 
            variants={fadeInUp} 
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className="relative rounded-2xl p-8 border border-border/50 bg-card/90 shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-accent/10" />
            <Monitor className="h-6 w-6 text-accent-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multi-surfaces</h3>
            <p className="text-muted-foreground">
              Synchronisez vos données entre Web, Desktop et CLI. Un accès universel à votre base de connaissances.
            </p>
          </motion.div>

          {/* Feature 5: Security */}
          <motion.div 
            variants={fadeInUp} 
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className="relative rounded-2xl p-8 border border-border/50 bg-card/90 shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-accent/10" />
            <ShieldCheck className="h-6 w-6 text-accent-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sécurité Avancée</h3>
            <p className="text-muted-foreground">
              Chiffrement de bout en bout pour toutes les données sensibles. Votre code reste entre vos mains.
            </p>
          </motion.div>

          {/* Feature 6: Smart Tags (2 cols) */}
          <motion.div 
            variants={fadeInUp} 
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className="lg:col-span-2 relative rounded-2xl p-8 border border-border/50 bg-card/90 shadow-sm hover:shadow-md transition-shadow group overflow-hidden flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="absolute top-0 right-0 w-80 h-40 bg-primary/5 rounded-full blur-[80px] transition-all duration-700 group-hover:bg-primary/10" />
            <div className="w-full md:w-1/2 h-48 rounded-xl bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center z-10 order-1 md:order-none">
              <div className="flex flex-wrap gap-2 p-4 max-w-sm">
                {['React', 'Python', 'Docker', 'Auth', 'API', 'DevOps'].map((tag) => (
                  <span key={tag} className="text-xs bg-muted border border-border px-2 py-1 rounded-full text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 z-10">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tags Intelligents</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organisez et retrouvez vos snippets par contexte, projet ou technologie. Les tags automatiques vous font gagner du temps au quotidien.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background z-0" />
        <div className="max-w-3xl mx-auto relative z-10 text-center space-y-6 p-8 md:p-12 rounded-3xl border border-border/50 bg-card/90 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Prêt à libérer votre productivité ?</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
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
      <footer className="border-t border-border/50 py-12 px-6 bg-background">
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
