import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Star, Code2, MoreVertical, Trash2, Edit, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/favorites")({
  head: () => ({ meta: [{ title: "Favoris — Izwan" }] }),
  loader: async () => {
    // On server, we can't access localStorage for the auth token.
    if (typeof window === "undefined") {
      return { initialSnippets: [], needsClientFetch: true };
    }

    try {
      const data = await api.get<{ items: any[] }>("/snippets/?is_favorite=true&limit=100");
      return { 
        initialSnippets: data.items.map(s => ({
          ...s,
          tags: s.tags.map((t: any) => t.name),
          date: new Date(s.updated_at).toLocaleDateString('fr-FR'),
        })),
        needsClientFetch: false
      };
    } catch (e) {
      return { initialSnippets: [], needsClientFetch: false };
    }
  },
  component: FavoritesPage,
});

const container = {
// ... (rest of animation configs)
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

function FavoritesPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const initialSnippets = data?.initialSnippets || [];
  const [snippets, setSnippets] = useState(initialSnippets);
  const [isClientLoading, setIsClientLoading] = useState(false);

  useEffect(() => {
    if (data?.initialSnippets && !data.needsClientFetch) {
      setSnippets(data.initialSnippets);
    }
  }, [data?.initialSnippets, data?.needsClientFetch]);

  useEffect(() => {
    // If the loader ran on server, we need to re-fetch on client where token is available
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const res = await api.get<{ items: any[] }>("/snippets/?is_favorite=true&limit=100");
          setSnippets(res.items.map(s => ({
            ...s,
            tags: s.tags.map((t: any) => t.name),
            date: new Date(s.updated_at).toLocaleDateString('fr-FR'),
          })));
        } catch (e) {
          console.error("Failed to fetch favorites on client", e);
        } finally {
          setIsClientLoading(false);
        }
      };
      fetchOnClient();
    }
  }, [data?.needsClientFetch]);

  if (isClientLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement de vos favoris...</p>
      </div>
    );
  }

  const toggleFavorite = async (id: number) => {
    try {
      await api.put(`/snippets/${id}`, { is_favorite: false });
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      router.invalidate();
      toast.success("Retiré des favoris");
    } catch (e) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteSnippet = async (id: number) => {
    try {
      await api.delete(`/snippets/${id}`);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      router.invalidate();
      toast.success("Snippet supprimé");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const shareSnippet = (s: any) => {
    const url = `${window.location.origin}/snippets/${s.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papier");
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-xl sm:text-2xl">Mes Favoris</h2>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden"
      >
        {snippets.map((s) => (
          <motion.div variants={item} key={s.id} className="relative group">
            <Link
              to="/snippets/$id"
              params={{ id: s.id.toString() }}
              className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg gradient-brand flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <Star className="h-4 w-4 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0 pr-20 sm:pr-24">
                <p className="font-medium truncate text-sm sm:text-base">{s.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate uppercase">
                  {s.language} · {s.tags.slice(0, 2).join(", ")}
                </p>
              </div>
            </Link>
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amber-400 hover:text-amber-500 hover:bg-amber-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(s.id);
                }}
              >
                <Star className="h-4 w-4 fill-current" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast.info("Fonctionnalité de modification à venir")}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Modifier</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareSnippet(s)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Partager</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteSnippet(s.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Supprimer</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ))}
        {snippets.length === 0 && (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Aucun favori pour le moment.
          </div>
        )}
      </motion.div>
    </div>
  );
}
