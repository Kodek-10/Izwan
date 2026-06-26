// Logo Izwan — un « I » formé de nœuds reliés (constellation / cerveau numérique).
// Icône vectorielle aux couleurs de la marque (corail), nette à toutes les tailles.
export function IzwaLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Izwan"
    >
      <defs>
        <linearGradient id="izwan-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8765a" />
          <stop offset="1" stopColor="#c75a45" />
        </linearGradient>
      </defs>

      {/* Liens (le "I" : barre haute, hampe, barre basse + diagonales vers le centre) */}
      <g stroke="url(#izwan-grad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
        <path d="M7 7 H25" />
        <path d="M16 7 V25" />
        <path d="M7 25 H25" />
        <path d="M7 7 L16 16 L25 25" />
        <path d="M25 7 L16 16 L7 25" />
      </g>

      {/* Nœuds */}
      <g fill="url(#izwan-grad)">
        <circle cx="7" cy="7" r="2" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="25" cy="7" r="2" />
        <circle cx="7" cy="25" r="2" />
        <circle cx="16" cy="25" r="2" />
        <circle cx="25" cy="25" r="2" />
        <circle cx="16" cy="16" r="3.2" />
      </g>
    </svg>
  );
}

export function IzwaWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl";
  return (
    <span className={`font-display font-semibold tracking-tight ${cls}`}>
      <span className="text-foreground">Izw</span>
      <span className="gradient-text">an</span>
    </span>
  );
}
