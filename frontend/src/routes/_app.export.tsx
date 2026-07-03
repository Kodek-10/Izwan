import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
  Loader2,
  Download,
  FileJson,
  Table,
  FileText,
  FileCode,
  Trash2,
  Star,
  FolderOpen,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
  if (format === "pdf") return "pdf";
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

  useEffect(() => {
    api.get<Collection[]>("/collections/").then(setCollections).catch(() => {});
    api.get<Snippet[]>("/snippets/").then(setSnippets).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("export-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        localStorage.removeItem("export-history");
      }
    }
  }, []);

  const saveHistory = (items: ExportHistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("export-history", JSON.stringify(items));
  };

  const addHistory = (item: ExportHistoryItem) => {
    saveHistory([item, ...history].slice(0, 50));
  };

  /* ---------------------------------------------------------------- */
  // Exports
  /* ---------------------------------------------------------------- */

  const getFiltered = () => {
    let f = snippets;
    if (selectedCollection) {
      f = f.filter((s) => s.collection_id === selectedCollection);
    }
    if (favoritesOnly) {
      f = f.filter((s) => s.is_favorite);
    }
    return f;
  };

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

  const exportCsvClientSide = () => {
    const filtered = getFiltered();
    if (filtered.length === 0) {
      throw new Error("Aucun snippet à exporter");
    }
    const headers = ["id", "title", "language", "code", "tags", "is_favorite", "created_at", "updated_at", "collection_name"];
    const rows = filtered.map((s) => [
      s.id,
      s.title,
      s.language,
      JSON.stringify(s.code),
      s.tags.join(";"),
      s.is_favorite ? "true" : "false",
      s.created_at,
      s.updated_at,
      s.collection_name || "",
    ]);
    const csvContent = [headers.join(",")]
      .concat(
        rows.map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    download(blob, `izwan_export_${getDateStamp()}.csv`);
    return formatSize(blob.size);
  };

  const exportServerSide = async (formatId: string): Promise<string> => {
    const params = new URLSearchParams();
    if (selectedCollection) params.append("collection_id", String(selectedCollection));
    if (favoritesOnly) params.append("favorite_only", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    const endpoint = `/api/v1/export/${formatId}${query}`;

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
    });

    if (!response.ok) throw new Error("Export server failed");

    const blob = await response.blob();
    const ext = getExt(formatId);
    download(blob, `izwan_export_${getDateStamp()}.${ext}`);
    return formatSize(blob.size);
  };

  const handleExport = async (formatId: string) => {
    setIsLoading(true);
    let size = "—";

    try {
      if (formatId === "csv") {
        size = exportCsvClientSide();
        toast.success("Export CSV réussi !");
      } else if (formatId === "json") {
        const filtered = getFiltered();
        const content = JSON.stringify(filtered, null, 2);
        const blob = new Blob([content], { type: "application/json" });
        download(blob, `izwan_export_${getDateStamp()}.json`);
        size = formatSize(blob.size);
        toast.success("Export JSON réussi !");
      } else {
        size = await exportServerSide(formatId);
        toast.success(`Export ${formatId.toUpperCase()} réussi !`);
      }

      addHistory({
        id: Date.now().toString(),
        file: `izwan_export_${getDateStamp()}.${getExt(formatId)}`,
        date: new Date().toLocaleString("fr-FR", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        size,
        format: formatId,
        status: "ready",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'export");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  // Render
  /* ---------------------------------------------------------------- */

  const formats = [
    { id: "csv", name: "CSV", desc: "Tables & tableurs", icon: Table, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "hover:border-emerald-500", ring: "focus:ring-emerald-500" },
    { id: "markdown", name: "Markdown", desc: "Documentation lisible", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10", border: "hover:border-amber-500", ring: "focus:ring-amber-500" },
    { id: "pdf", name: "PDF", desc: "Rapports formatés", icon: FileCode, color: "text-destructive", bg: "bg-destructive/10", border: "hover:border-destructive", ring: "focus:ring-destructive" },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Exportations</h1>
          <p className="text-muted-foreground max-w-2xl">
            Exportez vos snippets dans différents formats. Filtrez par collection ou favoris avant d'exporter.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex items-center gap-2 bg-card/50 backdrop-blur-md border border-border rounded-xl p-4 w-full sm:w-auto">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <select
            value={selectedCollection?.toString() || ""}
            onChange={(e) => setSelectedCollection(e.target.value ? Number(e.target.value) : null)}
            className="bg-transparent border-0 outline-none text-sm text-foreground w-full appearance-none cursor-pointer pl-2"
          >
            <option value="">Toutes les collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`flex items-center gap-2 rounded-xl border p-4 transition-colors ${
            favoritesOnly
              ? "border-amber-500/50 bg-amber-500/10 text-amber-700"
              : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className={`h-5 w-5 ${favoritesOnly ? "fill-amber-500 text-amber-500" : ""}`} />
          <span className="text-sm font-medium">Favoris uniquement</span>
        </button>
      </div>

      {/* Formats */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">Nouvel Export</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {formats.map((fmt) => (
            <motion.button
              key={fmt.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport(fmt.id)}
              disabled={isLoading}
              className={`group text-left bg-card rounded-xl p-6 border transition-all relative overflow-hidden flex flex-col h-48 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${fmt.border} ${fmt.ring} border-border hover:border-primary/50 shadow-sm`}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-auto border border-border/30">
                <fmt.icon className={`h-6 w-6 ${fmt.color}`} />
              </div>
              <div className="relative z-10">
                <h3 className="font-semibold text-foreground mb-1">{fmt.name}</h3>
                <p className="text-xs text-muted-foreground">{fmt.desc}</p>
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
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
            <button
              onClick={() => { if (window.confirm("Vider l'historique ?")) saveHistory([]); }}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
            >
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
                  <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">Taille</th>
                  <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm text-foreground divide-y divide-border/50">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary">
                          {row.format === "csv" && <Table className="h-4 w-4" />}
                          {row.format === "json" && <FileJson className="h-4 w-4" />}
                          {row.format === "markdown" && <FileText className="h-4 w-4" />}
                          {row.format === "pdf" && <FileCode className="h-4 w-4" />}
                        </div>
                        <span className="font-mono text-sm text-foreground">{row.file}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{row.date}</td>
                    <td className="py-4 px-6 text-muted-foreground font-mono text-xs">{row.size}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Prêt
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
