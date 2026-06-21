import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_app/admin")({
  component: AdminLayout,
});

// Garde de rôle : seuls les comptes ADMIN accèdent à /admin/*.
// Le backend protège déjà ces routes (403) ; ce garde évite juste d'afficher
// l'interface admin à un simple utilisateur.
function AdminLayout() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ role?: string }>("/auth/me")
      .then((me) => {
        if (cancelled) return;
        if (me.role === "ADMIN") {
          setAllowed(true);
        } else {
          setAllowed(false);
          navigate({ to: "/dashboard" });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAllowed(false);
        navigate({ to: "/auth" });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (allowed === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!allowed) return null;

  return <Outlet />;
}
