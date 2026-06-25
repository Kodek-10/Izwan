import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Trash2, Search, Code2, Users, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/snippets")({
  component: AdminSnippets,
});

type AdminSnippet = {
  id: number;
  title: string;
  language: string;
  owner: string | null;
  tags: string[];
  created_at: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function AdminSnippets() {
  const [snippets, setSnippets] = useState<AdminSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState("all");

  useEffect(() => {
    let cancelled = false;
    api
      .get<AdminSnippet[]>("/admin/snippets")
      .then((s) => !cancelled && setSnippets(s))
      .catch(() => !cancelled && toast.error("Chargement impossible"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const languages = useMemo(() => Array.from(new Set(snippets.map((s) => s.language))).sort(), [snippets]);

  const topLang = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of snippets) counts[s.language] = (counts[s.language] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [snippets]);

  const authorCount = useMemo(() => new Set(snippets.map((s) => s.owner)).size, [snippets]);

  const filtered = useMemo(
    () =>
      snippets.filter(
        (s) =>
          (lang === "all" || s.language === lang) &&
          (!search ||
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            (s.owner ?? "").toLowerCase().includes(search.toLowerCase())),
      ),
    [snippets, search, lang],
  );

  const remove = async (s: AdminSnippet) => {
    setBusyId(s.id);
    try {
      await api.delete(`/admin/snippets/${s.id}`);
      setSnippets((prev) => prev.filter((x) => x.id !== s.id));
      toast.success("Snippet supprimé");
    } catch (e: any) {
      toast.error(e.message || "Suppression impossible");
    } finally {
      setBusyId(null);
    }
  };

  const kpis = [
    { label: "Total snippets", value: snippets.length, icon: Code2 },
    { label: "Auteurs", value: authorCount, icon: Users },
    { label: "Langage le plus utilisé", value: topLang, icon: Languages },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Gestion des snippets</h1>
        <p className="text-sm text-muted-foreground">
          Métadonnées des snippets de la plateforme — le code reste privé, jamais affiché.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
                  <p className="mt-2 font-display text-2xl font-bold">{k.value}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (titre, auteur)…"
            className="pl-9"
          />
        </div>
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Langage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les langages</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Snippet</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Langage</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell className="text-muted-foreground">{s.owner ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.language}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                      {s.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{s.tags.length - 3}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">{fmtDate(s.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === s.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer « {s.title} » ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Le snippet de {s.owner ?? "—"} sera définitivement supprimé. Irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => remove(s)}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun snippet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
