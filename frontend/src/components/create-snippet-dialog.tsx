import { useState, useEffect } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/code-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LANGUAGES } from "@/lib/languages";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface CreateSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSnippetDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSnippetDialogProps) {
  const [collections, setCollections] = useState<any[]>([]);
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

  useEffect(() => {
    if (open) {
      api
        .get<any[]>("/collections/")
        .then(setCollections)
        .catch(() => {});
    }
  }, [open]);

  const handleAIEnrich = async () => {
    if (!code.trim()) {
      toast.error("Collez d'abord du code");
      return;
    }
    setIsEnriching(true); // setIsEnriching
    try {
      const finalLanguage = language === "other" ? customLanguage : language;
      const result = await api.post<any>("/ai/enrich", { code, language: finalLanguage });
      if (result.description) setDescription(result.description);
      if (result.tags && result.tags.length > 0) {
        const newTags = Array.from(
          new Set([...tags, ...result.tags.map((t: string) => t.toLowerCase())]),
        );
        setTags(newTags);
      }
      toast.success("Snippet enrichi par l'IA");
    } catch (e: any) {
      toast.error("Erreur lors de l'enrichissement");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSave = async () => {
    if (!title || !code) {
      toast.error("Titre et code sont requis");
      return;
    }

    const finalLanguage = language === "other" ? customLanguage.trim() : language;
    if (language === "other" && !finalLanguage) {
      toast.error("Langage requis");
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
      toast.success("Snippet créé avec succès");
      onOpenChange(false);
      onSuccess?.();
      // reset form
      setTitle("");
      setLanguage("Python");
      setCustomLanguage("");
      setDescription("");
      setCode("");
      setTags([]);
      setTagInput("");
      setCollectionId("none");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-subtle">
        <DialogHeader>
          <DialogTitle>Nouveau Snippet</DialogTitle>
          <DialogDescription>
            Créez un nouveau snippet de code réutilisable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                placeholder="Titre du snippet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lang">Langage</Label>
              <div className="space-y-3">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="lang">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {language === "other" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <Input
                      placeholder="Langage custom"
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
              <Label htmlFor="collection">Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger id="collection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune collection</SelectItem>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 p-2 rounded-md border border-input bg-input/40 min-h-[44px]">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/15 text-primary text-xs font-medium"
                  >
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
                  placeholder="Ajouter un tag"
                  className="bg-transparent flex-1 min-w-[120px] outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Description optionnelle"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <CodeEditor
              id="code"
              language={language === "other" ? customLanguage || "text" : language}
              placeholder="Collez votre code ici..."
              value={code}
              onChange={setCode}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/5"
              onClick={handleAIEnrich}
              disabled={isEnriching}
            >
              {isEnriching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Enrichir par IA
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                variant="default"
                className="flex-1 sm:flex-none"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
