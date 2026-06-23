import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Send, Maximize2, Bot, User, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Comment trier une liste en Python ?",
  "Montre mes snippets sur l'authentification",
];

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

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
      <button
        onClick={() => setOpen(true)}
        className="glow fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full gradient-brand text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Assistant"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>Assistant</SheetTitle>
          </SheetHeader>

          {/* En-tête */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 pr-10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold">Assistant</p>
                <p className="text-xs text-muted-foreground">Vos snippets, par l'IA</p>
              </div>
            </div>
            <Link to="/assistant" onClick={() => setOpen(false)} aria-label="Agrandir">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </Link>
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
                      : "rounded-tl-none border border-border bg-card"
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
                <div className="rounded-2xl rounded-tl-none border border-border bg-card px-3 py-2">
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
        </SheetContent>
      </Sheet>
    </>
  );
}
