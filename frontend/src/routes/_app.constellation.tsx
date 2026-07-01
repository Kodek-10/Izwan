import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { useTheme } from "@/components/theme-provider";
import { Loader2, Sparkles, Copy } from "lucide-react";

export const Route = createFileRoute("/_app/constellation")({
  component: ConstellationView,
});

type GraphNode = { id: number; title: string; language: string };
type GraphLink = { source: number; target: number; score: number; duplicate: boolean };
type GraphData = { nodes: GraphNode[]; links: GraphLink[] };

function getColorForLanguage(lang: string) {
  if (!lang) return "#888888";
  const l = lang.toLowerCase();
  if (["javascript", "js", "jsx"].includes(l)) return "#f1e05a";
  if (["typescript", "ts", "tsx"].includes(l)) return "#3178c6";
  if (["python", "py"].includes(l)) return "#3572A5";
  if (["html"].includes(l)) return "#e34c26";
  if (["css"].includes(l)) return "#563d7c";
  if (["rust", "rs"].includes(l)) return "#dea584";
  if (["go"].includes(l)) return "#00ADD8";
  if (["java"].includes(l)) return "#b07219";
  if (["c", "cpp", "c++"].includes(l)) return "#555555";
  if (["sql"].includes(l)) return "#e38c00";
  if (["bash", "shell", "sh"].includes(l)) return "#89e051";
  return "#888888";
}

function ConstellationView() {
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;
  const { theme } = useTheme();

  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<GraphData>("/snippets/graph?threshold=0.5&max_neighbors=4")
      .then((d) => !cancelled && setGraph(d))
      .catch(() => !cancelled && setGraph({ nodes: [], links: [] }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!graph || graph.nodes.length < 2 || !containerRef.current || !svgRef.current) return;

    let cancelled = false;
    let simulation: any;

    (async () => {
      // Import paresseux de d3 : le bundle n'est tiré qu'à l'ouverture de cette page.
      const d3 = await import("d3");
      if (cancelled || !containerRef.current || !svgRef.current) return;

      const isDark =
        theme === "dark" ||
        (theme === "system" && document.documentElement.classList.contains("dark"));
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      const degree: Record<number, number> = {};
      graph.links.forEach((l) => {
        degree[l.source] = (degree[l.source] || 0) + 1;
        degree[l.target] = (degree[l.target] || 0) + 1;
      });
      const radius = (id: number) => 6 + Math.min(degree[id] || 0, 6) * 2;

      const nodes = graph.nodes.map((n) => ({ ...n }));
      const links = graph.links.map((l) => ({ ...l }));

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", width).attr("height", height);
      const g = svg.append("g");

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));
      svg.call(zoom as any);

      const linkColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)";
      const dupColor = "#ff6b6b";

      simulation = d3
        .forceSimulation(nodes as any)
        .force(
          "link",
          d3
            .forceLink(links as any)
            .id((d: any) => d.id)
            .distance((d: any) => 150 - d.score * 90),
        )
        .force("charge", d3.forceManyBody().strength(-240))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius((d: any) => radius(d.id) + 6));

      const link = g
        .append("g")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", (d: any) => (d.duplicate ? dupColor : linkColor))
        .attr("stroke-width", (d: any) => (d.duplicate ? 2.5 : Math.max(1, d.score * 3)))
        .attr("stroke-dasharray", (d: any) => (d.duplicate ? "4 3" : null));

      const node = g
        .append("g")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .style("cursor", "pointer")
        .call(
          d3
            .drag<any, any>()
            .on("start", dragstart)
            .on("drag", dragged)
            .on("end", dragend) as any,
        )
        .on("click", (_e: any, d: any) =>
          navRef.current({ to: "/snippets/$id", params: { id: String(d.id) } }),
        )
        .on("mouseover", hoverOn)
        .on("mouseout", hoverOff);

      node
        .append("circle")
        .attr("r", (d: any) => radius(d.id))
        .attr("fill", (d: any) => getColorForLanguage(d.language))
        .attr("stroke", isDark ? "#0e1a2e" : "#ffffff")
        .attr("stroke-width", 1.5);

      node
        .append("text")
        .text((d: any) => (d.title.length > 24 ? `${d.title.slice(0, 22)}…` : d.title))
        .attr("x", (d: any) => radius(d.id) + 4)
        .attr("y", 4)
        .attr("font-size", "11px")
        .attr("fill", isDark ? "#e7ebf2" : "#1e1b1c")
        .style("pointer-events", "none");

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      function neighborsOf(id: number) {
        const set = new Set<number>();
        links.forEach((l: any) => {
          const s = l.source.id ?? l.source;
          const t = l.target.id ?? l.target;
          if (s === id) set.add(t);
          if (t === id) set.add(s);
        });
        return set;
      }
      function hoverOn(_e: any, d: any) {
        const nb = neighborsOf(d.id);
        node.style("opacity", (n: any) => (n.id === d.id || nb.has(n.id) ? 1 : 0.15));
        link.style("opacity", (l: any) => {
          const s = l.source.id ?? l.source;
          const t = l.target.id ?? l.target;
          return s === d.id || t === d.id ? 1 : 0.05;
        });
      }
      function hoverOff() {
        node.style("opacity", 1);
        link.style("opacity", 1);
      }
      function dragstart(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragend(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    })();

    return () => {
      cancelled = true;
      if (simulation) simulation.stop();
    };
  }, [graph, theme]);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasGraph = !!graph && graph.nodes.length >= 2;
  const dupCount = graph?.links.filter((l) => l.duplicate).length ?? 0;

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" /> Constellation
          </h1>
          <p className="text-sm text-muted-foreground">
            Vos snippets reliés par proximité sémantique (embeddings). Survolez un nœud pour voir
            ses voisins, cliquez pour l'ouvrir.
          </p>
        </div>
        {dupCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
            <Copy className="h-4 w-4" /> {dupCount} doublon(s) potentiel(s)
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative min-h-[500px] flex-1 overflow-hidden rounded-xl border border-border shadow-sm"
        style={{ backgroundColor: isDark ? "#0b1626" : "#fbf7f7" }}
      >
        {hasGraph ? (
          <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Pas encore de constellation</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Ajoutez au moins deux snippets pour voir apparaître les connexions sémantiques entre
              eux.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
