/**
 * KnowledgeGraph - Interactive visualization of the knowledge network
 *
 * Shows:
 * - Nodes = Components, Systems, Interfaces, Procedures
 * - Edges = Couplings between them
 * - Colors = Which team/university contributed
 * - Highlights = Your team's contributions in the network
 *
 * Uses D3.js force-directed graph for interactive exploration.
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  Building2,
  Circle,
  ArrowRight,
  Info,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

export interface GraphNode {
  id: string;
  label: string;
  type: "component" | "system" | "interface" | "procedure" | "team";
  domain: "ops" | "software" | "hardware" | "process";
  organization_id: string;
  organization_name: string;
  confidence: number;
  created_at: string;
  // D3 will add x, y, vx, vy
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  strength: number; // 0-1, coupling strength
  organization_id: string;
  organization_name: string;
  via_interface?: string;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightOrgId?: string; // Highlight this org's contributions
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  width?: number;
  height?: number;
}

// =============================================================================
// COLOR SCHEMES
// =============================================================================

const NODE_COLORS: Record<string, string> = {
  component: "#3b82f6", // blue
  system: "#8b5cf6",    // purple
  interface: "#10b981", // green
  procedure: "#f59e0b", // amber
  team: "#6b7280",      // gray
};

const DOMAIN_COLORS: Record<string, string> = {
  ops: "#22c55e",       // green
  software: "#3b82f6",  // blue
  hardware: "#f59e0b",  // amber
  process: "#a855f7",   // purple
};

// Generate distinct colors for organizations
const ORG_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#ef4444", // red
  "#84cc16", // lime
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function KnowledgeGraph({
  nodes,
  edges,
  highlightOrgId,
  onNodeClick,
  onEdgeClick,
  width = 800,
  height = 600,
}: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [colorBy, setColorBy] = useState<"type" | "domain" | "organization">("organization");
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Create org color map
  const orgColorMap = useMemo(() => {
    const orgs = [...new Set(nodes.map(n => n.organization_id))];
    const map: Record<string, string> = {};
    orgs.forEach((org, i) => {
      map[org] = ORG_COLORS[i % ORG_COLORS.length];
    });
    return map;
  }, [nodes]);

  // Stats
  const stats = useMemo(() => {
    const ourNodes = highlightOrgId ? nodes.filter(n => n.organization_id === highlightOrgId).length : 0;
    const ourEdges = highlightOrgId ? edges.filter(e => e.organization_id === highlightOrgId).length : 0;
    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      ourNodes,
      ourEdges,
    };
  }, [nodes, edges, highlightOrgId]);

  const getNodeColor = (node: GraphNode) => {
    switch (colorBy) {
      case "type":
        return NODE_COLORS[node.type] || "#6b7280";
      case "domain":
        return DOMAIN_COLORS[node.domain] || "#6b7280";
      case "organization":
        return orgColorMap[node.organization_id] || "#6b7280";
    }
  };

  const getNodeOpacity = (node: GraphNode) => {
    if (!highlightOrgId) return 1;
    return node.organization_id === highlightOrgId ? 1 : 0.3;
  };

  const getEdgeOpacity = (edge: GraphEdge) => {
    if (!highlightOrgId) return 0.6;
    return edge.organization_id === highlightOrgId ? 0.8 : 0.15;
  };

  // Simple force layout simulation (in real app, use D3 force)
  const layoutNodes = useMemo(() => {
    // Basic circular layout for demo - replace with D3 force layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
      };
    });
  }, [nodes, width, height]);

  // Create node lookup for edge rendering
  const nodeMap = useMemo(() => {
    const map: Record<string, typeof layoutNodes[0]> = {};
    layoutNodes.forEach(n => { map[n.id] = n; });
    return map;
  }, [layoutNodes]);

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Knowledge Graph
            <Badge variant="outline" className="text-xs">
              {stats.totalNodes} nodes · {stats.totalEdges} edges
            </Badge>
          </h2>
          {highlightOrgId && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-blue-600">{stats.ourNodes} nodes</span> and{" "}
              <span className="font-medium text-blue-600">{stats.ourEdges} edges</span> from your team
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Color by */}
          <select
            value={colorBy}
            onChange={(e) => setColorBy(e.target.value as typeof colorBy)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
          >
            <option value="organization">Color by Team</option>
            <option value="type">Color by Type</option>
            <option value="domain">Color by Domain</option>
          </select>

          {/* Toggle labels */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? "Hide labels" : "Show labels"}
          >
            {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>

          {/* Zoom controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-xs">
        {/* Team/Organization colors */}
        {colorBy === "organization" && (
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium">Teams:</span>
            {Object.entries(orgColorMap).slice(0, 5).map(([orgId, color]) => {
              const org = nodes.find(n => n.organization_id === orgId);
              const isOurs = orgId === highlightOrgId;
              return (
                <div key={orgId} className={`flex items-center gap-1 ${isOurs ? "font-semibold" : ""}`}>
                  <div
                    className={`w-3 h-3 rounded-full ${isOurs ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                    style={{ backgroundColor: color }}
                  />
                  <span className={isOurs ? "text-blue-700" : ""}>{org?.organization_name || orgId}</span>
                  {isOurs && <span className="text-blue-500 text-[10px]">(you)</span>}
                </div>
              );
            })}
          </div>
        )}
        {colorBy === "type" && (
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium">Types:</span>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span>{type}</span>
              </div>
            ))}
          </div>
        )}
        {colorBy === "domain" && (
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium">Domains:</span>
            {Object.entries(DOMAIN_COLORS).map(([domain, color]) => (
              <div key={domain} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span>{domain}</span>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-4 w-px bg-gray-300" />

        {/* Coupling strength legend */}
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-medium">Coupling Strength:</span>
          <div className="flex items-center gap-1">
            <div className="w-6 h-[1px] bg-gray-400" />
            <span>Weak</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-[2px] bg-gray-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-[4px] bg-gray-600" />
            <span>Strong</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-600" />
            <span>Critical (≥80%)</span>
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="cursor-grab active:cursor-grabbing"
        >
          <g transform={`scale(${zoom})`}>
            {/* Edges */}
            <g className="edges">
              {edges.map((edge) => {
                const source = nodeMap[edge.source];
                const target = nodeMap[edge.target];
                if (!source || !target) return null;

                const opacity = getEdgeOpacity(edge);
                const isHighlighted = highlightOrgId && edge.organization_id === highlightOrgId;

                return (
                  <g key={edge.id}>
                    {/* Edge line - thickness represents coupling strength */}
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isHighlighted ? "#3b82f6" : orgColorMap[edge.organization_id] || "#94a3b8"}
                      strokeWidth={Math.max(1, edge.strength * 4)} /* Strength = 0-1, maps to 1-4px */
                      strokeOpacity={opacity}
                      className="cursor-pointer hover:stroke-blue-500"
                      onClick={() => onEdgeClick?.(edge)}
                    />
                    {/* Strength indicator dot at midpoint for high-strength couplings */}
                    {edge.strength >= 0.8 && (
                      <circle
                        cx={(source.x! + target.x!) / 2}
                        cy={(source.y! + target.y!) / 2}
                        r={3}
                        fill={orgColorMap[edge.organization_id] || "#94a3b8"}
                        fillOpacity={opacity}
                      />
                    )}
                    {/* Edge label */}
                    {showLabels && edge.via_interface && (
                      <text
                        x={(source.x! + target.x!) / 2}
                        y={(source.y! + target.y!) / 2}
                        textAnchor="middle"
                        fontSize={8}
                        fill="#6b7280"
                        opacity={opacity}
                      >
                        {edge.via_interface}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {layoutNodes.map((node) => {
                const color = getNodeColor(node);
                const opacity = getNodeOpacity(node);
                const isHighlighted = highlightOrgId && node.organization_id === highlightOrgId;
                const isHovered = hoveredNode?.id === node.id;
                const isSelected = selectedNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => {
                      setSelectedNode(node);
                      onNodeClick?.(node);
                    }}
                  >
                    {/* Highlight ring for our team's nodes */}
                    {isHighlighted && (
                      <circle
                        r={14}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      r={isHovered || isSelected ? 12 : 10}
                      fill={color}
                      fillOpacity={opacity}
                      stroke={isSelected ? "#1d4ed8" : isHovered ? "#60a5fa" : "white"}
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* Node label */}
                    {showLabels && (
                      <text
                        y={20}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#374151"
                        fillOpacity={opacity}
                      >
                        {node.label.length > 15 ? node.label.slice(0, 15) + "..." : node.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Hover tooltip */}
        {hoveredNode && (
          <div
            className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm pointer-events-none"
            style={{
              left: (hoveredNode.x || 0) * zoom + 20,
              top: (hoveredNode.y || 0) * zoom - 20,
            }}
          >
            <p className="font-semibold text-gray-900">{hoveredNode.label}</p>
            <p className="text-gray-500">{hoveredNode.type} · {hoveredNode.domain}</p>
            <p className="text-xs text-gray-400 mt-1">
              <Building2 className="w-3 h-3 inline mr-1" />
              {hoveredNode.organization_name}
            </p>
            <p className="text-xs text-gray-400">
              Confidence: {Math.round(hoveredNode.confidence * 100)}%
            </p>
          </div>
        )}
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">{selectedNode.label}</h3>
              <p className="text-sm text-blue-700">
                {selectedNode.type} · {selectedNode.domain}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Contributed by {selectedNode.organization_name}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              Close
            </Button>
          </div>
          {/* Show connected nodes */}
          <div className="mt-3">
            <p className="text-xs font-medium text-blue-800 mb-2">Connected to:</p>
            <div className="flex flex-wrap gap-2">
              {edges
                .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                .slice(0, 5)
                .map((edge) => {
                  const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                  const other = nodeMap[otherId];
                  return other ? (
                    <Badge key={edge.id} variant="outline" className="text-xs">
                      {edge.source === selectedNode.id ? "→" : "←"} {other.label}
                    </Badge>
                  ) : null;
                })}
            </div>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <Info className="h-3 w-3" />
        <span>
          Click nodes to explore. Dashed rings show your team's contributions.
          Edges represent knowledge couplings.
        </span>
      </div>
    </Card>
  );
}

// =============================================================================
// DEMO DATA
// =============================================================================

export function generateDemoGraphData(ourOrgId: string = "proves-lab"): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const organizations = [
    { id: "proves-lab", name: "PROVES Lab" },
    { id: "uni-a", name: "University A" },
    { id: "uni-b", name: "University B" },
    { id: "research-c", name: "Research Group C" },
  ];

  const nodes: GraphNode[] = [
    // PROVES Lab contributions
    { id: "n1", label: "GPS Receiver", type: "component", domain: "hardware", organization_id: "proves-lab", organization_name: "PROVES Lab", confidence: 0.92, created_at: "" },
    { id: "n2", label: "Flight Computer", type: "system", domain: "software", organization_id: "proves-lab", organization_name: "PROVES Lab", confidence: 0.88, created_at: "" },
    { id: "n3", label: "OrbitFSW", type: "component", domain: "software", organization_id: "proves-lab", organization_name: "PROVES Lab", confidence: 0.95, created_at: "" },
    { id: "n4", label: "I2C Bus", type: "interface", domain: "hardware", organization_id: "proves-lab", organization_name: "PROVES Lab", confidence: 0.87, created_at: "" },

    // University A
    { id: "n5", label: "Power System", type: "system", domain: "hardware", organization_id: "uni-a", organization_name: "University A", confidence: 0.91, created_at: "" },
    { id: "n6", label: "Solar Panel Array", type: "component", domain: "hardware", organization_id: "uni-a", organization_name: "University A", confidence: 0.89, created_at: "" },
    { id: "n7", label: "Battery Manager", type: "component", domain: "hardware", organization_id: "uni-a", organization_name: "University A", confidence: 0.86, created_at: "" },
    { id: "n8", label: "Power Bus", type: "interface", domain: "hardware", organization_id: "uni-a", organization_name: "University A", confidence: 0.90, created_at: "" },

    // University B
    { id: "n9", label: "Thermal Control", type: "system", domain: "ops", organization_id: "uni-b", organization_name: "University B", confidence: 0.84, created_at: "" },
    { id: "n10", label: "Heater Controller", type: "component", domain: "hardware", organization_id: "uni-b", organization_name: "University B", confidence: 0.82, created_at: "" },
    { id: "n11", label: "Temperature Sensors", type: "component", domain: "hardware", organization_id: "uni-b", organization_name: "University B", confidence: 0.88, created_at: "" },

    // Research Group C
    { id: "n12", label: "Ground Station", type: "system", domain: "ops", organization_id: "research-c", organization_name: "Research Group C", confidence: 0.93, created_at: "" },
    { id: "n13", label: "UHF Radio", type: "component", domain: "hardware", organization_id: "research-c", organization_name: "Research Group C", confidence: 0.87, created_at: "" },
    { id: "n14", label: "Pass Planning", type: "procedure", domain: "ops", organization_id: "research-c", organization_name: "Research Group C", confidence: 0.79, created_at: "" },
  ];

  const edges: GraphEdge[] = [
    // PROVES Lab couplings
    { id: "e1", source: "n1", target: "n2", relationship: "provides_data", strength: 0.85, organization_id: "proves-lab", organization_name: "PROVES Lab", via_interface: "UART" },
    { id: "e2", source: "n2", target: "n3", relationship: "runs", strength: 0.95, organization_id: "proves-lab", organization_name: "PROVES Lab" },
    { id: "e3", source: "n3", target: "n4", relationship: "uses", strength: 0.78, organization_id: "proves-lab", organization_name: "PROVES Lab" },

    // University A couplings
    { id: "e4", source: "n5", target: "n6", relationship: "contains", strength: 0.92, organization_id: "uni-a", organization_name: "University A" },
    { id: "e5", source: "n5", target: "n7", relationship: "contains", strength: 0.90, organization_id: "uni-a", organization_name: "University A" },
    { id: "e6", source: "n6", target: "n8", relationship: "outputs_to", strength: 0.88, organization_id: "uni-a", organization_name: "University A" },

    // Cross-team couplings (discovered through shared knowledge)
    { id: "e7", source: "n2", target: "n5", relationship: "monitors", strength: 0.75, organization_id: "proves-lab", organization_name: "PROVES Lab", via_interface: "I2C" },
    { id: "e8", source: "n2", target: "n9", relationship: "controls", strength: 0.72, organization_id: "uni-b", organization_name: "University B" },
    { id: "e9", source: "n9", target: "n10", relationship: "commands", strength: 0.85, organization_id: "uni-b", organization_name: "University B" },
    { id: "e10", source: "n11", target: "n9", relationship: "reports_to", strength: 0.82, organization_id: "uni-b", organization_name: "University B" },

    // Ground station connections
    { id: "e11", source: "n12", target: "n13", relationship: "contains", strength: 0.91, organization_id: "research-c", organization_name: "Research Group C" },
    { id: "e12", source: "n13", target: "n2", relationship: "communicates_with", strength: 0.68, organization_id: "research-c", organization_name: "Research Group C", via_interface: "UHF" },
    { id: "e13", source: "n14", target: "n12", relationship: "schedules", strength: 0.76, organization_id: "research-c", organization_name: "Research Group C" },
  ];

  return { nodes, edges };
}
