/**
 * CytoscapeGraph - Interactive knowledge graph using Cytoscape.js
 *
 * Features:
 * - Stable node positioning (nodes don't explode on updates)
 * - Progressive disclosure (category tiles -> subgraph -> node details)
 * - Organization coloring (each university has a color)
 * - Confidence visualization (edge thickness, node opacity)
 * - Live polling for updates
 *
 * Data contract:
 *   nodes[]: { id, type, label, domain, category, organization_id, status, confidence }
 *   edges[]: { id, source, target, relation, organization_id, status, confidence }
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Layers,
  Circle,
  Pause,
  Play,
} from 'lucide-react';
import { useGraphData, GraphNode, GraphEdge, CategoryCount, toCytoscapeElements } from '@/hooks/useGraphData';

// =============================================================================
// CYTOSCAPE STYLES
// =============================================================================

const cytoscapeStyles: cytoscape.Stylesheet[] = [
  // Base node style
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'font-size': '10px',
      'text-margin-y': 5,
      'background-color': 'data(organizationColor)',
      'border-width': 2,
      'border-color': '#e5e7eb',
      'width': 30,
      'height': 30,
      'opacity': 0.9,
    },
  },

  // Category-based shapes
  {
    selector: 'node.architecture',
    style: { 'shape': 'round-rectangle' },
  },
  {
    selector: 'node.interfaces',
    style: { 'shape': 'diamond' },
  },
  {
    selector: 'node.procedures',
    style: { 'shape': 'rectangle' },
  },
  {
    selector: 'node.decisions',
    style: { 'shape': 'hexagon' },
  },
  {
    selector: 'node.lessons',
    style: { 'shape': 'star' },
  },

  // Status-based styling
  {
    selector: 'node.verified',
    style: {
      'border-color': '#22c55e',
      'border-width': 2,
    },
  },
  {
    selector: 'node.pending',
    style: {
      'border-color': '#f59e0b',
      'border-style': 'dashed',
      'opacity': 0.7,
    },
  },

  // Selected node
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#3b82f6',
      'background-color': '#3b82f6',
      'color': '#ffffff',
    },
  },

  // Highlighted node (user's org)
  {
    selector: 'node.highlighted',
    style: {
      'border-width': 4,
      'border-color': '#8b5cf6',
      'shadow-blur': 10,
      'shadow-color': '#8b5cf6',
      'shadow-opacity': 0.5,
    },
  },

  // Base edge style
  {
    selector: 'edge',
    style: {
      'width': 'mapData(confidence, 0, 1, 1, 4)',
      'line-color': '#9ca3af',
      'target-arrow-color': '#9ca3af',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'opacity': 0.6,
    },
  },

  // Edge with label on hover
  {
    selector: 'edge:selected',
    style: {
      'label': 'data(relation)',
      'font-size': '9px',
      'text-rotation': 'autorotate',
      'text-margin-y': -10,
      'line-color': '#3b82f6',
      'target-arrow-color': '#3b82f6',
      'opacity': 1,
      'width': 3,
    },
  },

  // Verified edge
  {
    selector: 'edge.verified',
    style: {
      'line-color': '#22c55e',
      'target-arrow-color': '#22c55e',
    },
  },

  // Pending edge
  {
    selector: 'edge.pending',
    style: {
      'line-style': 'dashed',
      'opacity': 0.4,
    },
  },

  // Faded (for focus mode)
  {
    selector: '.faded',
    style: {
      'opacity': 0.15,
    },
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

interface CytoscapeGraphProps {
  organizationId?: string | null;
  highlightOrgId?: string | null;
  initialCategory?: string | null;
  width?: number | string;
  height?: number | string;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
}

export function CytoscapeGraph({
  organizationId = null,
  highlightOrgId = null,
  initialCategory = null,
  width = '100%',
  height = 500,
  onNodeClick,
  onEdgeClick,
}: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [showPending, setShowPending] = useState(false);

  // Fetch graph data with polling
  const {
    nodes,
    edges,
    categoryCounts,
    loading,
    error,
    lastUpdated,
    refresh,
    setFilters,
    isPolling,
    startPolling,
    stopPolling,
  } = useGraphData({
    filters: {
      organizationId,
      category: activeCategory,
      verifiedOnly: !showPending,
    },
    pollInterval: 10000,  // 10 seconds
  });

  // Update filters when props change
  useEffect(() => {
    setFilters({
      organizationId,
      category: activeCategory,
      verifiedOnly: !showPending,
    });
  }, [organizationId, activeCategory, showPending, setFilters]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: cytoscapeStyles,
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 100,
        edgeElasticity: () => 100,
        nestingFactor: 1.2,
        gravity: 0.25,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      },
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    // Event handlers
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data() as GraphNode;
      setSelectedNode(nodeData);
      onNodeClick?.(nodeData);

      // Focus mode: fade non-connected nodes
      const neighborhood = node.closedNeighborhood();
      cy.elements().addClass('faded');
      neighborhood.removeClass('faded');
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      const edgeData = edge.data() as GraphEdge;
      onEdgeClick?.(edgeData);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        // Clicked on background - clear selection
        setSelectedNode(null);
        cy.elements().removeClass('faded');
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [onNodeClick, onEdgeClick]);

  // Update elements when data changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || loading) return;

    // Get current positions to preserve layout
    const positions: Record<string, { x: number; y: number }> = {};
    cy.nodes().forEach((node) => {
      positions[node.id()] = node.position();
    });

    // Convert to Cytoscape format
    const elements = toCytoscapeElements(nodes, edges);

    // Batch update
    cy.batch(() => {
      // Remove old elements not in new data
      const newIds = new Set(elements.map((e) => e.data.id));
      cy.elements().forEach((ele) => {
        if (!newIds.has(ele.id())) {
          ele.remove();
        }
      });

      // Add/update elements
      for (const elem of elements) {
        const existing = cy.getElementById(elem.data.id);
        if (existing.length > 0) {
          // Update existing element
          existing.data(elem.data);
          if (elem.classes) {
            existing.classes(elem.classes);
          }
        } else {
          // Add new element with preserved position if available
          const position = positions[elem.data.id];
          if (position && !elem.data.source) {
            cy.add({ ...elem, position });
          } else {
            cy.add(elem);
          }
        }
      }

      // Highlight user's org
      if (highlightOrgId) {
        cy.nodes().forEach((node) => {
          if (node.data('organizationId') === highlightOrgId) {
            node.addClass('highlighted');
          } else {
            node.removeClass('highlighted');
          }
        });
      }
    });

    // Only run layout if we have new nodes
    const hasNewNodes = elements.some(
      (e) => !e.data.source && !positions[e.data.id]
    );
    if (hasNewNodes && elements.length > 0) {
      cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 300,
        fit: false,  // Don't zoom to fit on incremental updates
      }).run();
    }
  }, [nodes, edges, loading, highlightOrgId]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    cyRef.current?.zoom(cyRef.current.zoom() / 1.3);
  }, []);

  const handleFit = useCallback(() => {
    cyRef.current?.fit(undefined, 50);
  }, []);

  const handleCenterSelected = useCallback(() => {
    const selected = cyRef.current?.nodes(':selected');
    if (selected && selected.length > 0) {
      cyRef.current?.center(selected);
    }
  }, []);

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          {/* Category filter tiles */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2 py-1 text-xs rounded ${
                activeCategory === null
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categoryCounts.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                  activeCategory === cat.category
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CategoryIcon category={cat.category} />
                {cat.category}
                <span className="text-[10px] opacity-60">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Show pending toggle */}
          <button
            onClick={() => setShowPending(!showPending)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
              showPending
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600'
            }`}
            title={showPending ? 'Showing pending' : 'Verified only'}
          >
            {showPending ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Pending
          </button>

          {/* Polling toggle */}
          <button
            onClick={() => (isPolling ? stopPolling() : startPolling())}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
              isPolling
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
            title={isPolling ? 'Live updates on' : 'Live updates off'}
          >
            {isPolling ? (
              <>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" />
                Paused
              </>
            )}
          </button>

          {/* Zoom controls */}
          <div className="flex border rounded overflow-hidden">
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-100" title="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleFit} className="p-1.5 hover:bg-gray-100 border-x" title="Fit to view">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-100" title="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        style={{ width, height: typeof height === 'number' ? height : height }}
        className="bg-white"
      />

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{nodes.length} nodes</span>
          <span>{edges.length} edges</span>
          {selectedNode && (
            <span className="text-blue-600">
              Selected: {selectedNode.label} ({selectedNode.type})
            </span>
          )}
        </div>
        {lastUpdated && (
          <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-400 border-2 border-green-500" />
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-400 border-2 border-dashed border-yellow-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-purple-500 border-2 border-purple-600 shadow" />
            <span>Your org</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function CategoryIcon({ category }: { category: string }) {
  const iconClass = 'w-3 h-3';
  switch (category) {
    case 'architecture':
      return <div className={`${iconClass} rounded-sm bg-blue-400`} />;
    case 'interfaces':
      return <div className={`${iconClass} rotate-45 bg-green-400`} />;
    case 'procedures':
      return <div className={`${iconClass} bg-purple-400`} />;
    case 'decisions':
      return <div className={`${iconClass} bg-orange-400`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />;
    case 'lessons':
      return <div className={`${iconClass} bg-red-400`} style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />;
    default:
      return <Circle className={iconClass} />;
  }
}

// =============================================================================
// KNOWLEDGE MAP TILES (Progressive disclosure entry point)
// =============================================================================

interface KnowledgeMapTilesProps {
  categoryCounts: CategoryCount[];
  onSelectCategory: (category: string) => void;
  selectedCategory: string | null;
}

export function KnowledgeMapTiles({
  categoryCounts,
  onSelectCategory,
  selectedCategory,
}: KnowledgeMapTilesProps) {
  const categoryMeta: Record<string, { label: string; description: string; color: string }> = {
    procedures: {
      label: 'Procedures',
      description: 'Ops runbooks, checklists, workflows',
      color: 'bg-purple-500',
    },
    architecture: {
      label: 'Architecture',
      description: 'Systems, components, modules',
      color: 'bg-blue-500',
    },
    interfaces: {
      label: 'Interfaces',
      description: 'Ports, connections, protocols',
      color: 'bg-green-500',
    },
    decisions: {
      label: 'Decisions',
      description: 'ADRs, trade studies, rationale',
      color: 'bg-orange-500',
    },
    lessons: {
      label: 'Lessons Learned',
      description: 'Post-mortems, gotchas, risks',
      color: 'bg-red-500',
    },
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {Object.entries(categoryMeta).map(([key, meta]) => {
        const count = categoryCounts.find((c) => c.category === key);
        const isSelected = selectedCategory === key;

        return (
          <button
            key={key}
            onClick={() => onSelectCategory(key)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg ${meta.color} mb-3`} />
            <h3 className="font-semibold text-gray-900">{meta.label}</h3>
            <p className="text-xs text-gray-500 mb-2">{meta.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {count?.count || 0}
              </span>
              {count && count.pending_count > 0 && (
                <span className="text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">
                  +{count.pending_count} pending
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
