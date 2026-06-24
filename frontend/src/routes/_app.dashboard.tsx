import { createFileRoute, Link } from "@tanstack/react-router";
import { Code2, FolderKanban, Star, Languages, Plus, ArrowRight, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  head: ({ loaderData }: any) => ({ meta: [{ title: `${loaderData?.t?.('dashboard.title') || 'Dashboard'} — Izwan` }] }),
  loader: async () => {
    if (typeof window === "undefined") {
      return { snippets: [], stats: [], needsClientFetch: true };
    }

    try {
      const data = await api.get<{ items: any[] }>("/snippets/?limit=100");
      const snippets = data.items.map(s => ({
        ...s,
        tags: s.tags.map((t: any) => t.name),
        dateObj: new Date(s.updated_at),
      }));
      
      const languages = new Set(snippets.map(s => s.language)).size;
      const tags = new Set(snippets.flatMap(s => s.tags)).size;
      const favorites = snippets.filter(s => s.is_favorite).length;

      return { 
        snippets: snippets.slice(0, 5),
        stats: [
          { label: "total_snippets", value: snippets.length, icon: Code2 },
          { label: "languages", value: languages, icon: Languages },
          { label: "unique_tags", value: tags, icon: FolderKanban },
          { label: "favorites", value: favorites, icon: Star },
        ],
        needsClientFetch: false
      };
    } catch (e) {
      return { snippets: [], stats: [], needsClientFetch: false };
    }
  },
  component: Dashboard,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function Dashboard() {
  const { t, i18n } = useTranslation();
  const data = Route.useLoaderData();
  const [snippets, setSnippets] = useState<any[]>(data?.snippets || []);
  const [stats, setStats] = useState<any[]>(data?.stats || []);
  const [isClientLoading, setIsClientLoading] = useState(false);

  useEffect(() => {
    if (data?.snippets && !data.needsClientFetch) {
      setSnippets(data.snippets);
      setStats(data.stats);
    }
  }, [data?.snippets, data?.stats, data?.needsClientFetch]);

  useEffect(() => {
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const res = await api.get<{ items: any[] }>("/snippets/?limit=100");
          const allSnippets = res.items.map(s => ({
            ...s,
            tags: s.tags.map((t: any) => t.name),
            dateObj: new Date(s.updated_at),
          }));
          
          setSnippets(allSnippets.slice(0, 5));
          
          const languages = new Set(allSnippets.map(s => s.language)).size;
          const tags = new Set(allSnippets.flatMap(s => s.tags)).size;
          const favorites = allSnippets.filter(s => s.is_favorite).length;

          setStats([
            { label: "total_snippets", value: allSnippets.length, icon: Code2 },
            { label: "languages", value: languages, icon: Languages },
            { label: "unique_tags", value: tags, icon: FolderKanban },
            { label: "favorites", value: favorites, icon: Star },
          ]);
        } catch (e) {
          console.error("Failed to fetch dashboard data on client", e);
        } finally {
          setIsClientLoading(false);
        }
      };
      fetchOnClient();
    }
  }, [data?.needsClientFetch]);

  const languageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    snippets.forEach(s => {
      counts[s.language] = (counts[s.language] || 0) + 1;
    });
    const total = snippets.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({ name, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }, [snippets]);

 蟻 topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    snippets.forEach(s => {
      s.tags?.forEach((tagName: string) => {
        counts[tagName] = (counts[tagName] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(t => t.name);
  }, [snippets]);

  const chartData = [40, 65, 30, 85, 55, 45, 95];

  if (isClientLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("dashboard.loading")}</p>
      </div>
    );
  }

  if (!data || (stats.length === 0 && !isClientLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl">
        <p className="text-muted-foreground mb-4">{t("dashboard.error")}</p>
        <Link to="/auth"><Button>{t("auth.login")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - Agrandit */}
      <div className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground tracking-tight">{t("dashboard.title", "Tableau de bord")}</h1>
        <p className="text-lg md:text-xl xl:text-2xl text-muted-foreground mt-2">{t("dashboard.subtitle", "Apercu de votre activite et de vos snippets.")}</p>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-12 gap-6">
        {/* Main Metrics + Chart (Bento Style) */}
        <div className="col-span-4 md:col-span-8 grid grid-cols-2 gap-4 content-start">
          {/* Stats Cards - Valeurs agrandies */}
          {stats.map((s, index) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={item}
                initial="hidden"
                animate="show"
                className="bg-card border border-border/50 rounded-xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Icon className="h-16 w-16 text-primary" />
                </div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  {t(`dashboard.stats.${s.label}`)}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground">{s.value}</span>
                  {index === 0 && (
                    <span className="text-xs xl:text-sm font-semibold text-green-600 flex items-center">
                      <BarChart3 className="h-3 w-3 mr-0.5" /> +12%
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Main Activity Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-2 bg-card border border-border/50 rounded-xl p-6 min-h-[300px] md:min-h-[400px] flex flex-col mt-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-foreground">{t("dashboard.activity", "Activite d'Insertion")}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs xl:text-sm h-8 xl:h-10">7J</Button>
                <Button size="sm" className="text-xs xl:text-sm h-8 xl:h-10 bg-primary text-white">30J</Button>
              </div>
            </div>
            <div className="flex-1 relative w-full h-full border-b border-l border-border/30 flex items-end gap-2 pt-8 pb-2 pl-2">
              {/* Y Axis */}
              <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-xs xl:text-sm text-muted-foreground opacity-70 py-2">
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              {/* Bars */}
              {chartData.map((h, i) => (
                <div key={i} className="w-full bg-primary/80 rounded-t-sm transition-all duration-500 hover:bg-primary/100" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Side Panel */}
        <div className="col-span-4 md:col-span-4 flex flex-col gap-6">
          {/* Language Distribution */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border/50 rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-base md:text-lg xl:text-xl font-semibold text-foreground mb-6">{t("dashboard.language_distribution", "Distribution par Langage")}</h3>
            <div className="space-y-4">
              {languageDistribution.length > 0 ? languageDistribution.map((lang) => (
                <div key={lang.name}>
                  <div className="flex justify-between text-xs xl:text-sm mb-1">
                    <span className="text-foreground font-medium">{lang.name}</span>
                    <span className="text-muted-foreground">{lang.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${lang.percentage}%` }}></div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-4">{t("dashboard.no_data", "Pas de donnees disponibles")}</div>
              )}
            </div>
          </motion.div>

          {/* Top Tags */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border/50 rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-base md:text-lg xl:text-xl font-semibold text-foreground mb-4">{t("dashboard.popular_tags", "Tags Populaires")}</h3>
            <div className="flex flex-wrap gap-2">
              {topTags.length > 0 ? topTags.map(tag => (
                <span key={tag} className="text-xs xl:text-sm bg-muted border border-border/50 text-foreground px-3 py-1.5 rounded-full hover:border-primary/50 transition-colors cursor-pointer">
                  #{tag}
                </span>
              )) : (
                <span className="text-sm text-muted-foreground">{t("dashboard.no_tags", "Aucun tag")}</span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Snippets - Agrandit */}
        <div className="col-span-4 md:col-span-12 mt-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">{t("dashboard.recent_snippets")}</h2>
            <Link to="/snippets" className="text-sm xl:text-base text-primary hover:underline flex items-center gap-1 font-medium">
              {t("dashboard.view_all")} <ArrowRight className="h-3 w-3 xl:h-4 xl:w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {snippets.length > 0 ? snippets.slice(0, 3).map((s) => {
              const isFav = s.is_favorite;
              return (
                <Link key={s.id} to="/snippets/$id" params={{ id: s.id.toString() }} className="block">
                  <div className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/50 transition-colors group cursor-pointer shadow-sm hover:shadow-md h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Code2 className="h-5 w-5 text-primary/80" />
                        <span className="text-xs xl:text-sm text-muted-foreground uppercase font-medium">{s.language}</span>
                      </div>
                      {isFav && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <h4 className="text-base lg:text-lg font-semibold text-foreground mb-2 truncate group-hover:text-primary transition-colors">{s.title}</h4>
                    <div className="text-sm xl:text-base font-mono text-muted-foreground/90 line-clamp-2 bg-muted/50 p-3 rounded border border-border/30 mt-auto">
                      {s.code || s.content || t("dashboard.no_content", "Aucun contenu")}
                    </div>
                  </div>
                </Link>
              );
            }) : (
              <div className="col-span-3 text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-xl">
                {t("dashboard.no_snippets")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
