import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Plus,
  Share2,
  ArrowLeft,
  Loader2,
  Star,
  Copy,
  Trash2,
  MoreVertical,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCollectionIcon } from "@/lib/collection-icons";

export const Route = createFileRoute("/_app/collections/$id")({
  head: ({ loaderData }: any) => ({
    meta: [{ title: `${loaderData?.collection?.name || "Collection"} — Izwan` }],
  }),
  loader: async ({ params }: any) => {
    if (typeof window === "undefined") {
      return { collection: null, snippets: [], needsClientFetch: true };
    }
    try {
      const collection = await api.get<any>(`/collections/${params.id}`);
      const snippetsData = await api.get<{ items: any[] }>(
        `/snippets/?collection_id=${params.id}&limit=100`
      );
      return {
        collection,
        snippets: snippetsData.items.map((s) => ({
          ...s,
          tags: s.tags.map((t: any) => t.name),
          dateObj: new Date(s.updated_at),
        })),
        needsClientFetch: false,
      };
    } catch (e) {
      return { collection: null, snippets: [], needsClientFetch: false };
    }
  },
  component: CollectionDetailPage,
});

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function CollectionDetailPage() {
  const { id } = Route.useParams() as { id: string };
  const data = Route.useLoaderData();
  const router = useRouter();

  const [collection, setCollection] = useState<any>(data?.collection);
  const [snippets, setSnippets] = useState<any[]>(data?.snippets || []);
  const [isLoading, setIsLoading] = useState(data?.needsClientFetch ?? true);
  const [shareLoading, setShareLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [available, setAvailable] = useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [addLoading, setAddLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keep local state in sync ONLY on initial mount / when collection id changes
  useEffect(() => {
    if (!data) return;

    if (data.needsClientFetch) {
      let cancelled = false;
      const fetchCollection = async () => {
        setIsLoading(true);
        try {
          const col = await api.get<any>(`/collections/${id}`);
          const snippetsData = await api.get<{ items: any[] }>(
            `/snippets/?collection_id=${id}&limit=100`
          );
          if (cancelled) return;
          setCollection(col);
          setSnippets(
            snippetsData.items.map((s) => ({
              ...s,
              tags: s.tags.map((t: any) => t.name),
              dateObj: new Date(s.updated_at),
            }))
          );
        } catch {
          /* ignore */
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      fetchCollection();
      return () => {
        cancelled = true;
      };
    }
    // On initial SSR → client transition we might still need to set loading flag
    if (data.collection) {
      setCollection(data.collection);
      setIsLoading(false);
    }
  }, [data, id]);

  const Icon = getCollectionIcon(collection?.icon);

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié !");
  };

  const toggleFavorite = async (snippetId: number, current: boolean) => {
    try {
      await api.put(`/snippets/${snippetId}`, { is_favorite: !current });
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === snippetId ? { ...s, is_favorite: !current } : s
        )
      );
      toast.success("Favori mis à jour");
    } catch (err) {
      console.error("toggleFavorite error:", err);
      toast.error("Erreur lors de la mise à jour du favori");
    }
  };

  const removeFromCollection = async (snippetId: number) => {
    try {
      await api.put(`/snippets/${snippetId}`, { collection_id: null });
      setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
      toast.success("Snippet retiré de la collection");
    } catch {
      toast.error("Erreur lors du retrait de la collection");
    }
  };

  const shareCollection = async () => {
    setShareLoading(true);
    const url = `${window.location.origin}/collections/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien de la collection copié !");
    } catch {
      toast.error("Erreur lors du partage");
    } finally {
      setShareLoading(false);
    }
  };

  const openAddDialog = async () => {
    setAddOpen(true);
    setLoadingAvailable(true);
    setSelectedIds(new Set());
    setSearchQuery("");
    try {
      const all = await api.get<{ items: any[] }>(`/snippets/?limit=1000`);
      const free = all.items
        .filter((s: any) => s.collection_id == null)
        .map((s: any) => ({
          ...s,
          tags: s.tags.map((t: any) => t.name),
        }));
      setAvailable(free);
    } catch {
      toast.error("Impossible de récupérer les snippets disponibles");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const toggleSelect = (snippetId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(snippetId)) next.delete(snippetId);
      else next.add(snippetId);
      return next;
    });
  };

  const addSelected = async () => {
    if (selectedIds.size === 0) return;
    setAddLoading(true);
    try {
      for (const snippetId of selectedIds) {
        await api.put(`/snippets/${snippetId}`, { collection_id: parseInt(id) });
      }
      // Refresh snippets list
      const snippetsData = await api.get<{ items: any[] }>(
        `/snippets/?collection_id=${id}&limit=100`
      );
      setSnippets(
        snippetsData.items.map((s) => ({
          ...s,
          tags: s.tags.map((t: any) => t.name),
          dateObj: new Date(s.updated_at),
        }))
      );
      setAddOpen(false);
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} snippet(s) ajouté(s)`);
    } catch {
      toast.error("Erreur lors de l'ajout des snippets");
    } finally {
      setAddLoading(false);
    }
  };

  const filteredAvailable = available.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="p-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
        Collection introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-4">
        <Link
          to="/collections"
          className="group flex items-center gap-1 w-fit text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Collections
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {collection.name}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {snippets.length} Snippets
              {collection.updated_at &&
                ` • Dernière mise à jour ${new Date(
                  collection.updated_at
                ).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                })}`}
            </p>
            {collection.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {collection.description}
              </p>
            )}
          </div>
          <div className="flex gap-3 items-center">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-md p-1 border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-card shadow-sm"
                    : "hover:bg-muted-foreground/10"
                }`}
                title="Vue grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-card shadow-sm"
                    : "hover:bg-muted-foreground/10"
                }`}
                title="Vue liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={shareCollection}
              disabled={shareLoading}
              className="px-4 py-2 rounded-md bg-transparent border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              {shareLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 inline mr-1.5" />
              )}
              Partager
            </button>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("snippet:new"))
              }
              className="flex items-center gap-2 bg-primary text-primary-foreground font-medium text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Snippet
            </button>
            <button
              onClick={openAddDialog}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground font-medium text-sm px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter existant
            </button>
          </div>
        </div>
      </div>

      {/* Snippets Display */}
      {snippets.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
          Cette collection ne contient aucun snippet. Ajoutez-en un !
        </div>
      ) : viewMode === "grid" ? (
        <motion.div
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {snippets.map((s) => (
            <motion.div
              key={s.id}
              variants={item}
              className="bg-card rounded-xl border border-border hover:border-primary/50 transition-all overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="block flex-1 flex flex-col">
                <div className="p-4 border-b border-border flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-muted text-primary shrink-0">
                        {s.language}
                      </span>
                      <h3 className="font-semibold text-foreground truncate">
                        {s.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {s.tags.slice(0, 3).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-3 flex-1 overflow-x-auto min-h-[60px]">
                  <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-all">
                    <code>
                      {(s.code || s.content || "").slice(0, 300)}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="p-3 border-t border-border flex justify-between items-center">
                <div className="flex gap-2 flex-wrap">
                  {s.tags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-muted text-muted-foreground border border-border/50 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      copySnippet(s.code || s.content || "");
                    }}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                    title="Copier le code"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      toggleFavorite(s.id, s.is_favorite);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                      s.is_favorite
                        ? "text-yellow-500 hover:text-yellow-600"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        s.is_favorite ? "fill-current" : ""
                      }`}
                    />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => removeFromCollection(s.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Retirer de la collection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-card">
          {snippets.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-muted text-primary shrink-0">
                  {s.language}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {s.tags.slice(0, 3).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => copySnippet(s.code || s.content || "")}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Copier le code"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleFavorite(s.id, s.is_favorite)}
                  className={`p-1.5 rounded-full transition-colors ${
                    s.is_favorite
                      ? "text-yellow-500 hover:text-yellow-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      s.is_favorite ? "fill-current" : ""
                    }`}
                  />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => removeFromCollection(s.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Retirer de la collection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Existing Snippets Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter des snippets existants</DialogTitle>
            <DialogDescription>
              Sélectionnez les snippets à ajouter à cette collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un snippet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {loadingAvailable ? (
              <div className="flex flex-col items-center justify-center h-32 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                Aucun snippet disponible. Créez d'abord un snippet sans
                collection.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {filteredAvailable.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSelect(s.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors border ${
                      selectedIds.has(s.id)
                        ? "bg-primary/5 border-primary/20"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        selectedIds.has(s.id)
                          ? "bg-primary border-primary"
                          : "border-border"
                      }`}
                    >
                      {selectedIds.has(s.id) && (
                        <X className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-primary shrink-0">
                          {s.language}
                        </span>
                        <span className="font-medium text-sm truncate">
                          {s.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.tags.map((t: any) => t.name || t).join(", ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setAddOpen(false)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
            >
              Annuler
            </button>
            <button
              onClick={addSelected}
              disabled={selectedIds.size === 0 || addLoading}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-medium text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Ajouter {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
