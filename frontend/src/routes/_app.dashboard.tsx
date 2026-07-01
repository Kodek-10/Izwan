import { createFileRoute, Link } from "@tanstack/react-router";
import { Code2, FolderKanban, Star, Globe, ArrowRight, Loader2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { chartTooltipProps } from "@/lib/chart-theme";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — Izwan" }] }),
  loader: async () => {
    if (typeof window === "undefined") {
      return { snippets: [], needsClientFetch: true };
    }
    try {
      const data = await api.get<{ items: any[] }>("/snippets/?limit=1000");
      return { snippets: mapSnippets(data.items), needsClientFetch: false };
    } catch (e) {
      return { snippets: [], needsClientFetch: false };
    }
  },
  component: Dashboard,
});

const COLORS = ["#e8765a", "#55dcbc", "#b6c7eb", "#c75a45", "#9e412f", "#f1c40f", "#8e7cc3", "#3178c6"];

function mapSnippets(items: any[]) {
  return items.map((s) => ({
    ...s,
    tags: (s.tags || []).map((t: any) => (typeof t === "string" ? t : t.name)),
    dateObj: new Date(s.updated_at),
  }));
}

function Dashboard() {
  const { t, i18n } = useTranslation();
  const data = Route.useLoaderData();
  const [snippets, setSnippets] = useState<any[]>(data?.snippets || []);
  const [isClientLoading, setIsClientLoading] = useState(false);

  useEffect(() => {
    if (data?.snippets && !data.needsClientFetch) setSnippets(data.snippets);
  }, [data?.snippets, data?.needsClientFetch]);

  useEffect(() => {
    if (data?.needsClientFetch) {
      setIsClientLoading(true);
      api
        .get<{ items: any[] }>("/snippets/?limit=1000")
        .then((res) => setSnippets(mapSnippets(res.items)))
        .catch((e) => console.error("Failed to fetch dashboard data", e))
        .finally(() => setIsClientLoading(false));
    }
  }, [data?.needsClientFetch]);

  const kpis = useMemo(() => {
    const languages = new Set(snippets.map((s) => s.language)).size;
    const tags = new Set(snippets.flatMap((s) => s.tags)).size;
    const favorites = snippets.filter((s) => s.is_favorite).length;
    return [
      { label: "total_snippets", value: snippets.length, icon: Code2 },
      { label: "languages", value: languages, icon: Globe },
      { label: "unique_tags", value: tags, icon: FolderKanban },
      { label: "favorites", value: favorites, icon: Star },
    ];
  }, [snippets]);

  const langData = useMemo(() => {
    const counts: Record<string, number> = {};
    snippets.forEach((s) => (counts[s.language] = (counts[s.language] || 0) + 1));
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [snippets]);

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    snippets.forEach((s) => s.tags?.forEach((n: string) => (counts[n] = (counts[n] || 0) + 1)));
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [snippets]);

  const colData = useMemo(() => {
    const counts: Record<string, number> = {};
    snippets.forEach((s) => {
      const name = s.collection_ref?.name || "Sans collection";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [snippets]);

  const growth = useMemo(() => {
    const months = t("statistics.months", { returnObjects: true }) as string[];
    const now = new Date();
    const out: { name: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = snippets.filter((s) => new Date(s.created_at) <= monthEnd).length;
      out.push({ name: Array.isArray(months) ? months[monthEnd.getMonth()] ?? "" : "", count });
    }
    return out;
  }, [snippets, t]);

  const recent = snippets.slice(0, 3);

  const toggleFavorite = async (id: number, current: boolean) => {
    try {
      await api.put(`/snippets/${id}`, { is_favorite: !current });
      setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, is_favorite: !current } : s)));
      toast.success(!current ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch (e) {
      toast.error("Erreur lors de la mise à jour du favori");
    }
  };

  if (isClientLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("dashboard.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {t("dashboard.title", "Tableau de bord")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.subtitle", "Aperçu de votre activité et de vos snippets.")}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    {t(`dashboard.stats.${s.label}`)}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Donut langages + croissance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-2 font-display font-semibold">Répartition par langage</h3>
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
            <p className="py-16 text-center text-sm text-muted-foreground">{t("dashboard.no_data", "Pas de données")}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-2 font-display font-semibold">Croissance de la bibliothèque</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="dashGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8765a" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#e8765a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipProps} />
                <Area type="monotone" dataKey="count" stroke="#e8765a" strokeWidth={2.5} fill="url(#dashGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top tags + collections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-4 font-display font-semibold">Tags les plus utilisés</h3>
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

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-4 font-display font-semibold">Snippets par collection</h3>
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

      {/* Snippets récents */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{t("dashboard.recent_snippets")}</h2>
          <Link to="/snippets" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t("dashboard.view_all")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {recent.length > 0 ? (
            recent.map((s) => (
              <div key={s.id} className="relative">
                <Link to="/snippets/$id" params={{ id: s.id.toString() }} className="block">
                  <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/50">
                    <div className="mb-4 flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary/80" />
                      <span className="text-sm font-medium uppercase text-muted-foreground">{s.language}</span>
                    </div>
                    <h4 className="mb-2 truncate text-lg font-semibold">{s.title}</h4>
                    <div className="mt-auto line-clamp-2 rounded border border-border/30 bg-muted/50 p-3 font-mono text-sm text-muted-foreground/90">
                      {s.code || t("dashboard.no_content", "Aucun contenu")}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(s.id, s.is_favorite);
                  }}
                  className="absolute right-4 top-4 z-10 rounded-full p-1.5 transition-colors hover:bg-accent"
                  aria-label={s.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Star className={`h-5 w-5 ${s.is_favorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-xl border-2 border-dashed border-border py-8 text-center text-muted-foreground">
              {t("dashboard.no_snippets")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
