import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, X, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { languages } from "@/lib/mock-data";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/snippets/new")({
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.t?.('snippets.new') || 'Nouveau snippet'} — Izwan` }] }),
  loader: async () => {
    try {
      const collections = await api.get<any[]>("/collections/");
      return { collections };
    } catch (e) {
      return { collections: [] };
    }
  },
  component: NewSnippetPage,
});

function NewSnippetPage() {
  const { t } = useTranslation();
  const data = Route.useLoaderData();
  const collections = data?.collections || [];
  const nav = useNavigate();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("Python");
  const [customLanguage, setCustomLanguage] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [collectionId, setCollectionId] = useState<string>("none");
  const [isEnriching, setIsEnriching] = useState(false);

  const handleAIEnrich = async () => {
    if (!code.trim()) {
      toast.error(t("snippets.paste_code_first"));
      return;
    }
    setIsEnriching(true);
    try {
      const finalLanguage = language === "other" ? customLanguage : language;
      const result = await api.post<any>("/ai/enrich", { code, language: finalLanguage });
      if (result.description) setDescription(result.description);
      if (result.tags && result.tags.length > 0) {
        const newTags = Array.from(new Set([...tags, ...result.tags.map((t: string) => t.toLowerCase())]));
        setTags(newTags);
      }
      toast.success(t("snippets.enrich_success"));
    } catch (e: any) {
      toast.error(t("snippets.enrich_error"));
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSave = async () => {
    if (!title || !code) {
      toast.error(t("snippets.form.required_fields"));
      return;
    }

    const finalLanguage = language === "other" ? customLanguage.trim() : language;
    if (language === "other" && !finalLanguage) {
      toast.error(t("snippets.form.language_required"));
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/snippets/", {
        title,
        language: finalLanguage,
        description,
        code,
        tags,
        collection_id: collectionId === "none" ? null : parseInt(collectionId),
      });
      toast.success(t("snippets.form.create_success"));
      await router.invalidate();
      nav({ to: "/snippets" });
    } catch (error: any) {
      toast.error(error.message || t("snippets.form.create_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Link to="/snippets" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> {t("snippets.back_to_list")}
      </Link>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("snippets.form.title")}</Label>
            <Input
              id="title"
              placeholder={t("snippets.form.title_placeholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lang">{t("snippets.form.language")}</Label>
            <div className="space-y-3">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="lang"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  <SelectItem value="other">{t("snippets.form.other")}</SelectItem>
                </SelectContent>
              </Select>
              {language === "other" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    placeholder={t("snippets.form.other_placeholder")}
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="collection">{t("snippets.form.collection")}</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger id="collection"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("snippets.form.no_collection")}</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("snippets.form.tags")}</Label>
            <div className="flex flex-wrap gap-2 p-2 rounded-md border border-input bg-input/40 min-h-[44px]">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/15 text-primary text-xs font-medium">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    setTags([...tags, tagInput.trim()]);
                    setTagInput("");
                  }
                }}
                placeholder={t("snippets.form.add_tag")}
                className="bg-transparent flex-1 min-w-[120px] outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">{t("snippets.form.description")}</Label>
          <Textarea
            id="desc"
            placeholder={t("snippets.form.desc_placeholder")}
            rows={2} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">{t("snippets.form.code")}</Label>
          <Textarea
            id="code"
            className="font-mono text-sm bg-muted/50"
            rows={10}
            placeholder={t("snippets.form.code_placeholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/5"
            onClick={handleAIEnrich}
            disabled={isEnriching || isLoading}
          >
            {isEnriching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {t("snippets.enrich_ai")}
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => nav({ to: "/snippets" })} disabled={isLoading || isEnriching}>
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1 sm:flex-none gradient-brand text-white border-0 hover:opacity-90"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
