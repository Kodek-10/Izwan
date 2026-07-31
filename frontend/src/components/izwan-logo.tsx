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
        <linearGradient id="izwan-grad" x1="5" y1="5" x2="27" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8765a" />
          <stop offset="1" stopColor="#c75a45" />
        </linearGradient>
      </defs>

      {/* Accolades { } encadrant une petite constellation de nœuds (snippets reliés) */}
      <g stroke="url(#izwan-grad)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 6.5 C8.3 6.5 9.4 13.4 6 16 C9.4 18.6 8.3 25.5 11 25.5" />
        <path d="M21 6.5 C23.7 6.5 22.6 13.4 26 16 C22.6 18.6 23.7 25.5 21 25.5" />
        <g opacity="0.55">
          <path d="M16 16 L12.6 10.9" />
          <path d="M16 16 L20 11.4" />
          <path d="M16 16 L14.1 21.8" />
        </g>
      </g>

      {/* Nœuds */}
      <g fill="url(#izwan-grad)">
        <circle cx="16" cy="16" r="2.5" />
        <circle cx="12.6" cy="10.9" r="1.5" />
        <circle cx="20" cy="11.4" r="1.5" />
        <circle cx="14.1" cy="21.8" r="1.5" />
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
