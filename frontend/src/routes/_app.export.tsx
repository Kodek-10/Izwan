import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { Loader2, Download, FileText, FileCode } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/export")({
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.t?.('export.title') || 'Exportations'} — Izwa` }] }),
  loader: async () => {
    try {
      const collections = await api.get<any[]>("/collections/");
      return { collections };
    } catch (e) {
      return { collections: [] };
    }
  },
  component: ExportPage,
});

function ExportPage() {
  const { t } = useTranslation();
  const { collections = [] } = Route.useLoaderData();
  const [format, setFormat] = useState("markdown");
  const [scope, setScope] = useState("all");
  const [collectionId, setCollectionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (scope === "favorites") queryParams.append("favorite_only", "true");
      if (scope === "collection" && collectionId) queryParams.append("collection_id", collectionId);
      
      const endpoint = format === "markdown" ? "/export/markdown" : "/export/pdf";
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${api.baseUrl}${endpoint}?${queryParams.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `izwa_export_${new Date().toISOString().split('T')[0]}.${format === "markdown" ? "md" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(t("export.success"));
    } catch (e) {
      toast.error(t("export.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-2xl">{t("export.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("export.subtitle")}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 space-y-8 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("export.format_title")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setFormat("markdown")}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                format === "markdown" ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-primary/50"
              }`}
              suppressHydrationWarning
            >
              <FileCode className={`h-8 w-8 ${format === "markdown" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className="font-semibold text-sm">Markdown</p>
                <p className="text-[10px] text-muted-foreground">{t("export.markdown_desc")}</p>
              </div>
            </button>
            <button 
              onClick={() => setFormat("pdf")}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                format === "pdf" ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-primary/50"
              }`}
              suppressHydrationWarning
            >
              <FileText className={`h-8 w-8 ${format === "pdf" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className="font-semibold text-sm">{t("export.pdf_title")}</p>
                <p className="text-[10px] text-muted-foreground">{t("export.pdf_desc")}</p>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("export.content_title")}</h3>
          <RadioGroup value={scope} onValueChange={setScope} className="space-y-3">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${scope === "all" ? "border-primary/50 bg-primary/5" : "border-border"}`}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-medium cursor-pointer">{t("export.scope_all")}</Label>
              </div>
              <span className="text-xs text-muted-foreground">{t("export.scope_all_desc")}</span>
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border ${scope === "favorites" ? "border-primary/50 bg-primary/5" : "border-border"}`}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="favorites" id="favorites" />
                <Label htmlFor="favorites" className="font-medium cursor-pointer">{t("export.scope_favorites")}</Label>
              </div>
              <span className="text-xs text-muted-foreground font-medium text-amber-500">★ {t("nav.favorites")}</span>
            </div>

            <div className={`space-y-3 p-4 rounded-xl border ${scope === "collection" ? "border-primary/50 bg-primary/5" : "border-border"}`}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="collection" id="collection" />
                <Label htmlFor="collection" className="font-medium cursor-pointer">{t("export.scope_collection")}</Label>
              </div>
              {scope === "collection" && (
                <div className="pl-7 pt-1 animate-in fade-in slide-in-from-top-1">
                  <Select value={collectionId} onValueChange={setCollectionId}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder={t("export.choose_collection")} />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </RadioGroup>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={isLoading || (scope === "collection" && !collectionId)}
          className="w-full gradient-brand text-white border-0 hover:opacity-90 h-14 text-base font-semibold shadow-lg shadow-primary/20"
        >
          {isLoading ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-3" /> {t("export.btn_exporting")}</>
          ) : (
            <><Download className="h-5 w-5 mr-3" /> {t("export.btn_export")}</>
          )}
        </Button>
      </div>
      
      <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
        {t("export.footer_note")}
      </p>
    </div>
  );
}

