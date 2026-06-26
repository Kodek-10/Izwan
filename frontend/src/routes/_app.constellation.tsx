import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { useTranslation } from "react-i18next";
import { Loader2, Code, Database, Zap, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import * as d3 from "d3";

export const Route = createFileRoute("/_app/constellation")({
  component: ConstellationView,
});

function ConstellationView() {
  const { t } = useTranslation();
  const [graphData, setGraphData] = useState<{
    nodes: any[];
    links: any[];
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.get<any>("/snippets/");
        const snippets = data.items || data;

        const nodes: any[] = [];
        const links: any[] = [];
        const tagMap = new Map<string, any>();

        snippets.forEach((s: any) => {
          nodes.push({
            id: `snippet_${s.id}`,
            name: s.title,
            val: Math.max(5, s.code.length / 50),
            color: getColorForLanguage(s.language),
            type: "snippet",
            rawId: s.id,
            language: s.language,
          });

          const tags =
            s.tags?.map((t: any) =>
              typeof t === "string" ? t : t.name
            ) || [];
          tags.forEach((tag: string) => {
            const tagId = `tag_${tag}`;
            if (!tagMap.has(tagId)) {
              const newTagNode = {
                id: tagId,
                name: `#${tag}`,
                val: 3,
                color: "#a855f7",
                type: "tag",
              };
              tagMap.set(tagId, newTagNode);
              nodes.push(newTagNode);
            }

            links.push({
              source: tagId,
              target: `snippet_${s.id}`,
              value: 1,
              name: "",
            });
          });
        });

        setGraphData({ nodes, links });
      } catch (e) {
        console.error("Failed to load constellation data", e);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!graphData || !containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        document.documentElement.classList.contains("dark"));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("width", width).attr("height", height);

    const defs = svg.append("defs");
    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)");

    defs
      .append("marker")
      .attr("id", "arrow-highlight")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", isDark ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)");

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        const scale = event.transform.k;
        g.selectAll(".node-label")
          .attr("font-size", (d: any) => {
            const baseSize = d.type === "tag" ? 10 : 12;
            const effectiveScale = Math.max(0.3, Math.min(scale, 3));
            return `${baseSize / effectiveScale}px`;
          })
          .attr("dy", (d: any) => {
            const baseDy =
              d.type === "tag"
                ? d.val * 1.2 + 14
                : d.val * 1.5 + 18;
            const effectiveScale = Math.max(0.3, Math.min(scale, 3));
            return baseDy / effectiveScale;
          });

        g.selectAll(".text-bg").each(function () {
          const rectNode = d3.select(this);
          const gNode = d3.select((this as any).parentNode);
          const textNode = gNode.select("text").node() as SVGTextElement;
          if (textNode) {
            const bbox = textNode.getBBox();
            const effectiveScale = Math.max(0.3, Math.min(scale, 3));
            rectNode
              .attr("x", bbox.x - 4 / effectiveScale)
              .attr("y", bbox.y - 2 / effectiveScale)
              .attr("width", bbox.width + 8 / effectiveScale)
              .attr("height", bbox.height + 4 / effectiveScale)
              .attr("rx", 4 / effectiveScale)
              .attr("ry", 4 / effectiveScale);
          }
        });
      });
    svg.call(zoom as any);

    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d: any) => d.id)
          .distance(20)
      )
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      // .force("radial", d3.forceRadial(50, width / 2, height / 2).strength(0.1))
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d: any) => d.val * 1.5 + 8)
          .iterations(3)
      );

    const link = g
      .append("g")
      .selectAll("path")
      .data(graphData.links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr(
        "stroke",
        isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"
      )
      .attr("stroke-width", (d: any) => Math.max(1, Math.sqrt(d.value)))
      .attr("fill", "none")
      .attr("marker-end", "url(#arrow)");

    const nodeGroup = g
      .append("g")
      .selectAll(".node")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("click", (event, d: any) => {
        if (d.type === "snippet") {
          setSelectedNode(d);
        }
      })
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    nodeGroup
      .append("circle")
      .attr("r", (d: any) => (d.type === "tag" ? d.val * 1.2 : d.val * 1.5))
      .attr("fill", (d: any) => d.color)
      .style("filter", (d: any) => (d.type === "tag" ? "" : "url(#glow)"))
      .style("cursor", (d: any) =>
        d.type === "snippet" ? "pointer" : "default"
      );

    nodeGroup
      .append("rect")
      .attr("class", "text-bg")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.6)")
      .style("pointer-events", "none");

    nodeGroup
      .append("text")
      .attr("class", "node-label")
      .attr("dy", (d: any) =>
        d.type === "tag" ? d.val * 1.2 + 14 : d.val * 1.5 + 18
      )
      .attr("text-anchor", "middle")
      .text((d: any) => d.name)
      .attr("fill", (d: any) =>
        isDark
          ? d.type === "tag"
            ? "#e9d5ff"
            : "#ffffff"
          : d.type === "tag"
          ? "#7e22ce"
          : "#000000"
      )
      .attr("font-size", (d: any) => (d.type === "tag" ? "10px" : "12px"))
      .attr("font-weight", (d: any) => (d.type === "tag" ? "600" : "500"))
      .attr("font-family", "system-ui, sans-serif")
      .style("pointer-events", "none");

    nodeGroup.each(function () {
      const gNode = d3.select(this);
      const textNode = gNode.select("text").node() as SVGTextElement;
      const rectNode = gNode.select("rect");
      const bbox = textNode.getBBox();
      rectNode
        .attr("x", bbox.x - 4)
        .attr("y", bbox.y - 2)
        .attr("width", bbox.width + 8)
        .attr("height", bbox.height + 4);
    });

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function handleMouseOver(event: any, d: any) {
      const currentNodeGroup = d3.select(event.currentTarget);
      currentNodeGroup
        .select("circle")
        .attr("r", (d: any) =>
          d.type === "tag" ? d.val * 1.8 : d.val * 2.2
        )
        .style("stroke", "#ffffff")
        .style("stroke-width", "2px");

      link
        .attr("stroke", (l: any) => {
          if (l.source.id === d.id)
            return isDark ? "#4ade80" : "#16a34a";
          if (l.target.id === d.id)
            return isDark ? "#60a5fa" : "#2563eb";
          return isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.05)";
        })
        .attr("stroke-width", (l: any) => {
          if (l.source.id === d.id || l.target.id === d.id)
            return Math.max(2, Math.sqrt(l.value) * 1.5);
          return Math.max(1, Math.sqrt(l.value));
        })
        .attr("marker-end", (l: any) => {
          if (l.source.id === d.id || l.target.id === d.id)
            return "url(#arrow-highlight)";
          return "url(#arrow)";
        });

      nodeGroup.style("opacity", (n: any) => {
        const isConnected = graphData.links.some(
          (l: any) =>
            (l.source.id === d.id && l.target.id === n.id) ||
            (l.target.id === d.id && l.source.id === n.id)
        );
        return n.id === d.id || isConnected ? 1 : 0.2;
      });
    }

    function handleMouseOut(event: any, d: any) {
      d3.select(event.currentTarget)
        .select("circle")
        .attr("r", (d: any) =>
          d.type === "tag" ? d.val * 1.2 : d.val * 1.5
        )
        .style("stroke", "none");

      link
        .attr("stroke", isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)")
        .attr("stroke-width", (d: any) => Math.max(1, Math.sqrt(d.value)))
        .attr("marker-end", "url(#arrow)");

      nodeGroup.style("opacity", 1);
    }

    return () => {
      simulation.stop();
    };
  }, [graphData, theme]);

  function getColorForLanguage(lang: string) {
    if (!lang) return "#888888";
    const l = lang.toLowerCase();
    if (["javascript", "js", "typescript", "ts", "jsx", "tsx"].includes(l))
      return "#f1e05a";
    if (["python", "py"].includes(l)) return "#3572A5";
    if (["html"].includes(l)) return "#e34c26";
    if (["css"].includes(l)) return "#563d7c";
    if (["rust", "rs"].includes(l)) return "#dea584";
    if (["go"].includes(l)) return "#00ADD8";
    return "#888888";
  }

  if (!graphData) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dummy connected nodes data based on selection
  const connectedNodes = selectedNode
    ? graphData.links
        .filter(
          (l: any) =>
            l.source.id === selectedNode.id ||
            l.target.id === selectedNode.id
        )
        .map((l: any) => {
          const other =
            l.source.id === selectedNode.id ? l.target : l.source;
          return {
            name: other.name,
            type: other.type,
            relation:
              l.source.id === selectedNode.id
                ? "Dépendance"
                : "Référence",
          };
        })
    : [];

  return (
    <div className="relative w-full h-[calc(100vh-80px)] -mx-4 sm:-mx-6 overflow-hidden rounded-xl">
      {/* SVG Graph */}
      <div ref={containerRef} className="w-full h-full">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Sidebar */}
      <aside className="absolute left-4 md:left-6 top-4 bottom-20 w-80 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 flex flex-col gap-6 shadow-xl z-40 transition-transform duration-300 overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-1 bg-secondary/10 text-secondary font-mono text-xs rounded uppercase">
              {selectedNode?.type === "snippet"
                ? "Snippet"
                : "Tag"}
            </span>
            {selectedNode && (
              <Link
                to="/snippets/$id"
                params={{ id: selectedNode.rawId?.toString() || "0" }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <h2 className="font-semibold text-foreground break-words leading-tight">
            {selectedNode?.name || "Constellation"}
          </h2>
        </div>

        {/* Meta Info */}
        {selectedNode?.language && (
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-background border border-border text-muted-foreground font-mono text-xs rounded-full flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: getColorForLanguage(
                    selectedNode.language
                  ),
                }}
              />{" "}
              {selectedNode.language}
            </span>
          </div>
        )}

        {/* Description placeholder */}
        <p className="text-sm text-muted-foreground">
          {selectedNode
            ? `Cliquez pour ouvrir le snippet "${selectedNode.name}".`
            : "Cliquez sur un nœud pour voir ses détails."}
        </p>

        {/* Connected nodes list */}
        {connectedNodes.length > 0 && (
          <div className="flex-1 overflow-y-auto mt-2">
            <h3 className="font-mono text-xs text-primary mb-3 uppercase tracking-wider opacity-80">
              Nœuds Connectés ({connectedNodes.length})
            </h3>
            <ul className="flex flex-col gap-2">
              {connectedNodes.map((node: any, i: number) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg cursor-pointer transition-colors border border-transparent hover:border-border"
                >
                  <div className="w-8 h-8 rounded bg-background flex items-center justify-center shrink-0">
                    {node.type === "tag" ? (
                      <Zap className="h-4 w-4 text-primary" />
                    ) : (
                      <Code className="h-4 w-4 text-tertiary" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-foreground truncate">
                      {node.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {node.relation}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
