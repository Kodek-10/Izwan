import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { chartTooltipProps } from "@/lib/chart-theme";
import { Code2, Globe, Star, Tag as TagIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/statistics")({
  head: () => ({ meta: [{ title: "Statistiques — Izwan" }] }),
  loader: async () => {
    if (typeof window === "undefined") {
      return { snippets: [], needsClientFetch: true };
    }
    try {
      const data = await api.get<{ items: any[] }>("/snippets/?limit=1000");
      return { snippets: data.items, needsClientFetch: false };
    } catch (e) {
      return { snippets: [], needsClientFetch: false };
    }
  },
  component: StatsPage,
});

const COLORS = ["#e8765a", "#55dcbc", "#b6c7eb", "#c75a45", "#9e412f", "#f1c40f", "#8e7cc3", "#3178c6"];

function tagName(tg: any): string {
  return typeof tg === "string" ? tg : tg?.name ?? "";
}

function StatsPage() {
  const { t } = useTranslation();
  const data = Route.useLoaderData();
  const [snippets, setSnippets] = useState<any[]>(data?.snippets || []);
  const [isClientLoading, setIsClientLoading] = useState(false);

  useEffect(() => {
    if (data?.snippets && !data.needsClientFetch) setSnippets(data.snippets);
  }, [data?.snippets, data?.needsClientFetch]);

  useEffect(() => {
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const res = await api.get<{ items: any[] }>("/snippets/?limit=1000");
          setSnippets(res.items);
        } catch (e) {
          console.error("Failed to fetch statistics on client", e);
        } finally {
          setIsClientLoading(false);
        }
      };
      fetchOnClient();
    }
  }, [data?.needsClientFetch]);

  if (isClientLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("statistics.loading")}</p>
      </div>
    );
  }

  // Langages
  const langCounts: Record<string, number> = {};
  snippets.forEach((s) => (langCounts[s.language] = (langCounts[s.language] || 0) + 1));
  const langData = Object.entries(langCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Tags
  const tagCounts: Record<string, number> = {};
  snippets.forEach((s) =>
    (s.tags || []).forEach((tg: any) => {
      const name = tagName(tg);
      if (name) tagCounts[name] = (tagCounts[name] || 0) + 1;
    }),
  );
  const topTags = Object.entries(tagCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Collections
  const colCounts: Record<string, number> = {};
  snippets.forEach((s) => {
    const name = s.collection_ref?.name || "Sans collection";
    colCounts[name] = (colCounts[name] || 0) + 1;
  });
  const colData = Object.entries(colCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Croissance cumulée (6 derniers mois)
  const months = t("statistics.months", { returnObjects: true }) as string[];
  const now = new Date();
  const cumulative: { name: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const count = snippets.filter((s) => new Date(s.created_at) <= monthEnd).length;
    cumulative.push({ name: months?.[monthEnd.getMonth()] ?? "", count });
  }

  const favorites = snippets.filter((s) => s.is_favorite).length;
  const uniqueTags = Object.keys(tagCounts).length;

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title={t("statistics.cards.total")} value={snippets.length} icon={<Code2 />} color="bg-primary" />
        <StatCard title={t("statistics.cards.languages")} value={langData.length} icon={<Globe />} color="bg-sky-500" />
        <StatCard title="Favoris" value={favorites} icon={<Star />} color="bg-amber-500" />
        <StatCard title="Tags uniques" value={uniqueTags} icon={<TagIcon />} color="bg-teal-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut langages */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-2 font-display text-base font-semibold sm:text-lg">{t("statistics.distribution")}</h3>
          {langData.length > 0 ? (
            <div className="relative h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={80} paddingAngle={3}>
                    {langData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipProps} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold">{snippets.length}</span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">snippets</span>
              </div>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">{t("snippets.no_results")}</p>
          )}
        </div>

        {/* Croissance cumulée */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-2 font-display text-base font-semibold sm:text-lg">Croissance de la bibliothèque</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulative}>
                <defs>
                  <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8765a" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#e8765a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipProps} />
                <Area type="monotone" dataKey="count" stroke="#e8765a" strokeWidth={2.5} fill="url(#growth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top tags */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-4 font-display text-base font-semibold sm:text-lg">Tags les plus utilisés</h3>
          {topTags.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(160, topTags.length * 30)}>
              <BarChart data={topTags} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipProps} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {topTags.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucun tag pour le moment.</p>
          )}
        </div>

        {/* Snippets par collection */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-4 font-display text-base font-semibold sm:text-lg">Snippets par collection</h3>
          {colData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(160, colData.length * 30)}>
              <BarChart data={colData} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipProps} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#55dcbc" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune collection.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: any; icon: any; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-white`}>{icon}</div>
        <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{title}</p>
    </div>
  );
}
