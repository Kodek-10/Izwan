import type { CSSProperties } from "react";

// Props partagées des tooltips Recharts, alignées sur les variables du thème.
// Corrige le fond blanc illisible en mode sombre (aucune couleur en dur).
const contentStyle: CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
  boxShadow: "var(--shadow-card)",
  padding: "8px 12px",
};

export const chartTooltipProps = {
  contentStyle,
  labelStyle: { color: "var(--foreground)", fontWeight: 600, marginBottom: 2 } as CSSProperties,
  itemStyle: { color: "var(--muted-foreground)" } as CSSProperties,
  cursor: { fill: "var(--accent)", opacity: 0.4 },
};
