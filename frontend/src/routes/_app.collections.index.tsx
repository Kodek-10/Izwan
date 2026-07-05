import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, MoreVertical, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCollectionDialog } from "@/components/create-collection-dialog";
import { getCollectionIcon } from "@/lib/collection-icons";

export const Route = createFileRoute("/_app/collections/")({
  head: () => ({
    meta: [{ title: "Collections — Izwan" }],
  }),
  loader: async () => {
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
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function CollectionsPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>(data?.collections || []);
  const [isLoading, setIsLoading] = useState(data?.needsClientFetch ?? true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!data) return;
    if (data.needsClientFetch) {
      let cancelled = false;
      const fetchCollections = async () => {
        setIsLoading(true);
        try {
          const res = await api.get<any[]>("/collections/");
          if (cancelled) return;
          setCollections(res);
        } catch {
          /* ignore */
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      fetchCollections();
      return () => {
        cancelled = true;
      };
    } else {
      setCollections(data.collections || []);
      setIsLoading(false);
    }
  }, [data]);

  const deleteCollection = async (id: number) => {
    try {
      await api.delete(`/collections/${id}`);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      router.invalidate();
      toast.success("Collection supprimée");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Collections
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Gérez vos dossiers et organisez vos snippets de code.
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-medium text-sm px-6 py-3 rounded-md hover:bg-primary/90 transition-colors w-fit shadow-md"
        >
          <Plus className="h-4 w-4" />
          Créer une collection
        </button>
      </div>

      {/* Grid */}
      {collections.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
          Aucune collection pour le moment. Créez votre première collection !
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {collections.map((collection) => {
            const Icon = getCollectionIcon(collection.icon);
            return (
              <motion.div
                key={collection.id}
                variants={item}
                className="bg-card rounded-xl p-6 flex flex-col gap-6 hover:bg-muted/50 transition-colors cursor-pointer group shadow-sm border border-border relative overflow-hidden"
              >
                <Link
                  to="/collections/$id"
                  params={{ id: collection.id.toString() }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {collection.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {collection.snippet_count || 0} snippets
                      </span>
                      {collection.updated_at && (
                        <span className="text-xs text-muted-foreground">
                          Mis à jour: {" "}
                          {new Date(collection.updated_at).toLocaleDateString(
                            "fr-FR",
                            { day: "2-digit", month: "short" }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Menu flottant au-dessus du lien pour ne pas bloquer la navigation */}
                <div className="absolute top-5 right-5 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4}>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteCollection(collection.id)}
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <CreateCollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => router.invalidate()}
      />
    </div>
  );
}
