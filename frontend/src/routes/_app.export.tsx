import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { api } from "@/lib/api-client";
import {
  Loader2,
  Download,
  FileJson,
  Table,
  FileText,
  FileCode,
  CloudCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const EXPORT_FORMATS = [
  {
    id: "json",
    name: "JSON",
    desc: "Données brutes & hiérarchiques",
    icon: FileJson,
    color: "text-primary",
    bg: "bg-primary/10",
    borderColor: "hover:border-primary",
    ringColor: "focus:ring-primary-container",
  },
  {
    id: "csv",
    name: "CSV",
    desc: "Tables & tableurs",
    icon: Table,
    color: "text-secondary",
    bg: "bg-secondary/10",
    borderColor: "hover:border-secondary",
    ringColor: "focus:ring-secondary",
  },
  {
    id: "markdown",
    name: "Markdown",
    desc: "Documentation lisible",
    icon: FileText,
    color: "text-foreground",
    bg: "bg-muted",
    borderColor: "hover:border-foreground",
    ringColor: "focus:ring-foreground",
  },
  {
    id: "pdf",
    name: "PDF",
    desc: "Rapports formatés",
    icon: FileCode,
    color: "text-destructive",
    bg: "bg-destructive/10",
    borderColor: "hover:border-destructive",
    ringColor: "focus:ring-destructive",
  },
];

const HISTORY = [
  {
    file: "dataset_q3_final.json",
    date: "Aujourd'hui, 14:32",
    size: "2.4 MB",
    status: "Prêt",
    format: "json",
  },
  {
    file: "user_metrics_export.csv",
    date: "Hier, 09:15",
    size: "856 KB",
    status: "Prêt",
    format: "csv",
  },
  {
    file: "annual Report_draft.pdf",
    date: "12 Oct 2023",
    size: "12.1 MB",
    status: "En cours",
    format: "pdf",
  },
];

export const Route = createFileRoute("/_app/export")({
  head: ({ loaderData }: any) => ({
    meta: [
      {
        title: `${
          loaderData?.t?.("export.title") || "Exportations"
        } — Izwan`,
      },
    ],
  }),
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
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (formatId: string) => {
    setIsLoading(true);
    try {
      const endpoint =formatId === "pdf" ? "/export/pdf" : "/export/markdown";
      const token = localStorage.getItem("token");
      const response = await fetch(`${api.baseUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =`izwa_export_${new Date().toISOString().split("T")[0]}.${
        formatId === "pdf" ? "pdf" : "md"
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export réussi!");
    } catch (e) {
      toast.error("Erreur lors de l'export");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Exportations
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Gérez, formatez et téléchargez vos ensembles de données. Sélectionnez un format pour initier un nouvel export.
          </p>
        </div>

        {/* Cloud Sync Status */}
        <div className="bg-card/50 backdrop-blur-md border border-border rounded-xl p-4 flex items-center gap-4 shrink-0 w-fit">
          <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
            <CloudCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-xs text-foreground uppercase tracking-wider mb-1">
              État du Cloud
            </p>
            <p className="text-tertiary flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              Synchronisation active
            </p>
          </div>
        </div>
      </div>

      {/* Format Grid */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Nouveau Format d'Export
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPORT_FORMATS.map((fmt) => (
            <motion.button
              key={fmt.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport(fmt.id)}
              disabled={isLoading}
              className={`group text-left bg-card rounded-xl p-6 border transition-all relative overflow-hidden flex flex-col h-48 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${fmt.borderColor} ${fmt.ringColor} border-border hover:border-primary/50 shadow-sm`}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-auto border border-border/30">
                <fmt.icon
                  className={`h-6 w-6 ${fmt.color}`}
                />
              </div>
              <div className="relative z-10">
                <h3 className="font-semibold text-foreground mb-1">
                  {fmt.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {fmt.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Historique d'Exportation
          </h2>
          <button className="font-mono text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            Tout voir <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">
                  Fichier
                </th>
                <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">
                  Date
                </th>
                <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">
                  Taille
                </th>
                <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase">
                  Statut
                </th>
                <th className="py-4 px-6 font-mono text-xs text-muted-foreground font-medium uppercase text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-foreground divide-y divide-border/50">
              {HISTORY.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary">
                        {row.format === "json" && <FileJson className="h-4 w-4" />}
                        {row.format === "csv" && <Table className="h-4 w-4" />}
                        {row.format === "pdf" && <FileCode className="h-4 w-4" />}
                      </div>
                      <span className="font-mono text-sm text-foreground">
                        {row.file}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">
                    {row.date}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground font-mono text-xs">
                    {row.size}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${
                        row.status === "Prêt"
                          ? "bg-tertiary/10 text-tertiary border-tertiary/20"
                          : "bg-muted text-muted-foreground border-border/30"
                      }`}
                    >
                      {row.status === "Prêt" ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                          Prêt
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 animate-spin" />
                          En cours
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      disabled={row.status !== "Prêt"}
                      className="text-muted-foreground hover:text-primary transition-colors p-2 disabled:opacity-40"
                      title={
                        row.status === "Prêt"
                          ? "Télécharger"
                          : "En cours..."
                      }
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
