import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Copy, Star, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_app/snippets/$id")({
  head: ({ loaderData }: any) => {
    return { meta: [{ title: `${loaderData?.snippet?.title ?? "Snippet"} — Izwan` }] };
  },
  loader: async ({ params }) => {
    // On server, we can't access localStorage for the auth token.
    if (typeof window === "undefined") {
      return { snippet: null, needsClientFetch: true };
    }

    try {
      const s = await api.get<any>(`/snippets/${params.id}`);
      return { 
        snippet: {
          ...s,
          tags: s.tags.map((t: any) => t.name),
          dateObj: new Date(s.created_at),
        },
        needsClientFetch: false
      };
    } catch (e) {
      throw notFound();
    }
  },
  component: SnippetDetail,
});

function SnippetDetail() {
  const { t, i18n } = useTranslation();
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const [snippet, setSnippet] = useState<any>(data?.snippet);
  const [isFavorite, setIsFavorite] = useState(data?.snippet?.is_favorite ?? false);
  const [isClientLoading, setIsClientLoading] = useState(false);
  
  // New AI Explanation state
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    if (data?.snippet && !data.needsClientFetch) {
      setSnippet(data.snippet);
      setIsFavorite(data.snippet.is_favorite);
    }
  }, [data]);

  useEffect(() => {
    // If the loader ran on server, we need to re-fetch on client where token is available
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const s = await api.get<any>(`/snippets/${params.id}`);
          const formatted = {
            ...s,
            tags: s.tags.map((t: any) => t.name),
            dateObj: new Date(s.created_at),
          };
          setSnippet(formatted);
          setIsFavorite(formatted.is_favorite);
        } catch (e) {
          console.error("Failed to fetch snippet on client", e);
        } finally {
          setIsClientLoading(false);
        }
      };
      fetchOnClient();
    }
  }, [data?.needsClientFetch, params.id]);
  
  if (isClientLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("snippets.detail.loading")}</p>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggleFavorite = async () => {
    try {
      await api.put(`/snippets/${snippet.id}`, { is_favorite: !isFavorite });
      setIsFavorite(!isFavorite);
      toast.success(!isFavorite ? t("snippets.add_favorite") : t("snippets.remove_favorite"));
    } catch (e) {
      toast.error(t("snippets.update_error"));
    }
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      const res = await api.post<{ explanation: string }>("/ai/explain", { 
        code: snippet.code, 
        language: snippet.language 
      });
      setExplanation(res.explanation);
      toast.success(t("snippets.detail.explanation_success"));
    } catch (e) {
      toast.error(t("snippets.detail.explanation_error"));
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-5 pb-10"
    >
      <Link to="/snippets" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-display font-semibold break-words">{snippet.title}</h1>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExplain}
              disabled={isExplaining}
              className="text-primary border-primary/20 hover:bg-primary/5 text-xs"
            >
              {isExplaining ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
              {t("snippets.detail.explain_ai")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isFavorite ? "text-amber-400 hover:text-amber-500 hover:bg-amber-50" : "text-muted-foreground"}`}
              onClick={toggleFavorite}
            >
              <Star className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {snippet.tags.map((t: string) => (
            <span key={t} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] sm:text-xs font-medium lowercase">{t}</span>
          ))}
        </div>

        <AnimatePresence>
          {explanation && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-primary/5 border border-primary/10 rounded-xl p-4 sm:p-5 relative overflow-hidden"
            >
              <button 
                onClick={() => setExplanation("")}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t("snippets.detail.explanation_ai")}
              </h3>
              <div className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                {explanation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("snippets.form.description")}</h3>
          <p className="text-sm leading-relaxed text-foreground/90">{snippet.description}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("snippets.form.code")}</h3>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => {
              navigator.clipboard?.writeText(snippet.code);
              toast.success(t("snippets.detail.copy_success"));
            }}>
              <Copy className="h-3 w-3 mr-1" /> {t("common.share")}
            </Button>
          </div>
          <pre className="bg-muted/60 border border-border rounded-lg p-3 sm:p-4 text-xs sm:text-sm font-mono overflow-x-auto shadow-inner">
            <code>{snippet.code}</code>
          </pre>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("snippets.detail.info_title")}</h3>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <dt className="text-muted-foreground">{t("snippets.detail.created_at")}</dt>
              <dd className="font-medium">
                {snippet.dateObj.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
              </dd>
            </div>
            <div className="space-y-1"><dt className="text-muted-foreground">{t("snippets.form.language")}</dt><dd className="font-medium text-primary font-semibold">{snippet.language}</dd></div>
            <div className="space-y-1"><dt className="text-muted-foreground">{t("snippets.detail.size")}</dt><dd className="font-medium tabular-nums">{snippet.code.length} {t("snippets.detail.bytes")}</dd></div>
          </dl>
        </div>
      </div>
    </motion.div>
  );
}
