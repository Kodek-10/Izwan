import logoSrc from "@/assets/izwan-logo.png";

export function IzwaLogo({ className = "h-8 w-8" }: { className?: string }) {
  return <img src={logoSrc} alt="Izwan" className={className} loading="lazy" />;
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
