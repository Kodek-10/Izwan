import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Users, ShieldCheck, Code2, FolderKanban, Loader2 } from "lucide-react";
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

export const Route = createFileRoute("/_app/admin/")({
  component: AdminDashboard,
});

type Stats = {
  total_users: number;
  total_admins: number;
  total_snippets: number;
  total_collections: number;
  snippets_by_language: Record<string, number>;
};

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6"];

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Stats>("/admin/stats")
      .then((s) => !cancelled && setStats(s))
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
    return <div className="text-muted-foreground">Statistiques indisponibles.</div>;
  }

  const cards = [
    { label: "Utilisateurs", value: stats.total_users, icon: Users, color: "from-violet-500 to-indigo-500" },
    { label: "Administrateurs", value: stats.total_admins, icon: ShieldCheck, color: "from-blue-500 to-cyan-500" },
    { label: "Snippets", value: stats.total_snippets, icon: Code2, color: "from-cyan-500 to-teal-500" },
    { label: "Collections", value: stats.total_collections, icon: FolderKanban, color: "from-amber-500 to-pink-500" },
  ];

  const langData = Object.entries(stats.snippets_by_language).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
                  <p className="text-3xl font-display font-bold mt-2">{c.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center shrink-0`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-semibold mb-4">Snippets par langage</h2>
        {langData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun snippet pour le moment.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={langData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {langData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
