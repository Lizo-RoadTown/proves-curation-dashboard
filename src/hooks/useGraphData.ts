/**
 * useGraphData - Hook for fetching graph data with polling
 *
 * Provides:
 * - Nodes and edges for Cytoscape.js
 * - Tenant filtering (organization_id)
 * - Domain/category filtering
 * - Polling for live updates
 * - Category counts for Knowledge Map tiles
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  domain: string;
  category: 'procedures' | 'architecture' | 'interfaces' | 'decisions' | 'lessons';
  tags: string[];
  organization_id: string | null;
  organization_name: string;
  organization_color: string;
  status: 'verified' | 'pending';
  confidence: number;
  updated_at: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  organization_id: string | null;
  organization_name: string;
  status: 'verified' | 'pending';
  confidence: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  verified_count: number;
  pending_count: number;
}

export interface GraphFilters {
  organizationId?: string | null;
  domain?: string | null;
  category?: string | null;
  verifiedOnly?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  lastUpdated: Date | null;
}

interface UseGraphDataOptions {
  filters?: GraphFilters;
  pollInterval?: number | null;  // ms, null to disable polling
  nodeLimit?: number;
  edgeLimit?: number;
}

interface UseGraphDataResult {
  // Data
  nodes: GraphNode[];
  edges: GraphEdge[];
  categoryCounts: CategoryCount[];

  // State
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  refresh: () => Promise<void>;
  setFilters: (filters: GraphFilters) => void;

  // Polling control
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useGraphData(options: UseGraphDataOptions = {}): UseGraphDataResult {
  const {
    filters: initialFilters = {},
    pollInterval = 10000,  // Default: 10 seconds
    nodeLimit = 500,
    edgeLimit = 1000,
  } = options;

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFiltersState] = useState<GraphFilters>(initialFilters);
  const [isPolling, setIsPolling] = useState(pollInterval !== null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch graph data from Supabase
   */
  const fetchGraphData = useCallback(async () => {
    try {
      setError(null);

      // Fetch nodes and edges in parallel
      const [nodesResult, edgesResult, countsResult] = await Promise.all([
        supabase.rpc('get_graph_nodes', {
          p_organization_id: filters.organizationId || null,
          p_domain: filters.domain || null,
          p_category: filters.category || null,
          p_verified_only: filters.verifiedOnly ?? true,
          p_limit: nodeLimit,
        }),
        supabase.rpc('get_graph_edges', {
          p_organization_id: filters.organizationId || null,
          p_verified_only: filters.verifiedOnly ?? true,
          p_limit: edgeLimit,
        }),
        supabase.rpc('get_graph_category_counts', {
          p_organization_id: filters.organizationId || null,
          p_verified_only: filters.verifiedOnly ?? true,
        }),
      ]);

      if (nodesResult.error) throw nodesResult.error;
      if (edgesResult.error) throw edgesResult.error;
      if (countsResult.error) throw countsResult.error;

      setNodes(nodesResult.data || []);
      setEdges(edgesResult.data || []);
      setCategoryCounts(countsResult.data || []);
      setLastUpdated(new Date());

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch graph data';
      setError(message);
      console.error('Error fetching graph data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, nodeLimit, edgeLimit]);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchGraphData();
  }, [fetchGraphData]);

  /**
   * Update filters
   */
  const setFilters = useCallback((newFilters: GraphFilters) => {
    setFiltersState(newFilters);
  }, []);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Polling
  useEffect(() => {
    if (isPolling && pollInterval) {
      pollIntervalRef.current = setInterval(() => {
        fetchGraphData();
      }, pollInterval);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [isPolling, pollInterval, fetchGraphData]);

  return {
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
  };
}

// =============================================================================
// HELPER: Convert to Cytoscape format
// =============================================================================

export interface CytoscapeElement {
  data: {
    id: string;
    label?: string;
    source?: string;
    target?: string;
    [key: string]: any;
  };
  classes?: string;
}

export function toCytoscapeElements(nodes: GraphNode[], edges: GraphEdge[]): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];

  // Add nodes
  for (const node of nodes) {
    elements.push({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        domain: node.domain,
        category: node.category,
        organizationId: node.organization_id,
        organizationName: node.organization_name,
        organizationColor: node.organization_color,
        status: node.status,
        confidence: node.confidence,
      },
      classes: `${node.category} ${node.status} ${node.domain}`,
    });
  }

  // Add edges
  for (const edge of edges) {
    elements.push({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relation,
        relation: edge.relation,
        organizationId: edge.organization_id,
        organizationName: edge.organization_name,
        status: edge.status,
        confidence: edge.confidence,
      },
      classes: `${edge.relation} ${edge.status}`,
    });
  }

  return elements;
}
