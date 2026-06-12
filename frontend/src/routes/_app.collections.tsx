import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, ChevronRight, Server, Layout, Database, Shield, Wrench, Folder, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/collections")({
  head: () => ({ meta: [{ title: "Collections — Izwan" }] }),
  loader: async () => {
    // On server, we can't access localStorage for the auth token.
    if (typeof window === "undefined") {
      return { collections: [], needsClientFetch: true };
    }

    try {
      const data = await api.get<any[]>("/collections/");
      return { collections: data, needsClientFetch: false };
    } catch (e) {
      return { collections: [], needsClientFetch: false };
    }
  },
  component: CollectionsPage,
});

const container = {
// ... (rest of animation configs)
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

function CollectionsPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const initialCollections = data?.collections || [];
  const [collections, setCollections] = useState(initialCollections);
  const [isClientLoading, setIsClientLoading] = useState(false);

  useEffect(() => {
    if (data?.collections && !data.needsClientFetch) {
      setCollections(data.collections);
    }
  }, [data?.collections, data?.needsClientFetch]);

  useEffect(() => {
    // If the loader ran on server, we need to re-fetch on client where token is available
    if (data?.needsClientFetch) {
      const fetchOnClient = async () => {
        setIsClientLoading(true);
        try {
          const data = await api.get<any[]>("/collections/");
          setCollections(data);
        } catch (e) {
          console.error("Failed to fetch collections on client", e);
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
        <p className="text-sm text-muted-foreground">Chargement des collections...</p>
      </div>
    );
  }

  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    setIsCreating(true);
    try {
      const col = await api.post<any>("/collections/", {
        name: newColName.trim(),
        description: newColDesc.trim(),
        icon: "Folder"
      });
      setCollections([...collections, col]);
      router.invalidate();
      toast.success(`Collection "${col.name}" créée`);
      setNewColName("");
      setNewColDesc("");
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    try {
      await api.delete(`/collections/${id}`);
      setCollections(collections.filter(c => c.id !== id));
      router.invalidate();
      toast.success("Collection supprimée");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la suppression");
    }
  };

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("server") || n.includes("backend")) return Server;
    if (n.includes("ui") || n.includes("frontend") || n.includes("layout")) return Layout;
    if (n.includes("db") || n.includes("data") || n.includes("sql")) return Database;
    if (n.includes("security") || n.includes("auth")) return Shield;
    if (n.includes("tool") || n.includes("script")) return Wrench;
    return Folder;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-display font-semibold text-xl sm:text-2xl">Collections</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto gradient-brand text-white border-0 hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle collection
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle>Créer une collection</DialogTitle>
              <DialogDescription>
                Organisez vos snippets en créant une nouvelle collection thématique.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la collection</Label>
                <Input
                  id="name"
                  placeholder="Ex: Backend Projets, Scripts DevOps..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optionnel)</Label>
                <Input
                  id="desc"
                  placeholder="Une courte description..."
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>Annuler</Button>
              <Button className="w-full sm:w-auto gradient-brand text-white border-0" onClick={handleCreateCollection} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Créer la collection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {collections.map((c) => {
          const Icon = getIcon(c.name);
          return (
            <motion.div variants={item} key={c.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
              <Link
                to="/snippets"
                search={{ collection: c.id }}
                className="w-full flex flex-col p-5 text-left h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <p className="font-semibold text-lg group-hover:text-primary transition-colors">{c.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {c.description || "Ouvrir la collection pour voir les snippets."}
                  </p>
                </div>
              </Link>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCollection(c.id); }}
                className="absolute right-3 bottom-3 p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                suppressHydrationWarning
                title="Supprimer la collection"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
        {collections.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
            Aucune collection trouvée.
          </div>
        )}
      </motion.div>
    </div>
  );
}
