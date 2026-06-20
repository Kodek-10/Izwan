import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Copy, Star, Loader2, Sparkles, X, Languages, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CodeEditor } from "@/components/code-editor";

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
    // On server, we can't access localStorage for the auth token.
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
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);

  // New Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateUI, setShowTranslateUI] = useState(false);
  const [targetLang, setTargetLang] = useState("");

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
    setExplanation("");
    setShowTranslateUI(false);
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
      setExplanation(res.explanation);
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
      setShowTranslateUI(false);
      setTargetLang("");
      // Refresh the page or navigate to new snippet if we had the router here
      // window.location.href = `/snippets/${createRes.id}`;
    } catch (e) {
      toast.error("Erreur lors de la traduction");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-5 pb-10"
    >
      <Link
        to="/snippets"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-display font-semibold break-words">
            {snippet.title}
          </h1>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              disabled={isEditing}
              className="text-primary border-primary/20 hover:bg-primary/5 text-xs"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {t("common.edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranslateUI(!showTranslateUI)}
              disabled={isEditing}
              className="text-primary border-primary/20 hover:bg-primary/5 text-xs"
            >
              <Languages className="h-3.5 w-3.5 mr-1.5" />
              Traduire
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExplain}
              disabled={isExplaining || isEditing}
              className="text-primary border-primary/20 hover:bg-primary/5 text-xs"
            >
              {isExplaining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              {t("snippets.detail.explain_ai")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isFavorite ? "text-amber-400 hover:text-amber-500 hover:bg-amber-50" : "text-muted-foreground"}`}
              onClick={toggleFavorite}
              disabled={isEditing}
            >
              <Star className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-5 rounded-xl border border-border bg-background/40 p-4">
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
          <div className="flex flex-wrap gap-1.5">
            {snippet.tags.map((t: string) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] sm:text-xs font-medium lowercase"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showTranslateUI && !isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border border-border rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-sm"
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Languages className="h-4 w-4" /> Traduire le snippet
              </h3>
              <div className="flex gap-2 items-center">
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
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {explanation && !isEditing && (
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
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{" "}
                {t("snippets.detail.explanation_ai")}
              </h3>
              <div className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                {explanation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isEditing && (
          <>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("snippets.form.description")}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{snippet.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("snippets.form.code")}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2"
                  onClick={() => {
                    navigator.clipboard?.writeText(snippet.code);
                    toast.success(t("snippets.detail.copy_success"));
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> {t("common.share")}
                </Button>
              </div>
              <CodeEditor value={snippet.code} language={snippet.language} readOnly minRows={14} />
            </div>
          </>
        )}

        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("snippets.detail.info_title")}
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <dt className="text-muted-foreground">{t("snippets.detail.created_at")}</dt>
              <dd className="font-medium">
                {snippet.dateObj.toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US")}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground">{t("snippets.form.language")}</dt>
              <dd className="font-medium text-primary font-semibold">{snippet.language}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground">{t("snippets.detail.size")}</dt>
              <dd className="font-medium tabular-nums">
                {snippet.code.length} {t("snippets.detail.bytes")}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </motion.div>
  );
}
