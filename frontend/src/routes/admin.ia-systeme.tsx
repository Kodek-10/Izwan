import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { Loader2, Cpu, Search, Database, Circle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export const Route = createFileRoute("/admin/ia-systeme")({
  component: AdminIaSysteme,
});

type Privacy = {
  air_gapped: boolean;
  forced: boolean;
  generation_provider: string;
  embedding_provider: string;
};
type AiUsage = { total: number; by_feature: Record<string, number> };

const FEATURE_LABELS: Record<string, string> = {
  enrich: "Enrichissement",
  explain: "Explication",
  translate: "Traduction",
  chat: "Chat",
  adapt: "Adaptation",
};
const BAR_COLORS = ["#e8765a", "#c75a45", "#9e412f", "#55dcbc", "#b6c7eb"];

function AdminIaSysteme() {
  const [privacy, setPrivacy] = useState<Privacy | null>(null);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get<Privacy>("/ai/privacy"), api.get<AiUsage>("/admin/ai-usage?days=30")])
      .then(([p, u]) => {
        if (cancelled) return;
        setPrivacy(p);
        setUsage(u);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAirGapped = async (checked: boolean) => {
    setSaving(true);
    try {
      const p = await api.put<Privacy>("/ai/privacy", { air_gapped: checked });
      setPrivacy(p);
      toast.success(checked ? "Mode air-gapped activé" : "Mode air-gapped désactivé");
    } catch (e: any) {
      toast.error(e.message || "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const usageData = useMemo(
    () => Object.entries(usage?.by_feature ?? {}).map(([k, v]) => ({ name: FEATURE_LABELS[k] ?? k, value: v })),
    [usage],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const localGen = privacy?.air_gapped || privacy?.generation_provider === "ollama";

  const providers = [
    {
      icon: Cpu,
      name: "Génération",
      status: localGen ? "Local (Ollama · gemma2:2b)" : "Cloud (Groq) — sinon Ollama local",
      ok: true,
    },
    { icon: Search, name: "Embeddings", status: `${privacy?.embedding_provider ?? "fastembed"} (local)`, ok: true },
    { icon: Database, name: "Base de données", status: "Opérationnelle", ok: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">IA &amp; Système</h1>
        <p className="text-sm text-muted-foreground">Supervision de la couche IA et de l'état technique.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fournisseurs */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display font-semibold">Fournisseurs</h2>
          <div className="space-y-3">
            {providers.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.status}</p>
                    </div>
                  </div>
                  <Circle className={`h-2.5 w-2.5 ${p.ok ? "fill-emerald-500 text-emerald-500" : "fill-amber-500 text-amber-500"}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Confidentialité */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display font-semibold">Confidentialité</h2>
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Mode air-gapped</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Bascule toute la génération en local — aucune sortie réseau.
              </p>
              {privacy?.forced && (
                <p className="mt-1 text-xs text-amber-500">Forcé par la configuration serveur.</p>
              )}
            </div>
            <Switch
              checked={privacy?.air_gapped ?? false}
              disabled={!privacy || privacy.forced || saving}
              onCheckedChange={toggleAirGapped}
            />
          </div>
        </div>
      </div>

      {/* Utilisation IA */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-semibold">Utilisation de l'IA (30 jours)</h2>
          <span className="font-mono text-sm text-muted-foreground">{usage?.total ?? 0} appels</span>
        </div>
        {usageData.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Aucun appel IA sur la période.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {usageData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
