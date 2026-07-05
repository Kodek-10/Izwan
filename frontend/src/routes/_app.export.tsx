import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
  Loader2,
  Download,
  FileText,
  FileCode,
  Trash2,
  Star,
  FolderOpen,
  Check,
  Square,
  CheckSquare2,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/config";

/* ------------------------------------------------------------------ */
// Types
/* ------------------------------------------------------------------ */

interface Snippet {
  id: number;
  title: string;
  language: string;
  code: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  collection_id?: number;
  collection_name?: string;
}

interface PaginatedSnippets {
  total: number;
  skip: number;
  items: Snippet[];
}

interface Collection {
  id: number;
  name: string;
}

interface ExportHistoryItem {
  id: string;
  file: string;
  date: string;
  size: string;
  format: string;
  status: "ready";
}

type FormatId = "markdown" | "pdf";

type SelectionMode = "all" | "filtered" | "custom";

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

function formatSize(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB"];
  let i = 0;
  let b = bytes;
  while (b >= 1024 && i < sizes.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function getDateStamp(): string {
  return new Date().toISOString().split("T")[0];
}

function getExt(format: string): string {
  if (format === "markdown") return "md";
  return format;
}

/* ------------------------------------------------------------------ */
// Component
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/_app/export")({
  head: () => ({ meta: [{ title: "Exportations — Izwan" }] }),
  component: ExportPage,
});

