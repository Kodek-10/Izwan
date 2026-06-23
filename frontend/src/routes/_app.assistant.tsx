import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Send, User, Bot, Loader2, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({ meta: [{ title: "Assistant Chat IA — Izwan" }] }),
  component: AssistantPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function AssistantPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (customQuery?: string) => {
    const messageToSend = customQuery || query;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post<{ answer: string }>("/ai/chat", {
        query: userMessage.content,
        history,
      });
      
      const assistantMessage: Message = {
        role: "assistant",
        content: res.answer,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      toast.error(t("assistant.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.info(t("assistant.clear_success"));
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-brand flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-2xl">{t("assistant.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("assistant.subtitle")}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> {t("assistant.clear_chat")}
          </Button>
        )}
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-muted"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
              <Bot className="h-12 w-12 text-primary animate-pulse" />
              <div className="max-w-xs">
                <p className="font-medium">{t("assistant.welcome_title")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("assistant.welcome_desc")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-4">
                <button 
                  onClick={() => handleSendMessage(t("assistant.suggest_1"))}
                  className="text-xs p-2 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  {t("assistant.suggest_1")}
                </button>
                <button 
                  onClick={() => handleSendMessage(t("assistant.suggest_2"))}
                  className="text-xs p-2 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  {t("assistant.suggest_2")}
                </button>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-muted/50 border border-border rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-2 opacity-50 ${m.role === "user" ? "text-right" : "text-left"}`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary animate-bounce" />
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/30 border-t border-border">
          <div className="flex gap-2 bg-background border border-border rounded-xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={t("assistant.placeholder")}
              className="border-0 focus-visible:ring-0 bg-transparent h-10 shadow-none"
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={() => handleSendMessage()} 
              disabled={!query.trim() || isLoading}
              className="h-10 w-10 shrink-0 gradient-brand text-white border-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
