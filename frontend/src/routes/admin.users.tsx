import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Trash2, ShieldCheck, ShieldOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type AdminUser = { id: number; username: string; role: string; created_at: string | null };

function initials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : "??";
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get<AdminUser[]>("/admin/users"), api.get<AdminUser>("/auth/me")])
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

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (roleFilter === "all" || u.role === roleFilter) &&
          (!search || u.username.toLowerCase().includes(search.toLowerCase())),
      ),
    [users, search, roleFilter],
  );

  const changeRole = async (u: AdminUser, role: string) => {
    setBusyId(u.id);
    try {
      const updated = await api.patch<AdminUser>(`/admin/users/${u.id}`, { role });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...updated } : x)));
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Gestion des utilisateurs</h1>
        <p className="text-sm text-muted-foreground">Gérez les comptes, rôles et accès de la plateforme.</p>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur…"
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isSelf = me?.id === u.id;
                const isAdmin = u.role === "ADMIN";
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-brand text-xs font-semibold text-white">
                          {initials(u.username)}
                        </div>
                        <span className="font-medium">
                          {u.username}
                          {isSelf && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isAdmin ? "default" : "secondary"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{fmtDate(u.created_at)}</TableCell>
                    <TableCell className="space-x-2 whitespace-nowrap text-right">
                      {isAdmin ? (
                        <Button variant="outline" size="sm" disabled={busyId === u.id} onClick={() => changeRole(u, "USER")}>
                          <ShieldOff className="mr-1 h-4 w-4" /> Rétrograder
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled={busyId === u.id} onClick={() => changeRole(u, "ADMIN")}>
                          <ShieldCheck className="mr-1 h-4 w-4" /> Promouvoir
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
                              Cette action supprime le compte et tout son contenu (snippets, collections). Irréversible.
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
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun utilisateur.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {!loading && (
          <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {filtered.length} utilisateur(s)
          </div>
        )}
      </div>
    </div>
  );
}
