import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Users, Code2, Cpu, FolderKanban, Loader2, Circle } from "lucide-react";
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

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Stats = {
  total_users: number;
  total_admins: number;
  total_snippets: number;
  total_collections: number;
  snippets_by_language: Record<string, number>;
};
type AiUsage = { total: number; by_feature: Record<string, number> };
type Privacy = { air_gapped: boolean; generation_provider: string; embedding_provider: string };
type AuditEntry = {
  id: number;
  category: string;
  action: string;
  actor: string | null;
  target: string | null;
  created_at: string | null;
};

const BAR_COLORS = ["#e8765a", "#c75a45", "#9e412f", "#55dcbc", "#b6c7eb"];
const FEATURE_LABELS: Record<string, string> = {
  enrich: "Enrichissement",
  explain: "Explication",
  translate: "Traduction",
  chat: "Chat",
  adapt: "Adaptation",
};
const ACTION_LABELS: Record<string, string> = {
  role_change: "Changement de rôle",
  user_delete: "Suppression de compte",
  login: "Connexion",
  login_failed: "Connexion échouée",
  air_gapped_toggle: "Bascule air-gapped",
};

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [privacy, setPrivacy] = useState<Privacy | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<Stats>("/admin/stats"),
      api.get<AiUsage>("/admin/ai-usage?days=30"),
      api.get<Privacy>("/ai/privacy"),
      api.get<AuditEntry[]>("/admin/audit?days=30&limit=6"),
    ])
      .then(([s, u, p, a]) => {
        if (cancelled) return;
        setStats(s);
        setUsage(u);
        setPrivacy(p);
        setAudit(a);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!stats) {
    return <div className="text-muted-foreground">Données indisponibles.</div>;
  }

  const kpis = [
    { label: "Utilisateurs", value: stats.total_users, icon: Users },
    { label: "Snippets", value: stats.total_snippets, icon: Code2 },
    { label: "Appels IA (30 j)", value: usage?.total ?? 0, icon: Cpu },
    { label: "Collections", value: stats.total_collections, icon: FolderKanban },
  ];

  const usageData = Object.entries(usage?.by_feature ?? {}).map(([k, v]) => ({
    name: FEATURE_LABELS[k] ?? k,
    value: v,
  }));

  const services = [
    {
      name: "Groq (génération)",
      ok: privacy ? privacy.generation_provider !== "ollama" : false,
      detail: privacy?.generation_provider ?? "—",
    },
    { name: "Embeddings (FastEmbed)", ok: true, detail: privacy?.embedding_provider ?? "fastembed" },
    { name: "Mode air-gapped", ok: !privacy?.air_gapped, detail: privacy?.air_gapped ? "activé" : "désactivé" },
    { name: "Base de données", ok: true, detail: "OK" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Vue d'ensemble</h1>
        <p className="text-sm text-muted-foreground">Santé et usage de la plateforme.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
                  <p className="mt-2 font-display text-3xl font-bold">{k.value}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Usage IA */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display font-semibold">Utilisation de l'IA (30 jours)</h2>
          {usageData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucun appel IA sur la période.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {usageData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* État des fournisseurs */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display font-semibold">État des services</h2>
          <ul className="space-y-3">
            {services.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Circle className={`h-2.5 w-2.5 ${s.ok ? "fill-emerald-500 text-emerald-500" : "fill-amber-500 text-amber-500"}`} />
                  {s.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{s.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Audit récent */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display font-semibold">Activité récente</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement récent.</p>
        ) : (
          <ul className="divide-y divide-border">
            {audit.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <span className="font-medium">{ACTION_LABELS[e.action] ?? e.action}</span>
                  {e.actor && <span className="text-muted-foreground"> · {e.actor}</span>}
                  {e.target && <span className="text-muted-foreground"> → {e.target}</span>}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{timeAgo(e.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
