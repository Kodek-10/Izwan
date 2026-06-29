import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Star,
  MoreVertical,
  Code2,
  Share2,
  Trash2,
  X,
  Loader2,
  FolderOpen,
  Filter,
  Copy,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
import { z } from "zod";

const snippetsSearchSchema = z.object({
  collection: z.number().optional(),
});

export const Route = createFileRoute("/_app/snippets/")({
  validateSearch: snippetsSearchSchema,
  head: ({ loaderData }: any) => ({
    meta: [{ title: `${loaderData?.collectionName || "Snippets"} — Izwan` }],
  }),
  loader: async ({ search }: any) => {
    const { collection } = (search || {}) as { collection?: number };

    if (typeof window === "undefined") {
      return { initialSnippets: [], collectionName: null, needsClientFetch: true };
    }

    try {
      const endpoint = collection
        ? `/snippets/?collection_id=${collection}&limit=100`
        : "/snippets/?limit=100";
      const data = await api.get<{ items: any[] }>(endpoint);

      let collectionName = null;
      if (collection) {
        try {
          const colData = await api.get<any>(`/collections/${collection}`);
          collectionName = colData.name;
        } catch {
          collectionName = null;
        }
      }

      return {
        initialSnippets: data.items.map((s) => ({
          ...s,
          tags: s.tags.map((t: any) => t.name),
          dateObj: new Date(s.updated_at),
        })),
        collectionName,
        needsClientFetch: false,
      };
    } catch (e) {
      return { initialSnippets: [], collectionName: null, needsClientFetch: false };
    }
  },
 component: SnippetsPage,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function SnippetsPage() {
  const { t, i18n } = useTranslation();
  const { collection } = Route.useSearch();
  const data = Route.useLoaderData();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("all");
  const [snippets, setSnippets] = useState<any[]>(data?.initialSnippets || []);
  const [collectionName, setCollectionName] = useState<string | null>(data?.collectionName || null);
  const [isLoading, setIsLoading] = useState(data?.needsClientFetch ?? true);

  const [collections, setCollections] = useState<any[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignSnippet, setAssignSnippet] = useState<any>(null);
  const [assignColId, setAssignColId] = useState<string>("none");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!data) return;

    if (data.needsClientFetch) {
      let cancelled = false;
      const fetchSnippets = async () => {
        setIsLoading(true);
        try {
          const endpoint = collection
            ? `/snippets/?collection_id=${collection}&limit=100`
            : "/snippets/?limit=100";
          const res = await api.get<{ items: any[] }>(endpoint);
          if (cancelled) return;
          setSnippets(
            res.items.map((s) => ({
              ...s,
              tags: s.tags.map((t: any) => t.name),
              dateObj: new Date(s.updated_at),
            }))
          );

          if (collection) {
            try {
              const colData = await api.get<any>(`/collections/${collection}`);
              if (!cancelled) setCollectionName(colData.name);
            } catch {
              if (!cancelled) setCollectionName(null);
            }
          } else {
            setCollectionName(null);
          }
        } catch (e) {
          console.error("Failed to fetch snippets client-side", e);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      fetchSnippets();
      return () => {
        cancelled = true;
      };
    } else {
      setSnippets(data.initialSnippets || []);
      setCollectionName(data.collectionName || null);
      setIsLoading(false);
    }
  }, [data, collection]);

  useEffect(() => {
    api
      .get<any[]>("/collections/")
      .then(setCollections)
      .catch(() => {});
  }, []);

  const filtered = snippets.filter((s) => {
    const matchesQ = !q || s.title.toLowerCase().includes(q.toLowerCase());
    const matchesL = lang === "all" || s.language === lang;
    return matchesQ && matchesL;
  });

  const toggleFavorite = async (id: number, current: boolean) => {
    try {
      await api.put(`/snippets/${id}`, { is_favorite: !current });
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_favorite: !current } : s))
      );
      toast.success(
        !current ? t("snippets.add_favorite") : t("snippets.remove_favorite")
      );
    } catch (e) {
      toast.error(t("snippets.update_error"));
    }
  };

  const deleteSnippet = async (id: number) => {
    try {
      await api.delete(`/snippets/${id}`);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      router.invalidate();
      toast.success(t("snippets.delete_success"));
    } catch (e) {
      toast.error(t("snippets.delete_error"));
    }
  };

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t("snippets.copy_link") || "Code copié !");
  };

  const shareSnippet = (s: any) => {
    const url = `${window.location.origin}/snippets/${s.id}`;
    navigator.clipboard.writeText(url);
    toast.success(t("snippets.copy_link"));
  };

  const openAssignDialog = (s: any) => {
    setAssignSnippet(s);
    setAssignColId(s.collection_id ? s.collection_id.toString() : "none");
    setAssignDialogOpen(true);
  };

  const handleAssignCollection = async () => {
    if (!assignSnippet) return;
    setIsAssigning(true);
    try {
      const newColId =
        assignColId === "none" ? null : parseInt(assignColId);
      await api.put(`/snippets/${assignSnippet.id}`, { collection_id: newColId });
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === assignSnippet.id ? { ...s, collection_id: newColId } : s
        )
      );
      toast.success(
        newColId
          ? t("snippets.collection_assigned")
          : t("snippets.collection_removed")
      );
      setAssignDialogOpen(false);
    } catch (e) {
      toast.error(t("snippets.update_error"));
    } finally {
      setIsAssigning(false);
    }
  };

  const [showFilters, setShowFilters] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("snippets.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {collection ? t("snippets.title") : t("snippets.all_snippets")}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Gérez et organisez vos morceaux de code réutilisables.
            Filtrez par langage ou par tag pour retrouver rapidement vos solutions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filtrer
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            onClick={() => window.dispatchEvent(new CustomEvent("snippet:new"))}
          >
            <Plus className="h-4 w-4" /> {t("snippets.new")}
          </Button>
        </div>
      </div>

      {/* Filters / Tabs */}
      <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide border-b border-border">
        <button
          onClick={() => setLang("all")}
          className={`px-4 py-2 rounded-t-lg border-b-2 font-body-md whitespace-nowrap transition-colors ${
            lang === "all"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Tous les snippets
        </button>
        {languages.slice(0, 5).map((language) => (
          <button
            key={language}
            onClick={() => setLang(language === lang ? "all" : language)}
            className={`px-4 py-2 rounded-t-lg border-b-2 font-body-md whitespace-nowrap transition-colors ${
              lang === language
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {language}
          </button>
        ))}
      </div>

      {/* Search */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("snippets.search_placeholder")}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t("common.all_languages")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all_languages")}</SelectItem>
                {languages.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t("common.all_tags")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all_tags")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Bento Grid үлээр Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
        {filtered.map((s, index) => {
          return (
            <motion.div
              key={s.id}
              variants={item}
              initial="hidden"
              animate="show"
              className={`bg-card rounded-xl border border-border hover:border-primary/50 transition-colors overflow-hidden flex flex-col group ${
                index === 0 ? "lg:col-span-2" : ""
              } ${index === 3 ? "md:col-span-2 lg:col-span-2" : ""}`}
            >
              <Link
                to="/snippets/$id"
                params={{ id: s.id.toString() }}
                className="block flex-1 flex flex-col"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-border flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-muted text-primary">
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

                {/* Code Block */}
                <div className="bg-muted p-3 flex-1 overflow-x-auto min-h-[60px]">
                  <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-all">
                    <code>{(s.code || s.content || "").slice(0, 300)}</code>
                  </pre>
                </div>
              </Link>

              {/* Card Footer */}
              <div className="p-3 border-t border-border flex justify-between items-center bg-card">
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      copySnippet(s.code || s.content || "");
                    }}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                    title="Copier le code"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
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
                      <DropdownMenuItem onClick={() => openAssignDialog(s)}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        <span>{t("snippets.assign_collection")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareSnippet(s)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        <span>{t("common.share")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteSnippet(s.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>{t("common.delete")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
          {t("snippets.no_results")}
        </div>
      )}

      {/* Dialog: Assign snippet to collection */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{t("snippets.assign_collection_title")}</DialogTitle>
            <DialogDescription>
              {t("snippets.assign_collection_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={assignColId} onValueChange={setAssignColId}>
              <SelectTrigger>
                <SelectValue placeholder={t("snippets.form.no_collection")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("snippets.form.no_collection")}
                </SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setAssignDialogOpen(false)}
              disabled={isAssigning}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAssignCollection}
              disabled={isAssigning}
            >
              {isAssigning && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
