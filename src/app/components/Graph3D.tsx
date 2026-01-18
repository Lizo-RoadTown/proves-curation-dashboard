/**
 * Graph3D - Interactive 3D knowledge graph using 3d-force-graph
 *
 * Features:
 * - True 3D visualization with WebGL
 * - Force-directed layout that responds to edges
 * - Organization coloring (each university has a color)
 * - Click to focus on node and its connections
 * - Zoom, pan, rotate with mouse
 * - Live polling for updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  RefreshCw,
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
  Box,
} from 'lucide-react';
import { useGraphData, GraphNode, GraphEdge } from '@/hooks/useGraphData';
import * as THREE from 'three';

// =============================================================================
// TYPES
// =============================================================================

interface Graph3DProps {
  organizationId?: string;
  highlightOrgId?: string;
  initialCategory?: string;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  height?: number;
  className?: string;
}

interface GraphData {
  nodes: Node3D[];
  links: Link3D[];
}

interface Node3D {
  id: string;
  label: string;
  type: string;
  category: string;
  domain: string;
  organizationId: string | null;
  organizationName: string;
  organizationColor: string;
  status: 'verified' | 'pending';
  confidence: number;
  // 3d-force-graph adds these
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

interface Link3D {
  id: string;
  source: string | Node3D;
  target: string | Node3D;
  relation: string;
  organizationName: string;
  status: 'verified' | 'pending';
  confidence: number;
}

// =============================================================================
// CATEGORY COLORS (for grouping by Z-axis)
// =============================================================================

const CATEGORY_Z_OFFSET: Record<string, number> = {
  procedures: -200,
  architecture: -100,
  interfaces: 0,
  decisions: 100,
  lessons: 200,
};

const CATEGORY_COLORS: Record<string, string> = {
  procedures: '#10b981',    // emerald
  architecture: '#3b82f6',  // blue
  interfaces: '#8b5cf6',    // violet
  decisions: '#f59e0b',     // amber
  lessons: '#ef4444',       // red
};

// =============================================================================
// COMPONENT
// =============================================================================

export function Graph3D({
  organizationId,
  highlightOrgId,
  initialCategory,
  onNodeClick,
  onEdgeClick,
  height = 600,
  className = '',
}: Graph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance | null>(null);

  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory || null);
  const [showPending, setShowPending] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Fetch graph data with polling
  const {
    nodes,
    edges,
    categoryCounts,
    loading,
    error,
    lastUpdated,
    refresh,
    isPolling,
    startPolling,
    stopPolling,
  } = useGraphData({
    filters: {
      organizationId,
      category: activeCategory,
      verifiedOnly: !showPending,
    },
    pollInterval: 10000,
  });

  // Convert to 3d-force-graph format
  const graphData: GraphData = {
    nodes: nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      category: n.category,
      domain: n.domain,
      organizationId: n.organization_id,
      organizationName: n.organization_name,
      organizationColor: n.organization_color,
      status: n.status as 'verified' | 'pending',
      confidence: n.confidence,
    })),
    links: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      relation: e.relation,
      organizationName: e.organization_name,
      status: e.status as 'verified' | 'pending',
      confidence: e.confidence,
    })),
  };

  // Initialize 3D graph
  useEffect(() => {
    if (!containerRef.current) return;

    const graph = ForceGraph3D()(containerRef.current)
      .backgroundColor('#0f172a')  // slate-900
      .width(containerRef.current.clientWidth)
      .height(height)
      .nodeLabel((node: Node3D) => `
        <div style="background: rgba(15,23,42,0.9); padding: 8px 12px; border-radius: 6px; color: white; font-size: 12px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${node.label}</div>
          <div style="color: #94a3b8; font-size: 10px;">
            ${node.type} • ${node.category}<br/>
            ${node.organizationName}
          </div>
        </div>
      `)
      .nodeColor((node: Node3D) => {
        // Use organization color, dim if pending
        const baseColor = node.organizationColor || '#6b7280';
        return node.status === 'pending' ? adjustAlpha(baseColor, 0.5) : baseColor;
      })
      .nodeOpacity(1)
      .nodeResolution(16)
      .nodeVal((node: Node3D) => {
        // Size based on confidence
        return 2 + node.confidence * 3;
      })
      .linkColor((link: Link3D) => {
        return link.status === 'verified' ? '#60a5fa' : '#475569';
      })
      .linkOpacity(0.6)
      .linkWidth((link: Link3D) => {
        return link.status === 'verified' ? 2 : 1;
      })
      .linkDirectionalParticles((link: Link3D) => link.status === 'verified' ? 2 : 0)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleWidth(2)
      .onNodeClick((node: Node3D) => {
        setSelectedNode(node);

        // Focus on node
        const distance = 200;
        const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);

        graph.cameraPosition(
          { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
          { x: node.x || 0, y: node.y || 0, z: node.z || 0 },
          1000
        );

        // Callback
        if (onNodeClick) {
          onNodeClick({
            id: node.id,
            label: node.label,
            type: node.type,
            category: node.category as GraphNode['category'],
            domain: node.domain,
            tags: [],
            organization_id: node.organizationId,
            organization_name: node.organizationName,
            organization_color: node.organizationColor,
            status: node.status,
            confidence: node.confidence,
            updated_at: '',
          });
        }
      })
      .onNodeHover((node: Node3D | null) => {
        containerRef.current!.style.cursor = node ? 'pointer' : 'default';
      });

    // Force configuration for better clustering
    const chargeForce = graph.d3Force('charge');
    if (chargeForce) chargeForce.strength(-120);

    const linkForce = graph.d3Force('link');
    if (linkForce) linkForce.distance(80);

    const centerForce = graph.d3Force('center');
    if (centerForce) centerForce.strength(0.05);

    // Add category-based Z positioning
    graph.d3Force('z', (alpha: number) => {
      const data = graph.graphData();
      if (data && data.nodes) {
        data.nodes.forEach((node: Node3D) => {
          const targetZ = CATEGORY_Z_OFFSET[node.category] || 0;
          if (node.z !== undefined) {
            node.z += (targetZ - node.z) * alpha * 0.1;
          }
        });
      }
    });

    graphRef.current = graph;

    // Auto-rotate
    let angle = 0;
    const rotateInterval = setInterval(() => {
      if (autoRotate && graphRef.current) {
        angle += 0.002;
        const distance = 500;
        graphRef.current.cameraPosition({
          x: distance * Math.sin(angle),
          y: 100,
          z: distance * Math.cos(angle),
        });
      }
    }, 30);

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && graphRef.current) {
        graphRef.current.width(containerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(rotateInterval);
      window.removeEventListener('resize', handleResize);
      graph._destructor?.();
    };
  }, [height, autoRotate, onNodeClick]);

  // Update data when it changes
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      graphRef.current.graphData(graphData);
    }
  }, [nodes, edges]);

  // Highlight organization nodes
  useEffect(() => {
    if (!graphRef.current || !highlightOrgId) return;

    graphRef.current.nodeColor((node: Node3D) => {
      if (node.organizationId === highlightOrgId) {
        return node.organizationColor || '#3b82f6';
      }
      return adjustAlpha(node.organizationColor || '#6b7280', 0.3);
    });
  }, [highlightOrgId]);

  // Controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      const pos = graphRef.current.cameraPosition();
      graphRef.current.cameraPosition(
        { x: pos.x * 0.8, y: pos.y * 0.8, z: pos.z * 0.8 },
        undefined,
        500
      );
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const pos = graphRef.current.cameraPosition();
      graphRef.current.cameraPosition(
        { x: pos.x * 1.2, y: pos.y * 1.2, z: pos.z * 1.2 },
        undefined,
        500
      );
    }
  };

  const handleReset = () => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
    }
  };

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(1000, 50);
    }
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-slate-900/80 backdrop-blur rounded-lg p-2 flex flex-col gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFitView} className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-slate-900/80 backdrop-blur rounded-lg p-2 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`h-8 w-8 ${autoRotate ? 'text-blue-400' : ''}`}
          >
            <Box className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPending(!showPending)}
            className={`h-8 w-8 ${showPending ? 'text-amber-400' : ''}`}
          >
            {showPending ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={isPolling ? stopPolling : startPolling}
            className={`h-8 w-8 ${isPolling ? 'text-green-400' : ''}`}
          >
            {isPolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={refresh} className="h-8 w-8">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Category Legend */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-2">Categories (Z-axis)</div>
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <button
            key={category}
            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
            className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs hover:bg-slate-800 ${
              activeCategory === category ? 'bg-slate-800' : ''
            }`}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize text-slate-300">{category}</span>
            <span className="ml-auto text-slate-500">
              {categoryCounts.find(c => c.category === category)?.count || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur rounded-lg px-3 py-2">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>{graphData.nodes.length} nodes</span>
          <span>{graphData.links.length} edges</span>
          {lastUpdated && (
            <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur rounded-lg p-4 max-w-xs">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white">{selectedNode.label}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedNode.type} • {selectedNode.category}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedNode.organizationColor }}
              />
              <span className="text-slate-300">{selectedNode.organizationName}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span className={`px-1.5 py-0.5 rounded ${
                selectedNode.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {selectedNode.status}
              </span>
              <span>Confidence: {(selectedNode.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-slate-400 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading graph data...
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-red-400 text-center">
            <p className="font-semibold">Error loading graph</p>
            <p className="text-sm mt-1">{error}</p>
            <Button variant="outline" size="sm" onClick={refresh} className="mt-3">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Graph container */}
      <div ref={containerRef} style={{ height }} />
    </Card>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function adjustAlpha(hex: string, alpha: number): string {
  // Convert hex to rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default Graph3D;
