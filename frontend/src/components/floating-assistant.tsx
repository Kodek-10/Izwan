import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Send, Maximize2, X, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Comment trier une liste en Python ?",
  "Montre mes snippets sur l'authentification",
];
const MIN_W = 320;
const MAX_W = 640;

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(384);
  const widthRef = useRef(384);
  const resizing = useRef(false);

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Pousse le contenu de la page au lieu de le recouvrir (desktop uniquement).
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--assistant-push",
      open && !isMobile ? `${width}px` : "0px",
    );
    return () => document.documentElement.style.setProperty("--assistant-push", "0px");
  }, [open, width, isMobile]);

  useEffect(() => {
    const saved = Number(localStorage.getItem("assistant-width"));
    if (saved) {
      const w = Math.min(MAX_W, Math.max(MIN_W, saved));
      setWidth(w);
      widthRef.current = w;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // Écouter les événements d'explication envoyés depuis d'autres pages
  useEffect(() => {
    const handleEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.explanation) {
        setOpen(true);
        setMessages((prev) => [...prev, { role: "assistant", content: detail.explanation }]);
      }
    };
    window.addEventListener("assistant:explain", handleEvent);
    return () => window.removeEventListener("assistant:explain", handleEvent);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redimensionnement (poignée bord gauche), sans bloquer la page.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const w = Math.min(MAX_W, Math.max(MIN_W, window.innerWidth - e.clientX));
      widthRef.current = w;
      setWidth(w);
    };
    const onUp = () => {
      if (!resizing.current) return;
      resizing.current = false;
      document.body.style.userSelect = "";
      localStorage.setItem("assistant-width", String(widthRef.current));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    document.body.style.userSelect = "none";
  };

  const send = async (customQuery?: string) => {
    const text = (customQuery ?? query).trim();
    if (!text || isLoading) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuery("");
    setIsLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post<{ answer: string }>("/ai/chat", { query: text, history });
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch {
      toast.error("L'assistant n'a pas pu répondre.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="glow fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full gradient-brand text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Assistant"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            style={{ width: isMobile ? "100%" : width }}
            className="fixed right-0 top-0 z-40 flex h-screen max-w-[100vw] flex-col border-l border-border bg-card shadow-2xl"
          >
            {/* Poignée de redimensionnement (non bloquante) */}
            <div
              onMouseDown={startResize}
              className="absolute left-0 top-0 hidden h-full w-1.5 cursor-ew-resize transition-colors hover:bg-primary/40 sm:block"
              aria-hidden
            />

            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold">Assistant</p>
                  <p className="text-xs text-muted-foreground">Vos snippets, par l'IA</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link to="/assistant" onClick={() => setOpen(false)} aria-label="Agrandir">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)} aria-label="Fermer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Fil de conversation */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center opacity-70">
                  <Bot className="h-10 w-10 text-primary" />
                  <p className="text-sm text-muted-foreground">Comment puis-je vous aider ?</p>
                  <div className="w-full space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full rounded-lg border border-border p-2 text-left text-xs transition-colors hover:bg-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "rounded-tr-none bg-primary text-primary-foreground"
                        : "rounded-tl-none border border-border bg-background"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none border border-border bg-background px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Saisie */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Posez votre question…"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={() => send()}
                  disabled={!query.trim() || isLoading}
                  className="shrink-0 gradient-brand border-0 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
