import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, Search, Star, MoreVertical, Code2, Edit, Share2, Trash2, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { languages } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
import { z } from "zod";

const snippetsSearchSchema = z.object({
  collection: z.number().optional(),
});

export const Route = createFileRoute("/_app/snippets/")({
  validateSearch: snippetsSearchSchema,
  head: () => ({ meta: [{ title: "Snippets — Izwan" }] }),
  loader: async ({ search }) => {
    const { collection } = (search || {}) as { collection?: number };
    
    // On server, we can't access localStorage for the auth token.
    // Return a flag so the client knows it needs to fetch the real data.
    if (typeof window === "undefined") {
      return { initialSnippets: [], collectionName: null, needsClientFetch: true };
    }

    try {
      const endpoint = collection ? `/snippets/?collection_id=${collection}&limit=100` : "/snippets/?limit=100";
      const data = await api.get<{ items: any[] }>(endpoint);
      
      let collectionName = null;
      if (collection) {
        try {
          const colData = await api.get<any>(`/collections/${collection}`);
          collectionName = colData.name;
        } catch (e) {
          collectionName = "Inconnue";
        }
      }

      return { 
        initialSnippets: data.items.map(s => ({
          ...s,
          tags: s.tags.map((t: any) => t.name),
          date: new Date(s.updated_at).toLocaleDateString('fr-FR'),
        })),
        collectionName,
        needsClientFetch: false
      };
    } catch (e) {
      return { initialSnippets: [], collectionName: null, needsClientFetch: false };
    }
  },
  component: SnippetsPage,
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

function SnippetsPage() {
  const { collection } = Route.useSearch();
  const data = Route.useLoaderData();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("all");
  const [snippets, setSnippets] = useState<any[]>(data?.initialSnippets || []);
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
          const endpoint = collection ? `/snippets/?collection_id=${collection}&limit=100` : "/snippets/?limit=100";
          const res = await api.get<{ items: any[] }>(endpoint);
          setSnippets(res.items.map(s => ({
            ...s,
            tags: s.tags.map((t: any) => t.name),
            date: new Date(s.updated_at).toLocaleDateString('fr-FR'),
          })));
        } catch (e) {
          console.error("Failed to fetch snippets on client", e);
        } finally {
          setIsClientLoading(false);
        }
      };
      fetchOnClient();
    }
  }, [data?.needsClientFetch, collection]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isClientLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement de vos snippets...</p>
      </div>
    );
  }

  const filtered = snippets.filter((s) => {
    const matchesQ = !q || s.title.toLowerCase().includes(q.toLowerCase());
    const matchesL = lang === "all" || s.language === lang;
    return matchesQ && matchesL;
  });

  const toggleFavorite = async (id: number, current: boolean) => {
    try {
      await api.put(`/snippets/${id}`, { is_favorite: !current });
      // Update local state for immediate feedback
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_favorite: !current } : s))
      );
      // Invalidate to update other routes (favorites, statistics)
      router.invalidate();
      toast.success(!current ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch (e) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteSnippet = async (id: number) => {
    try {
      await api.delete(`/snippets/${id}`);
      // Update local state for immediate feedback
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      // Invalidate to update other routes
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-display font-semibold text-2xl truncate">
            {collection ? "Snippets" : "Tous les snippets"}
          </h2>
          {collection && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium animate-in fade-in zoom-in duration-300">
              <span>Collection : {data.collectionName}</span>
              <Link to="/snippets" className="hover:text-primary/70 transition-colors">
                <X className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
        <Link to="/snippets/new">
          <Button className="gradient-brand text-white border-0 hover:opacity-90 shrink-0">
            <Plus className="h-4 w-4 mr-2" /> Nouveau
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un snippet..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tous les langages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les langages</SelectItem>
              {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tous les tags" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les tags</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden"
      >
        {filtered.map((s) => (
          <motion.div variants={item} key={s.id} className="relative group">
            <Link
              to="/snippets/$id"
              params={{ id: s.id.toString() }}
              className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg gradient-brand flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <Code2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-16 sm:pr-20">
                <p className="font-medium truncate text-sm sm:text-base">{s.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-semibold text-primary/80">{s.language}</span>
                  <span className="mx-1">·</span>
                  <span>{s.tags.slice(0, 2).join(", ")}{s.tags.length > 2 ? "..." : ""}</span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 hidden md:inline">{s.date}</span>
            </Link>
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${s.is_favorite ? "text-amber-400 hover:text-amber-500" : "text-muted-foreground"}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(s.id, s.is_favorite);
                }}
              >
                <Star className={`h-4 w-4 ${s.is_favorite ? "fill-current" : ""}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
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
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground text-sm">Aucun snippet trouvé.</div>
        )}
      </motion.div>
    </div>
  );
}