function ExportPage() {
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* ---------------------------------------------------------------- */
  // Load data (API returns paginated: { total, skip, items })
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    api.get<Collection[]>("/collections").then(setCollections).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.append("limit", "10000"); // get all
    if (favoritesOnly) params.append("favorite", "true");
    if (selectedCollection != null) params.append("collection_id", String(selectedCollection));

    api.get<PaginatedSnippets>(`/snippets?${params.toString()}`)
      .then((res) => setSnippets(res.items || []))
      .catch(() => setSnippets([]));
  }, [favoritesOnly, selectedCollection]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("export-history");
    if (saved) {
      try { setHistory(JSON.parse(saved)); }
      catch { localStorage.removeItem("export-history"); }
    }
  }, []);

  const saveHistory = (items: ExportHistoryItem[]) => {
    setHistory(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("export-history", JSON.stringify(items));
    }
  };

  const addHistory = (item: ExportHistoryItem) => {
    saveHistory([item, ...history].slice(0, 50));
  };

  /* Reset selection when data reloads */
  useEffect(() => { setSelectedIds(new Set()); }, [favoritesOnly, selectedCollection]);

  /* ---------------------------------------------------------------- */
  // Selection logic
  /* ---------------------------------------------------------------- */

  const filtered = snippets; /* already filtered by API */

  const snippetsToExport = (() => {
    if (selectionMode === "all") return filtered;
    if (selectionMode === "filtered") return filtered;
    return filtered.filter((s) => selectedIds.has(s.id));
  })();

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCount = snippetsToExport.length;

  /* ---------------------------------------------------------------- */
  // Export logic
  /* ---------------------------------------------------------------- */

  const download = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const exportMarkdown = (items: Snippet[]) => {
    if (items.length === 0) throw new Error("Aucun snippet à exporter");
    const md = items
      .map(
        (s) =>
          `## ${s.title}\n\n` +
          `\`\`\`${s.language}\n${s.code}\n\`\`\`\n\n` +
          `**Collection :** ${s.collection_name || "—"} | **Tags :** ${s.tags.join(", ") || "Aucun"} | **Favori :** ${s.is_favorite ? "Oui" : "Non"}\n`
      )
      .join("\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    download(blob, `izwan_export_${getDateStamp()}.md`);
    return formatSize(blob.size);
  };

  const exportServer = async (formatId: string, items: Snippet[]): Promise<string> => {
    // En mode "custom" on transmet les IDs sélectionnés via un POST
    // car la liste peut être longue et le backend doit savoir quels
    // snippets inclure au lieu d'appliquer seulement les filtres globaux.
    if (selectionMode === "custom") {
      const res = await fetch(`${API_URL}/export/${formatId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          ids: items.map((s) => s.id),
          format: formatId,
        }),
      });
      if (!res.ok) throw new Error("Export échoué");
      const blob = await res.blob();
      download(blob, `izwan_export_${getDateStamp()}.${getExt(formatId)}`);
      return formatSize(blob.size);
    }

    const p = new URLSearchParams();
    if (selectedCollection != null) p.append("collection_id", String(selectedCollection));
    if (favoritesOnly) p.append("favorite_only", "true");
    const q = p.toString() ? `?${p.toString()}` : "";

    const res = await fetch(`${API_URL}/export/${formatId}${q}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
    });
    if (!res.ok) throw new Error("Export échoué");
    const blob = await res.blob();
    download(blob, `izwan_export_${getDateStamp()}.${getExt(formatId)}`);
    return formatSize(blob.size);
  };

  const handleExport = async (formatId: FormatId) => {
    const items = snippetsToExport;
    if (items.length === 0) { toast.error("Aucun snippet à exporter"); return; }
    setIsLoading(true);
    let size = "—";
    try {
      if (formatId === "markdown") size = exportMarkdown(items);
      else size = await exportServer(formatId, items);
      toast.success("Export réussi !");
      addHistory({
        id: Date.now().toString(),
        file: `izwan_export_${getDateStamp()}.${getExt(formatId)}`,
        date: new Date().toLocaleString("fr-FR", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
        size, format: formatId, status: "ready" as const,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'export");
    } finally { setIsLoading(false); }
  };

  /* ---------------------------------------------------------------- */
  // Render helpers
  /* ---------------------------------------------------------------- */

  const formats = [
    { id: "markdown" as FormatId, name: "Markdown", desc: "Documentation lisible", icon: FileText, color: "text-amber-500", border: "hover:border-amber-500", ring: "focus:ring-amber-500" },
    { id: "pdf" as FormatId, name: "PDF", desc: "Rapport formaté (serveur)", icon: FileCode, color: "text-destructive", border: "hover:border-destructive", ring: "focus:ring-destructive" },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Exportations</h1>
        <p className="text-muted-foreground max-w-2xl">
          Exportez vos snippets. Filtrez par collection ou favoris, choisissez quels snippets exporter, puis sélectionnez un format.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Filtrer les snippets</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start flex-wrap">
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-3 w-full sm:w-auto">
            <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />
            <select
              value={selectedCollection?.toString() || ""}
              onChange={(e) => {
                setSelectedCollection(e.target.value ? Number(e.target.value) : null);
                setSelectionMode("all");
              }}
              className="bg-transparent border-0 outline-none text-sm text-foreground w-full appearance-none cursor-pointer pl-2"
            >
              <option value="">Toutes les collections</option>
              {collections.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>

          <button
            onClick={() => { setFavoritesOnly(!favoritesOnly); setSelectionMode("all"); }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 transition-colors ${favoritesOnly ? "border-amber-500/50 bg-amber-500/10 text-amber-700" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}
          >
            <Star className={`h-5 w-5 ${favoritesOnly ? "fill-amber-500 text-amber-500" : ""}`} />
            <span className="text-sm font-medium">Favoris uniquement</span>
          </button>
        </div>
      </div>

      {/* Selection Mode */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Quels snippets exporter ?</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setSelectionMode("all"); setSelectedIds(new Set()); }}
            className={`flex-1 sm:flex-none px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selectionMode === "all" ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
            <div className="flex items-center gap-2 justify-center">{selectionMode === "all" ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}<span>Tous</span></div>
          </button>
          <button onClick={() => { setSelectionMode("custom"); }}
            className={`flex-1 sm:flex-none px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selectionMode === "custom" ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
            <div className="flex items-center gap-2 justify-center">{selectionMode === "custom" ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}<span>Choisir manuellement</span></div>
          </button>
        </div>

        <AnimatePresence>
          {selectionMode === "custom" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{selectedIds.size}</span> / {filtered.length} sélectionné(s)</p>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedIds(new Set(filtered.map((s) => s.id)))} className="text-xs text-primary hover:underline">Tout</button>
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-primary hover:underline">Aucun</button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2 overscroll-contain">
                  {filtered.map((s) => {
                    const isSelected = selectedIds.has(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleSelect(s.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${isSelected ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:bg-muted/50"}`}>
                        <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>{isSelected && <Check className="h-3 w-3 text-white" />}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.language} · {s.tags.slice(0, 3).join(", ") || "Pas de tags"}</p>
                        </div>
                        {s.is_favorite && <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                  {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun snippet ne correspond aux filtres.</p>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Export Formats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Formats d'Export</h2>
          <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/30">{exportCount} snippet{exportCount !== 1 ? "s" : ""} à exporter</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {formats.map((fmt) => (
            <motion.button key={fmt.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => handleExport(fmt.id)} disabled={isLoading || exportCount === 0}
              className={`group text-left bg-card rounded-xl p-6 border transition-all relative overflow-hidden flex flex-col h-48 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${fmt.border} ${fmt.ring} border-border hover:border-primary/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-auto border border-border/30">
                <fmt.icon className={`h-6 w-6 ${fmt.color}`} />
              </div>
              <div className="relative z-10">
                <h3 className="font-semibold text-foreground mb-1">{fmt.name}</h3>
                <p className="text-xs text-muted-foreground">{fmt.desc}</p>
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Historique</h2>
          {history.length > 0 && (
            <button onClick={() => { if (window.confirm("Vider l'historique ?")) saveHistory([]); }} className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" /> Vider
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">Fichier</th>
                  <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">Date</th>
                  <th className="py-4 px-6 font-monon text-xs text-muted-foreground font-medium uppercase">Taille</th>
                  <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm text-foreground divide-y divide-border/50">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary">
                          <Archive className="h-4 w-4" />
                        </div>
                        <span className="font-mono text-sm text-foreground">{row.file}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{row.date}</td>
                    <td className="py-4 px-6 text-muted-foreground font-mono text-xs">{row.size}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Prêt
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground">
            <Download className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun export pour le moment.</p>
            <p className="text-xs mt-1">L'historique des téléchargements apparaîtra ici.</p>
          </div>
        )}
      </div>
    </div>
  );
}
