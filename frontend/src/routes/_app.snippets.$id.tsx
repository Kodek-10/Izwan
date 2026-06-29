import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Copy,
  Star,
  Loader2,
  Sparkles,
  X,
  Languages,
  Pencil,
  Save,
  Share2,
  MoreVertical,
  Code2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CodeEditor } from "@/components/code-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ApiTag = {
  id: number;
  name: string;
};

type ApiSnippet = {
  id: number;
  title: string;
  language: string;
  code: string;
  description?: string | null;
  is_favorite: boolean;
  collection_id?: number | null;
  created_at: string;
  updated_at: string;
  tags: ApiTag[];
};

type SnippetView = Omit<ApiSnippet, "tags" | "created_at"> & {
  created_at: string;
  tags: string[];
  dateObj: Date;
};

type SnippetLoaderData = {
  snippet: SnippetView | null;
  needsClientFetch: boolean;
};

const formatSnippet = (snippet: ApiSnippet): SnippetView => ({
  ...snippet,
  tags: snippet.tags.map((tag) => tag.name),
  dateObj: new Date(snippet.created_at),
});

export const Route = createFileRoute("/_app/snippets/$id")({
  head: ({ loaderData }: { loaderData?: SnippetLoaderData }) => {
    return { meta: [{ title: `${loaderData?.snippet?.title ?? "Snippet"} — Izwan` }] };
  },
  loader: async ({ params }) => {
    if (typeof window === "undefined") {
      return { snippet: null, needsClientFetch: true };
    }

    try {
      const s = await api.get<ApiSnippet>(`/snippets/${params.id}`);
      return {
        snippet: formatSnippet(s),
        needsClientFetch: false,
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
  const router = useRouter();
  const [snippet, setSnippet] = useState<SnippetView | null>(data?.snippet);
  const [isFavorite, setIsFavorite] = useState(data?.snippet?.is_favorite ?? false);
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");

  // New AI Explanation state
  const [isExplaining, setIsExplaining] = useState(false);

  // New Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState("");
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);

  useEffect(() => {
    if (data?.snippet && !data.needsClientFetch) {
      setSnippet(data.snippet);
      setIsFavorite(data.snippet.is_favorite);
    }
  }, [data]);

  useEffect(() => {
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const s = await api.get<ApiSnippet>(`/snippets/${params.id}`);
          const formatted = formatSnippet(s);
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

  const startEditing = () => {
    setEditTitle(snippet.title);
    setEditLanguage(snippet.language);
    setEditDescription(snippet.description || "");
    setEditCode(snippet.code);
    setEditTags(snippet.tags || []);
    setEditTagInput("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditTagInput("");
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editCode.trim()) {
      toast.error(t("snippets.form.required_fields"));
      return;
    }

    if (!editLanguage.trim()) {
      toast.error(t("snippets.form.language_required"));
      return;
    }

    setIsSavingEdit(true);
    try {
      const pendingTag = editTagInput.trim().toLowerCase();
      const nextTags = pendingTag
        ? Array.from(new Set([...editTags, pendingTag]))
        : editTags;
      const updated = await api.put<ApiSnippet>(`/snippets/${snippet.id}`, {
        title: editTitle.trim(),
        language: editLanguage.trim(),
        description: editDescription,
        code: editCode,
        tags: nextTags.map((tag) => tag.trim()).filter(Boolean),
      });
      const formatted = formatSnippet(updated);
      setSnippet(formatted);
      setIsFavorite(formatted.is_favorite);
      setEditTagInput("");
      setIsEditing(false);
      await router.invalidate();
      toast.success(t("snippets.form.update_success"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("snippets.update_error"));
    } finally {
      setIsSavingEdit(false);
    }
  };

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
        language: snippet.language,
      });
      window.dispatchEvent(
        new CustomEvent("assistant:explain", {
          detail: { explanation: res.explanation },
        })
      );
      toast.success(t("snippets.detail.explanation_success"));
    } catch (e) {
      toast.error(t("snippets.detail.explanation_error"));
    } finally {
      setIsExplaining(false);
    }
  };

  const handleTranslate = async () => {
    if (!targetLang.trim()) {
      toast.error("Veuillez entrer un langage cible (ex: TypeScript, Python)");
      return;
    }
    setIsTranslating(true);
    try {
      const res = await api.post<{
        translated_code: string;
        description?: string;
        tags?: string[];
      }>("/ai/translate", {
        code: snippet.code,
        source_language: snippet.language,
        target_language: targetLang,
      });

      const newSnippetTitle = `${snippet.title} (${targetLang})`;
      await api.post<ApiSnippet>("/snippets/", {
        title: newSnippetTitle,
        description: res.description || `Traduction de ${snippet.title} en ${targetLang}`,
        code: res.translated_code,
        language: targetLang.toLowerCase(),
        collection_id: snippet.collection_id,
        tags: res.tags || [targetLang.toLowerCase(), "traduction"],
      });

      toast.success("Traduction réussie et sauvegardée comme nouveau snippet !");
      setIsTranslateDialogOpen(false);
      setTargetLang("");
    } catch (e) {
      toast.error("Erreur lors de la traduction");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/snippets/${snippet.id}`);
      toast.success(t("snippets.delete_success"));
      router.navigate({ to: "/snippets" });
    } catch (e) {
      toast.error(t("snippets.delete_error"));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-5 pb-10"
    >
      {/* Back Button */}
      <Link
        to="/snippets"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux snippets
      </Link>

      {/* Editor Panel */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Editor Header */}
        <div className="h-14 bg-muted/50 border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Code2 className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-semibold text-sm text-foreground truncate">
              {snippet.title}
            </h2>
            <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded font-medium shrink-0">
              {snippet.language}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleFavorite}
              className={`p-1.5 rounded hover:bg-muted transition-colors flex items-center gap-1.5 ${
                isFavorite ? "text-yellow-500" : "text-muted-foreground hover:text-foreground"
              }`}
              title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleExplain}
              disabled={isExplaining || isEditing}
              className="px-3 py-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              {isExplaining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Expliquer
            </button>
            <button
              onClick={() => setIsTranslateDialogOpen(true)}
              disabled={isEditing}
              className="px-3 py-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Languages className="h-4 w-4" />
              Transcrire
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Plus">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard?.writeText(snippet.code);
                    toast.success(t("snippets.detail.copy_success"));
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const url = `${window.location.origin}/snippets/${snippet.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Lien copié !");
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </DropdownMenuItem>
                <DropdownMenuItem onClick={startEditing} disabled={isEditing}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 bg-background p-4 sm:p-6 overflow-auto">
          {isEditing ? (
            <div className="space-y-5 rounded-xl border border-border bg-card/40 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">{t("snippets.form.title")}</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-language">{t("snippets.form.language")}</Label>
                  <Input
                    id="edit-language"
                    value={editLanguage}
                    onChange={(event) => setEditLanguage(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">{t("snippets.form.description")}</Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("snippets.form.tags")}</Label>
                <div className="flex min-h-[44px] flex-wrap gap-2 rounded-md border border-input bg-input/40 p-2">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setEditTags(editTags.filter((current) => current !== tag))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={editTagInput}
                    onChange={(event) => setEditTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && editTagInput.trim()) {
                        event.preventDefault();
                        const nextTag = editTagInput.trim().toLowerCase();
                        if (!editTags.includes(nextTag)) setEditTags([...editTags, nextTag]);
                        setEditTagInput("");
                      }
                    }}
                    placeholder={t("snippets.form.add_tag")}
                    className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-code">{t("snippets.form.code")}</Label>
                <CodeEditor
                  id="edit-code"
                  value={editCode}
                  onChange={setEditCode}
                  language={editLanguage || "text"}
                  minRows={14}
                />
              </div>

              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button variant="outline" onClick={cancelEditing} disabled={isSavingEdit}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                  {isSavingEdit ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t("common.save")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">{snippet.title}</h1>
                {snippet.description && (
                  <p className="text-muted-foreground mb-4">{snippet.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded font-medium">
                    {snippet.language}
                  </span>
                  {snippet.tags.map((t: string) => (
                    <span
                      key={t}
                      className="text-primary text-xs font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <hr className="border-border/30" />
              </div>

              <CodeEditor
                value={snippet.code}
                language={snippet.language}
                readOnly
                minRows={14}
              />
            </>
          )}
        </div>

        {/* Editor Footer */}
        {!isEditing && (
          <div className="h-8 bg-muted/50 border-t border-border flex items-center justify-end px-4 gap-4 text-[10px] font-medium text-muted-foreground">
            <span>UTF-8</span>
            <span>{snippet.language}</span>
            <span>{snippet.code.length} chars</span>
          </div>
        )}
      </div>

      {/* Translate Dialog */}
      <Dialog open={isTranslateDialogOpen} onOpenChange={setIsTranslateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Traduire le snippet</DialogTitle>
            <DialogDescription>
              Entrez le langage cible pour traduire ce snippet.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 items-center py-4">
            <Input
              placeholder="Langage cible (ex: python, typescript)"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="max-w-xs h-9"
            />
            <Button
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating || !targetLang.trim()}
              className="h-9"
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Lancer la traduction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
