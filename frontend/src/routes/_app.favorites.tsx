import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Star,
  Clock,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/favorites")({
  head: ({ loaderData }: any) => ({
    meta: [
      {
        title: `${
          loaderData?.t?.("favorites.title") || "Favoris"
        } — Izwan`,
      },
    ],
  }),
  loader: async () => {
    if (typeof window === "undefined") {
      return { initialSnippets: [], needsClientFetch: true };
    }
    try {
      const data = await api.get<{ items: any[] }>(
        "/snippets/?favorite=true&limit=100"
      );
      return {
        initialSnippets: data.items.map((s) => ({
          ...s,
          tags: s.tags.map((t: any) => t.name),
        })),
        needsClientFetch: false,
      };
    } catch (e) {
      return { initialSnippets: [], needsClientFetch: false };
    }
  },
  component: FavoritesPage,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function getRelativeTime(dateString?: string): string {
  if (!dateString) return "Ajouté récemment";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Ajouté aujourd'hui";
  if (diffDays === 1) return "Ajouté hier";
  if (diffDays < 7) return `Ajouté il y a ${diffDays} jours`;
  if (diffDays < 30) return `Ajouté il y a ${Math.floor(diffDays / 7)} semaines`;
  return `Ajouté le ${date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })}`;
}

function FavoriteCard({
  snippet,
  onUnfavorite,
}: {
  snippet: any;
  onUnfavorite: (id: number) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(snippet.code || snippet.content || "");
      setCopied(true);
      toast.success("Snippet copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Échec de la copie");
    }
  };

  const handleUnfavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUnfavorite(snippet.id);
  };

  const code = (snippet.code || snippet.content || "").slice(0, 300);

  return (
    <motion.div
      variants={item}
      className="rounded-xl flex flex-col overflow-hidden group h-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <Link
        to="/snippets/$id"
        params={{ id: snippet.id.toString() }}
        className="block flex-1 flex flex-col"
      >
        {/* Card Header */}
        <div className="p-5 flex justify-between items-start border-b border-border/20">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {snippet.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded bg-muted text-muted-foreground font-mono text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="font-semibold text-foreground truncate">
              {snippet.title}
            </h3>
          </div>
          <button
            onClick={handleUnfavorite}
            aria-label="Retirer des favoris"
            className="text-yellow-500 hover:scale-110 active:scale-95 transition-transform shrink-0 ml-2"
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        </div>

        {/* Code Block */}
        <div className="relative flex-grow bg-muted/30 p-5 overflow-x-auto min-h-[120px]">
          <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-all">
            <code>{code}</code>
          </pre>
        </div>

        {/* Card Footer */}
        <div className="p-4 bg-muted/50 flex justify-between items-center border-t border-border/20">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {getRelativeTime(snippet.updated_at || snippet.created_at)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={`flex items-center gap-2 text-xs font-mono transition-colors ${
              copied
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copier
              </>
            )}
          </Button>
        </div>
      </Link>
    </motion.div>
  );
}

function FavoritesPage() {
  const { t } = useTranslation();
  const data = Route.useLoaderData();
  const initialSnippets = data?.initialSnippets || [];
  const [snippets, setSnippets] = useState(initialSnippets);
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");

  useEffect(() => {
    if (data?.initialSnippets && !data.needsClientFetch) {
      setSnippets(data.initialSnippets);
    }
  }, [data?.initialSnippets, data?.needsClientFetch]);

  useEffect(() => {
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const res = await api.get<{ items: any[] }>(
            "/snippets/?favorite=true&limit=100"
          );
          setSnippets(
            res.items.map((s) => ({
              ...s,
              tags: s.tags.map((t: any) => t.name),
            }))
          );
        } catch (e) {
          console.error("Failed to fetch favorites on client", e);
        } finally {
          setIsClientLoading(false);
        }
      };
      fetchOnClient();
    }
  }, [data?.needsClientFetch]);

  const toggleFavorite = async (id: number) => {
    try {
      await api.put(`/snippets/${id}`, { is_favorite: false });
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      toast.success(t("snippets.remove_favorite"));
    } catch (e) {
      toast.error(t("snippets.update_error"));
    }
  };

  const sortedSnippets = [...snippets].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
    const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
    return sortBy === "recent" ? dateB - dateA : dateA - dateB;
  });

  if (isClientLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("favorites.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Favoris
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Votre collection organisée de snippets de code essentiels.
            Appuyez sur l'icône de copie pour les utiliser immédiatement.
          </p>
        </div>
        {/* Filters/Sort */}
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-foreground text-sm hover:bg-muted transition-colors">
            <Filter className="h-4 w-4" />
            Filtrer
          </button>
          <button
            onClick={() =>
              setSortBy((prev) => (prev === "recent" ? "oldest" : "recent"))
            }
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm hover:bg-secondary/20 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortBy === "recent" ? "Récent" : "Ancien"}
          </button>
        </div>
      </div>

      {/* Bento Grid Layout for Snippets */}
      {snippets.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
          Aucun snippet favori pour le moment.
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedSnippets.map((s) => (
            <FavoriteCard
              key={s.id}
              snippet={s}
              onUnfavorite={toggleFavorite}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
