import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type AdminUser = { id: number; username: string; role: string };

function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<AdminUser[]>("/admin/users"),
      api.get<AdminUser>("/auth/me"),
    ])
      .then(([list, current]) => {
        if (cancelled) return;
        setUsers(list);
        setMe(current);
      })
      .catch(() => !cancelled && toast.error("Chargement des utilisateurs impossible"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const changeRole = async (u: AdminUser, role: string) => {
    setBusyId(u.id);
    try {
      const updated = await api.patch<AdminUser>(`/admin/users/${u.id}`, { role });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      toast.success(`${u.username} est désormais ${role}`);
    } catch (e: any) {
      toast.error(e.message || "Échec de la mise à jour du rôle");
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (u: AdminUser) => {
    setBusyId(u.id);
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success(`${u.username} supprimé`);
    } catch (e: any) {
      toast.error(e.message || "Suppression impossible");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">Utilisateurs</h1>
        <p className="text-muted-foreground">Gérez les comptes et leurs rôles.</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = me?.id === u.id;
              const isAdmin = u.role === "ADMIN";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.username}
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isAdmin ? "default" : "secondary"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    {isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === u.id}
                        onClick={() => changeRole(u, "USER")}
                      >
                        <ShieldOff className="h-4 w-4 mr-1" /> Rétrograder
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === u.id}
                        onClick={() => changeRole(u, "ADMIN")}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1" /> Promouvoir
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf || busyId === u.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer {u.username} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action supprime le compte et tout son contenu (snippets,
                            collections). Elle est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteUser(u)}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
