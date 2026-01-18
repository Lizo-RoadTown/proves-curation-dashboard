/**
 * useLibrary - Hook for searching and browsing the collective library
 *
 * Provides:
 * - Search across core_entities
 * - Tile counts by category
 * - Filtered entity lists
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_TILES, type KnowledgeTile } from '../app/surfaces/Library/KnowledgeMap';
import type { IndexEntity } from '../app/surfaces/Library/TileIndexView';
import type { FacetFilters } from '../app/surfaces/Library/Facets';

// =============================================================================
// TYPES
// =============================================================================

interface UseLibraryResult {
  // Data
  tiles: KnowledgeTile[];
  searchResults: IndexEntity[];
  tileEntities: IndexEntity[];

  // Loading states
  loading: boolean;
  searchLoading: boolean;
  error: string | null;

  // Actions
  search: (query: string, filters?: FacetFilters) => Promise<void>;
  loadTileEntities: (tileId: string, filters?: FacetFilters) => Promise<void>;
  refreshTileCounts: () => Promise<void>;
}

// Map tile IDs to entity_type values in the database
const TILE_TO_ENTITY_TYPES: Record<string, string[]> = {
  procedures: ['procedure', 'checklist', 'runbook', 'guide'],
  architecture: ['architecture', 'design', 'component', 'system'],
  interfaces: ['interface', 'icd', 'port', 'protocol'],
  decisions: ['decision', 'adr', 'trade_study', 'rationale'],
  lessons: ['lesson', 'post_mortem', 'gotcha', 'retrospective'],
};

// =============================================================================
// HOOK
// =============================================================================

export function useLibrary(): UseLibraryResult {
  const [tiles, setTiles] = useState<KnowledgeTile[]>(
    DEFAULT_TILES.map((t) => ({ ...t, count: 0 }))
  );
  const [searchResults, setSearchResults] = useState<IndexEntity[]>([]);
  const [tileEntities, setTileEntities] = useState<IndexEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh tile counts from database
   */
  const refreshTileCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get counts for each tile category
      const updatedTiles = await Promise.all(
        DEFAULT_TILES.map(async (tile) => {
          const entityTypes = TILE_TO_ENTITY_TYPES[tile.id] || [];

          const { count, error: countError } = await supabase
            .from('core_entities')
            .select('*', { count: 'exact', head: true })
            .in('entity_type', entityTypes);

          if (countError) {
            console.error(`Error counting ${tile.id}:`, countError);
          }

          return {
            ...tile,
            count: count || 0,
          };
        })
      );

      setTiles(updatedTiles);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load library';
      setError(message);
      console.error('Error loading library:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search the library
   */
  const search = useCallback(async (query: string, filters?: FacetFilters) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);

      let queryBuilder = supabase
        .from('core_entities')
        .select('id, name, entity_type, extracted_content, source_url, updated_at')
        .textSearch('name', query, { type: 'websearch' })
        .limit(50);

      // Apply filters
      if (filters?.domain && filters.domain !== 'all') {
        queryBuilder = queryBuilder.eq('domain', filters.domain);
      }

      const { data, error: searchError } = await queryBuilder;

      if (searchError) throw searchError;

      const results: IndexEntity[] = (data || []).map((entity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.entity_type,
        domain: 'general', // Would come from entity metadata
        referenceCount: 0, // Would need relationship count
        updatedAt: entity.updated_at,
        sourceUrl: entity.source_url,
        excerpt: entity.extracted_content?.slice(0, 200),
      }));

      setSearchResults(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  /**
   * Load entities for a specific tile
   */
  const loadTileEntities = useCallback(async (tileId: string, filters?: FacetFilters) => {
    try {
      setLoading(true);
      setError(null);

      const entityTypes = TILE_TO_ENTITY_TYPES[tileId] || [];

      let queryBuilder = supabase
        .from('core_entities')
        .select('id, name, entity_type, extracted_content, source_url, updated_at')
        .in('entity_type', entityTypes)
        .order('updated_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters?.domain && filters.domain !== 'all') {
        queryBuilder = queryBuilder.eq('domain', filters.domain);
      }

      const { data, error: loadError } = await queryBuilder;

      if (loadError) throw loadError;

      const entities: IndexEntity[] = (data || []).map((entity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.entity_type,
        domain: 'general',
        referenceCount: Math.floor(Math.random() * 20), // Mock - would need relationship count
        updatedAt: entity.updated_at,
        sourceUrl: entity.source_url,
        excerpt: entity.extracted_content?.slice(0, 200),
        needsReview: Math.random() > 0.8, // Mock - would come from review status
      }));

      setTileEntities(entities);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load entities';
      setError(message);
      console.error('Error loading tile entities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tile counts on mount
  useEffect(() => {
    refreshTileCounts();
  }, [refreshTileCounts]);

  return {
    tiles,
    searchResults,
    tileEntities,
    loading,
    searchLoading,
    error,
    search,
    loadTileEntities,
    refreshTileCounts,
  };
}
