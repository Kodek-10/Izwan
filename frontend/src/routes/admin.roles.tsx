import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Loader2, Check, Minus, ShieldCheck, User } from "lucide-react";

export const Route = createFileRoute("/admin/roles")({
  component: AdminRoles,
});

type Capability = { key: string; label: string; roles: Record<string, boolean> };
type RolesMatrix = { roles: string[]; capabilities: Capability[] };

const ROLE_INFO: Record<string, { icon: typeof User; desc: string }> = {
  USER: {
    icon: User,
    desc: "Utilisateur standard : gère uniquement son propre contenu (snippets, collections).",
  },
  ADMIN: {
    icon: ShieldCheck,
    desc: "Administrateur : gère la plateforme — comptes, rôles, supervision IA & système, audit.",
  },
};

function AdminRoles() {
  const [data, setData] = useState<RolesMatrix | null>(null);
  const [selected, setSelected] = useState<string>("ADMIN");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<RolesMatrix>("/admin/roles")
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setSelected(d.roles[d.roles.length - 1] ?? "ADMIN");
      })
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
  if (!data) return <div className="text-muted-foreground">Données indisponibles.</div>;

  const grantedCount = (role: string) => data.capabilities.filter((c) => c.roles[role]).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Rôles &amp; permissions</h1>
        <p className="text-sm text-muted-foreground">
          Les accès par rôle, définis par l'application (lecture seule). Les rôles s'attribuent depuis l'écran Utilisateurs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rôles existants */}
        <div className="space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Rôles existants
          </h2>
          {data.roles.map((role) => {
            const Icon = ROLE_INFO[role]?.icon ?? ShieldCheck;
            const active = selected === role;
            return (
              <button
                key={role}
                onClick={() => setSelected(role)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  active ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-display font-semibold">{role}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ROLE_INFO[role]?.desc}</p>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">{grantedCount(role)} permission(s)</p>
              </button>
            );
          })}
        </div>

        {/* Détail du rôle sélectionné */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-display font-semibold">Détail : {selected}</h2>
          <ul className="mt-4 space-y-2">
            {data.capabilities.map((c) => {
              const granted = c.roles[selected];
              return (
                <li
                  key={c.key}
                  className={`flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm ${
                    granted ? "" : "opacity-50"
                  }`}
                >
                  {granted ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  {c.label}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Les permissions sont définies par l'application — non modifiables ici.
          </p>
        </div>
      </div>
    </div>
  );
}
