import { createFileRoute, Link } from "@tanstack/react-router";
import { Code2, FolderKanban, Star, Languages, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — Izwan" }] }),
  loader: async () => {
    // On server, we can't access localStorage for the auth token.
    if (typeof window === "undefined") {
      return { snippets: [], stats: [], needsClientFetch: true };
    }

    try {
      const data = await api.get<{ items: any[] }>("/snippets/?limit=100");
      const snippets = data.items.map(s => ({
        ...s,
        tags: s.tags.map((t: any) => t.name),
        date: new Date(s.updated_at).toLocaleDateString('fr-FR'),
      }));
      
      const languages = new Set(snippets.map(s => s.language)).size;
      const tags = new Set(snippets.flatMap(s => s.tags)).size;
      const favorites = snippets.filter(s => s.is_favorite).length;

      return { 
        snippets: snippets.slice(0, 5),
        stats: [
          { label: "Total Snippets", value: snippets.length, icon: Code2, color: "from-violet-500 to-indigo-500" },
          { label: "Langages", value: languages, icon: Languages, color: "from-blue-500 to-cyan-500" },
          { label: "Tags uniques", value: tags, icon: FolderKanban, color: "from-cyan-500 to-teal-500" },
          { label: "Favoris", value: favorites, icon: Star, color: "from-amber-500 to-pink-500" },
        ],
        needsClientFetch: false
      };
    } catch (e) {
      return { snippets: [], stats: [], needsClientFetch: false };
    }
  },
  component: Dashboard,
});

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const container = {
// ... (rest of animation configs)
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
    // If the loader ran on server, we need to re-fetch on client where token is available
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const res = await api.get<{ items: any[] }>("/snippets/?limit=100");
          const allSnippets = res.items.map(s => ({
            ...s,
            tags: s.tags.map((t: any) => t.name),
            date: new Date(s.updated_at).toLocaleDateString('fr-FR'),
          }));
          
          setSnippets(allSnippets.slice(0, 5));
          
          const languages = new Set(allSnippets.map(s => s.language)).size;
          const tags = new Set(allSnippets.flatMap(s => s.tags)).size;
          const favorites = allSnippets.filter(s => s.is_favorite).length;

          setStats([
            { label: "Total Snippets", value: allSnippets.length, icon: Code2, color: "from-violet-500 to-indigo-500" },
            { label: "Langages", value: languages, icon: Languages, color: "from-blue-500 to-cyan-500" },
            { label: "Tags uniques", value: tags, icon: FolderKanban, color: "from-cyan-500 to-teal-500" },
            { label: "Favoris", value: favorites, icon: Star, color: "from-amber-500 to-pink-500" },
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

  if (isClientLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (!data || (stats.length === 0 && !isClientLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl">
        <p className="text-muted-foreground mb-4">Erreur de connexion au backend ou aucun contenu.</p>
        <Link to="/auth"><Button>Se connecter</Button></Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div variants={item} key={s.label} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl sm:text-3xl font-display font-bold mt-2">{s.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <h2 className="font-display font-semibold text-base sm:text-lg">Snippets récents</h2>
          <Link to="/snippets" className="text-sm text-primary hover:underline flex items-center gap-1">
            Voir tous <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {snippets.slice(0, 5).map((s, idx) => (
            <Link
              key={s.id}
              to="/snippets/$id"
              params={{ id: s.id.toString() }}
              className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg gradient-brand flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate text-sm sm:text-base">{s.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate uppercase">
                    {s.language}
                  </p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 ml-3 tabular-nums">{s.date}</span>
            </Link>
          ))}
          {snippets.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Aucun snippet récent.</div>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-end"
      >
        <Link to="/snippets/new">
          <Button className="gradient-brand text-white border-0 hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> Ajouter un snippet
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
