import { createFileRoute, redirect } from "@tanstack/react-router";

// Statistiques fusionnées dans le Tableau de bord — on redirige pour préserver les anciens liens.
export const Route = createFileRoute("/_app/statistics")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
