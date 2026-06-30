import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { Loader2, RotateCcw } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { chartTooltipProps } from "@/lib/chart-theme";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAudit,
});

type AuditEntry = {
  id: number;
  category: string;
  action: string;
  actor: string | null;
  target: string | null;
  detail: string | null;
  created_at: string | null;
};

const CATEGORIES = [
  { value: "all", label: "Toutes les catégories" },
  { value: "admin", label: "Actions admin" },
  { value: "auth", label: "Authentification" },
  { value: "system", label: "Système" },
];
const PERIODS = [
  { value: "7", label: "7 derniers jours" },
  { value: "30", label: "30 derniers jours" },
  { value: "90", label: "90 derniers jours" },
];
const ACTION_LABELS: Record<string, string> = {
  role_change: "Changement de rôle",
  user_delete: "Suppression de compte",
  login: "Connexion réussie",
  login_failed: "Connexion échouée",
  air_gapped_toggle: "Bascule air-gapped",
};
const CAT_LABELS: Record<string, string> = { admin: "Admin", auth: "Auth", system: "Système" };
const CAT_COLOR: Record<string, string> = { admin: "#e8765a", auth: "#55dcbc", system: "#b6c7eb" };

function fmt(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminAudit() {
  const [events, setEvents] = useState<AuditEntry[]>([]);
  const [category, setCategory] = useState("all");
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ days, limit: "100" });
    if (category !== "all") params.append("category", category);
    api
      .get<AuditEntry[]>(`/admin/audit?${params.toString()}`)
      .then((e) => !cancelled && setEvents(e))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, days]);

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.category] = (counts[e.category] ?? 0) + 1;
    return Object.entries(counts).map(([cat, value]) => ({
      name: CAT_LABELS[cat] ?? cat,
      cat,
      value,
    }));
  }, [events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Journal d'audit</h1>
        <p className="text-sm text-muted-foreground">Suivi des actions sensibles, connexions et événements système.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Filtres */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filtres</h2>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Période</label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Catégorie</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setCategory("all");
              setDays("30");
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
          </Button>
        </div>

        {/* Répartition */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display font-semibold">Répartition par catégorie</h2>
          {distribution.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucun événement sur la période.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip {...chartTooltipProps} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {distribution.map((d) => (
                    <Cell key={d.cat} fill={CAT_COLOR[d.cat] ?? "#9e412f"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
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
                <TableHead>Horodatage</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Acteur</TableHead>
                <TableHead>Cible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">{fmt(e.created_at)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{ borderColor: CAT_COLOR[e.category], color: CAT_COLOR[e.category] }}
                    >
                      {CAT_LABELS[e.category] ?? e.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{ACTION_LABELS[e.action] ?? e.action}</TableCell>
                  <TableCell className="text-muted-foreground">{e.actor ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.target ?? "—"}</TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun événement.
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
