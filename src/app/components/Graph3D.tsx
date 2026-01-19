/**
 * Graph3D - 3D Knowledge Graph with Heat Overlay
 *
 * Uses 3d-force-graph for the knowledge graph visualization.
 *
 * Heat overlay (optional):
 * - Shows validation activity as a breathing glow around nodes
 * - Lives in the graph scene because it's about WHERE validation is happening
 * - Point sprites with additive blending
 *
 * Click on nodes/edges to see details in a side panel.
 */

import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { RefreshCw, Box, X, Circle, ArrowRight } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { supabase } from '@/lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

interface Graph3DProps {
  highlightOrgId?: string;
  height?: number;
  className?: string;
  /** Enable heat overlay for validation activity */
  enableHeatOverlay?: boolean;
}

interface Node3D {
  id: string;
  label: string;
  type: string;
  category: string;
  domain: string;
  organizationColor: string;
  organizationName?: string;
  status: string;
  confidence: number;
  x?: number;
  y?: number;
  z?: number;
}

interface Link3D {
  id?: string;
  source: string | Node3D;
  target: string | Node3D;
  relation: string;
  organizationName?: string;
  status?: string;
  confidence?: number;
}

type SelectedItem =
  | { type: 'node'; data: Node3D }
  | { type: 'edge'; data: Link3D }
  | null;

// =============================================================================
// COMPONENT
// =============================================================================

