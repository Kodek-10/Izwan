import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Copy, Star, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_app/snippets/$id")({
  head: ({ loaderData }) => {
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
          date: new Date(s.created_at).toLocaleDateString('fr-FR'),
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
            date: new Date(s.created_at).toLocaleDateString('fr-FR'),
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
        <p className="text-sm text-muted-foreground">Chargement du snippet...</p>
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
      toast.success(!isFavorite ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch (e) {
      toast.error("Erreur lors de la mise à jour");
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
      toast.success("Explication générée");
    } catch (e) {
      toast.error("Erreur lors de la génération de l'explication");
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
        <ArrowLeft className="h-4 w-4" /> Retour
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
              Expliquer <span className="hidden xs:inline ml-1">avec l'IA</span>
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
                suppressHydrationWarning
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Explication IA
              </h3>
              <div className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                {explanation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
          <p className="text-sm leading-relaxed text-foreground/90">{snippet.description}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</h3>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => {
              navigator.clipboard?.writeText(snippet.code);
              toast.success("Code copié");
            }}>
              <Copy className="h-3 w-3 mr-1" /> Copier
            </Button>
          </div>
          <pre className="bg-muted/60 border border-border rounded-lg p-3 sm:p-4 text-xs sm:text-sm font-mono overflow-x-auto shadow-inner">
            <code>{snippet.code}</code>
          </pre>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informations</h3>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div className="space-y-1"><dt className="text-muted-foreground">Créé le</dt><dd className="font-medium">{snippet.date}</dd></div>
            <div className="space-y-1"><dt className="text-muted-foreground">Langage</dt><dd className="font-medium text-primary font-semibold">{snippet.language}</dd></div>
            <div className="space-y-1"><dt className="text-muted-foreground">Taille</dt><dd className="font-medium tabular-nums">{snippet.code.length} octets</dd></div>
          </dl>
        </div>
      </div>
    </motion.div>
  );
}
