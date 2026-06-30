import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api-client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { chartTooltipProps } from "@/lib/chart-theme";
import { LayoutDashboard, Code2, Clock, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/statistics")({
  head: () => ({ meta: [{ title: "Statistiques — Izwan" }] }),
  loader: async () => {
    // On server, we can't access localStorage for the auth token.
    if (typeof window === "undefined") {
      return { snippets: [], needsClientFetch: true };
    }

    try {
      const data = await api.get<{ items: any[] }>("/snippets/?limit=1000");
      return { 
        snippets: data.items,
        needsClientFetch: false
      };
    } catch (e) {
      return { snippets: [], needsClientFetch: false };
    }
  },
  component: StatsPage,
});

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

function StatsPage() {
  const { t, i18n: i18nInstance } = useTranslation();
  const data = Route.useLoaderData();
  const [snippets, setSnippets] = useState<any[]>(data?.snippets || []);
  const [isClientLoading, setIsClientLoading] = useState(false);

  useEffect(() => {
    if (data?.snippets && !data.needsClientFetch) {
      setSnippets(data.snippets);
    }
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("statistics.loading")}</p>
      </div>
    );
  }

  // Calculate stats dynamically based on current language
  const langCounts: Record<string, number> = {};
  snippets.forEach(s => {
    langCounts[s.language] = (langCounts[s.language] || 0) + 1;
  });
  
  const pieData = Object.entries(langCounts).map(([name, value]) => ({ name, value }));
  const topLanguages = [...pieData].sort((a, b) => b.value - a.value).slice(0, 4);

  const months = t("statistics.months", { returnObjects: true }) as string[];
  const lineData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    lineData.push({
      name: months[d.getMonth()],
      count: snippets.filter(s => {
        const sd = new Date(s.created_at);
        return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      }).length,
    });
  }

  const recentActivity = snippets.slice(0, 5).map(s => ({
    ...s,
    dateStr: new Date(s.updated_at).toLocaleDateString(i18nInstance.language === 'fr' ? 'fr-FR' : 'en-US'),
  }));

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("statistics.cards.total")} value={snippets.length} icon={<Code2 />} color="bg-blue-500" />
        <StatCard title={t("statistics.cards.languages")} value={pieData.length} icon={<Globe />} color="bg-indigo-500" />
        <StatCard title={t("statistics.cards.activity")} value={lineData.reduce((acc, curr) => acc + curr.count, 0)} icon={<LayoutDashboard />} color="bg-pink-500" />
        <StatCard title={t("statistics.cards.last_update")} value={t("statistics.cards.today")} icon={<Clock />} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-display font-semibold text-base sm:text-lg mb-6">{t("statistics.distribution")}</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipProps} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-display font-semibold text-base sm:text-lg mb-6">{t("statistics.activity_chart")}</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip {...chartTooltipProps} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-display font-semibold text-base sm:text-lg mb-4">{t("statistics.top_languages")}</h3>
          <div className="space-y-4">
            {topLanguages.map((l, i) => (
              <div key={l.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-medium">{l.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{t("statistics.snippets_count", { count: l.value })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-display font-semibold text-base sm:text-lg mb-4">{t("statistics.recent_activity")}</h3>
          <div className="space-y-3">
            {recentActivity.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold uppercase shrink-0">
                    {s.language.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{s.language}</p>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums ml-2 shrink-0">{s.dateStr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: any, icon: any, color: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-xl ${color} text-white flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
          {icon}
        </div>
        <span className="text-2xl font-display font-bold tabular-nums">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-4 font-medium">{title}</p>
    </div>
  );
}