export function Graph3D({
  highlightOrgId,
  height = 600,
  className = '',
  enableHeatOverlay = false,
}: Graph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const nodesMapRef = useRef<Map<string, Node3D>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  const [selected, setSelected] = useState<SelectedItem>(null);
  const selectedRef = useRef<SelectedItem>(null);

  // Keep selected ref in sync
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

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
          organizationName: n.organization_name || 'Community',
          status: n.status,
          confidence: n.confidence,
        }));

        const links: Link3D[] = (edgesData || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          relation: e.relation,
          organizationName: e.organization_name || 'Community',
          status: e.status || 'verified',
          confidence: e.confidence || 1.0,
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
          .linkWidth(1)
          .onNodeClick((node: Node3D) => {
            setSelected({ type: 'node', data: node });
            setAutoRotate(false); // Stop rotation when viewing details
          })
          .onLinkClick((link: Link3D) => {
            setSelected({ type: 'edge', data: link });
            setAutoRotate(false);
          })
          .onBackgroundClick(() => {
            setSelected(null);
          });

        graphRef.current = graph;

        // Build nodes map for position lookup
        const nodesMap = new Map<string, Node3D>();
        nodes.forEach(n => nodesMap.set(n.id, n));
        nodesMapRef.current = nodesMap;

        // Get Three.js context from the graph
        const scene = graph.scene() as THREE.Scene;
        const camera = graph.camera() as THREE.Camera;
        const renderer = graph.renderer() as THREE.WebGLRenderer;

        // Heat overlay: breathing glow around nodes showing validation activity
        let heatParticles: THREE.Points | null = null;
        let heatTime = 0;

        if (enableHeatOverlay && nodes.length > 0) {
          const HEAT_PARTICLES_PER_NODE = 8;
          const totalParticles = nodes.length * HEAT_PARTICLES_PER_NODE;

          const heatGeometry = new THREE.BufferGeometry();
          const heatPositions = new Float32Array(totalParticles * 3);
          const heatColors = new Float32Array(totalParticles * 3);
          const heatSizes = new Float32Array(totalParticles);
          const heatSeeds = new Float32Array(totalParticles); // For animation variation

          // Initialize particles around each node
          let idx = 0;
          nodes.forEach((node, nodeIdx) => {
            const color = new THREE.Color(node.organizationColor);
            // Validation activity based on confidence (lower confidence = more activity/heat)
            const activity = 1 - (node.confidence || 0.5);

            for (let i = 0; i < HEAT_PARTICLES_PER_NODE; i++) {
              // Spread particles in a sphere around node origin (positions will update in animation)
              heatPositions[idx * 3] = 0;
              heatPositions[idx * 3 + 1] = 0;
              heatPositions[idx * 3 + 2] = 0;

              // Warmer colors for more activity
              const hue = activity > 0.5 ? 0.05 : 0.15; // Red-orange for high activity, yellow-green for low
              const heatColor = new THREE.Color().setHSL(hue, 0.9, 0.5 + activity * 0.3);
              heatColors[idx * 3] = heatColor.r;
              heatColors[idx * 3 + 1] = heatColor.g;
              heatColors[idx * 3 + 2] = heatColor.b;

              heatSizes[idx] = 3 + activity * 5;
              heatSeeds[idx] = Math.random() * Math.PI * 2;
              idx++;
            }
          });

          heatGeometry.setAttribute('position', new THREE.BufferAttribute(heatPositions, 3));
          heatGeometry.setAttribute('color', new THREE.BufferAttribute(heatColors, 3));
          heatGeometry.setAttribute('size', new THREE.BufferAttribute(heatSizes, 1));

          const heatMaterial = new THREE.PointsMaterial({
            size: 6,
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
          });

          heatParticles = new THREE.Points(heatGeometry, heatMaterial);
          scene.add(heatParticles);

          // Store seeds for animation
          (heatParticles as any)._heatSeeds = heatSeeds;
          (heatParticles as any)._nodeCount = nodes.length;
          (heatParticles as any)._particlesPerNode = HEAT_PARTICLES_PER_NODE;
        }

        // Animation loop for auto-rotate and heat overlay
        let angle = 0;

        const animate = () => {
          if (destroyed) return;

          // Auto-rotate camera
          if (autoRotateRef.current && graphRef.current) {
            angle += 0.002;
            graphRef.current.cameraPosition({
              x: 400 * Math.sin(angle),
              y: 100,
              z: 400 * Math.cos(angle),
            });
          }

          // Animate heat overlay
          if (heatParticles && enableHeatOverlay) {
            heatTime += 0.016;
            const positions = heatParticles.geometry.attributes.position.array as Float32Array;
            const sizes = heatParticles.geometry.attributes.size.array as Float32Array;
            const seeds = (heatParticles as any)._heatSeeds as Float32Array;
            const nodeCount = (heatParticles as any)._nodeCount as number;
            const particlesPerNode = (heatParticles as any)._particlesPerNode as number;

            // Get current node positions from the graph
            const graphData = graphRef.current?.graphData();
            if (graphData?.nodes) {
              let idx = 0;
              graphData.nodes.forEach((node: any, nodeIdx: number) => {
                const nx = node.x || 0;
                const ny = node.y || 0;
                const nz = node.z || 0;
                const activity = 1 - (node.confidence || 0.5);

                for (let i = 0; i < particlesPerNode; i++) {
                  const seed = seeds[idx];
                  // Breathing radius
                  const breathe = 1 + Math.sin(heatTime * 2 + seed) * 0.3;
                  const radius = (8 + activity * 12) * breathe;

                  // Orbital motion
                  const theta = seed + heatTime * (0.5 + activity);
                  const phi = seed * 2 + heatTime * 0.3;

                  positions[idx * 3] = nx + radius * Math.sin(theta) * Math.cos(phi);
                  positions[idx * 3 + 1] = ny + radius * Math.sin(theta) * Math.sin(phi);
                  positions[idx * 3 + 2] = nz + radius * Math.cos(theta);

                  // Pulsing size
                  sizes[idx] = (3 + activity * 5) * (0.8 + Math.sin(heatTime * 3 + seed * 2) * 0.2);

                  idx++;
                }
              });
            }

            heatParticles.geometry.attributes.position.needsUpdate = true;
            heatParticles.geometry.attributes.size.needsUpdate = true;

            // Breathing opacity
            const mat = heatParticles.material as THREE.PointsMaterial;
            mat.opacity = 0.3 + Math.sin(heatTime * 1.5) * 0.15;
          }

          requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);

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
      if (graphRef.current?._destructor) graphRef.current._destructor();
    };
  }, [height]); // Re-run if height changes

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

      {/* Detail Panel - shows when node/edge is clicked */}
      {selected && (
        <div className="absolute top-4 right-4 z-10 w-80 bg-slate-900/95 rounded-lg border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <span className="text-sm font-medium text-white">
              {selected.type === 'node' ? 'Node Details' : 'Edge Details'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelected(null)}
              className="h-6 w-6 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-3">
            {selected.type === 'node' ? (
              <>
                {/* Node details */}
                <div>
                  <div className="text-lg font-semibold text-white">{selected.data.label}</div>
                  <div className="text-sm text-slate-400">{selected.data.type}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-500">Category</div>
                    <Badge variant="outline" className="mt-1 text-blue-400 border-blue-400/50">
                      {selected.data.category}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-slate-500">Domain</div>
                    <Badge variant="outline" className="mt-1 text-purple-400 border-purple-400/50">
                      {selected.data.domain}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="text-slate-500">Organization</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Circle
                      className="h-3 w-3"
                      style={{ color: selected.data.organizationColor, fill: selected.data.organizationColor }}
                    />
                    <span className="text-white">{selected.data.organizationName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-500">Status</div>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${
                        selected.data.status === 'verified'
                          ? 'text-green-400 border-green-400/50'
                          : 'text-yellow-400 border-yellow-400/50'
                      }`}
                    >
                      {selected.data.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-slate-500">Confidence</div>
                    <div className="text-white mt-1">{(selected.data.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                  ID: {selected.data.id.slice(0, 8)}...
                </div>
              </>
            ) : (
              <>
                {/* Edge details */}
                <div className="flex items-center gap-2 text-white">
                  <span className="px-2 py-1 bg-blue-500/20 rounded text-sm">
                    {typeof selected.data.source === 'object'
                      ? selected.data.source.label
                      : selected.data.source.slice(0, 8)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span className="px-2 py-1 bg-purple-500/20 rounded text-sm">
                    {typeof selected.data.target === 'object'
                      ? selected.data.target.label
                      : selected.data.target.slice(0, 8)}
                  </span>
                </div>

                <div className="text-sm">
                  <div className="text-slate-500">Relationship</div>
                  <Badge variant="outline" className="mt-1 text-green-400 border-green-400/50">
                    {selected.data.relation}
                  </Badge>
                </div>

                <div className="text-sm">
                  <div className="text-slate-500">Organization</div>
                  <span className="text-white">{selected.data.organizationName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-500">Status</div>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${
                        selected.data.status === 'verified'
                          ? 'text-green-400 border-green-400/50'
                          : 'text-yellow-400 border-yellow-400/50'
                      }`}
                    >
                      {selected.data.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-slate-500">Confidence</div>
                    <div className="text-white mt-1">{((selected.data.confidence || 1) * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {selected.data.id && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                    ID: {selected.data.id.slice(0, 8)}...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default Graph3D;
