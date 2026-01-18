/**
 * Graph3D - Simple 3D knowledge graph using 3d-force-graph
 */

import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { RefreshCw, Box } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

interface Graph3DProps {
  highlightOrgId?: string;
  height?: number;
  className?: string;
}

interface Node3D {
  id: string;
  label: string;
  type: string;
  category: string;
  domain: string;
  organizationColor: string;
  status: string;
  confidence: number;
  x?: number;
  y?: number;
  z?: number;
}

interface Link3D {
  source: string;
  target: string;
  relation: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Graph3D({
  highlightOrgId,
  height = 600,
  className = '',
}: Graph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);

  // Keep ref in sync
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Load data and initialize graph ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;
    let rotateInterval: NodeJS.Timeout;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        // Fetch nodes
        const { data: nodesData, error: nodesError } = await supabase.rpc('get_graph_nodes', {
          p_verified_only: true,
          p_limit: 500,
        });
        if (nodesError) throw nodesError;

        // Fetch edges
        const { data: edgesData, error: edgesError } = await supabase.rpc('get_graph_edges', {
          p_verified_only: true,
          p_limit: 1000,
        });
        if (edgesError) throw edgesError;

        if (destroyed) return;

        // Transform data
        const nodes: Node3D[] = (nodesData || []).map((n: any) => ({
          id: n.id,
          label: n.label,
          type: n.type,
          category: n.category,
          domain: n.domain,
          organizationColor: n.organization_color || '#3b82f6',
          status: n.status,
          confidence: n.confidence,
        }));

        const links: Link3D[] = (edgesData || []).map((e: any) => ({
          source: e.source,
          target: e.target,
          relation: e.relation,
        }));

        setNodeCount(nodes.length);
        setEdgeCount(links.length);

        // Create graph
        const graph = ForceGraph3D()(containerRef.current!)
          .backgroundColor('#0f172a')
          .width(containerRef.current!.clientWidth)
          .height(height)
          .graphData({ nodes, links })
          .nodeLabel((node: Node3D) => node.label)
          .nodeColor((node: Node3D) => node.organizationColor)
          .nodeVal(3)
          .linkColor(() => '#60a5fa')
          .linkOpacity(0.6)
          .linkWidth(1);

        graphRef.current = graph;

        // Auto-rotate
        let angle = 0;
        rotateInterval = setInterval(() => {
          if (autoRotateRef.current && graphRef.current) {
            angle += 0.002;
            graphRef.current.cameraPosition({
              x: 400 * Math.sin(angle),
              y: 100,
              z: 400 * Math.cos(angle),
            });
          }
        }, 30);

        setLoading(false);
      } catch (err) {
        if (!destroyed) {
          setError(err instanceof Error ? err.message : 'Failed to load graph');
          setLoading(false);
        }
      }
    }

    loadAndRender();

    return () => {
      destroyed = true;
      if (rotateInterval) clearInterval(rotateInterval);
      if (graphRef.current?._destructor) graphRef.current._destructor();
    };
  }, [height]); // Only re-run if height changes

  // Manual refresh
  const handleRefresh = async () => {
    if (!containerRef.current || !graphRef.current) return;

    setLoading(true);
    try {
      const { data: nodesData } = await supabase.rpc('get_graph_nodes', {
        p_verified_only: true,
        p_limit: 500,
      });
      const { data: edgesData } = await supabase.rpc('get_graph_edges', {
        p_verified_only: true,
        p_limit: 1000,
      });

      const nodes = (nodesData || []).map((n: any) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        category: n.category,
        domain: n.domain,
        organizationColor: n.organization_color || '#3b82f6',
        status: n.status,
        confidence: n.confidence,
      }));

      const links = (edgesData || []).map((e: any) => ({
        source: e.source,
        target: e.target,
        relation: e.relation,
      }));

      setNodeCount(nodes.length);
      setEdgeCount(links.length);
      graphRef.current.graphData({ nodes, links });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    }
    setLoading(false);
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Simple controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`h-8 w-8 bg-slate-900/80 ${autoRotate ? 'text-blue-400' : 'text-slate-400'}`}
        >
          <Box className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={loading}
          className="h-8 w-8 bg-slate-900/80"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 rounded-lg px-3 py-2">
        <div className="text-xs text-slate-400">
          {nodeCount} nodes • {edgeCount} edges
        </div>
      </div>

      {/* Loading */}
      {loading && nodeCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
          <div className="text-slate-400 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading graph...
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
          <div className="text-red-400 text-center">
            <p>Error: {error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
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

export default Graph3D;
