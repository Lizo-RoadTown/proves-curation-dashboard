/**
 * LibraryView - Library Interface
 *
 * Layout:
 * - Search bar
 * - Facet filters
 * - 3D Knowledge Graph visualization
 * - Knowledge Map tiles
 */

import { useState, useCallback, useEffect } from "react";
import { SearchBar } from "./SearchBar";
import { Facets, type FacetFilters } from "./Facets";
import { KnowledgeMap, DEFAULT_TILES } from "./KnowledgeMap";
import { TileIndexView, type IndexEntity } from "./TileIndexView";
import { Graph3D } from "@/app/components/Graph3D";
import { useLibrary } from "@/hooks/useLibrary";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// Stats types
interface DomainStats {
  domain: string;
  count: number;
}

interface OrgStats {
  name: string;
  color: string;
  count: number;
}

interface LibraryStats {
  totalEntities: number;
  totalEdges: number;
  byDomain: DomainStats[];
  byOrg: OrgStats[];
}

export function LibraryView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [filters, setFilters] = useState<FacetFilters>({
    mission: "all",
    team: "all",
    domain: "all",
    artifactType: "all",
  });
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const {
    tiles,
    searchResults,
    tileEntities,
    loading,
    searchLoading,
    error,
    search,
    loadTileEntities,
  } = useLibrary();

  // Load library statistics
  useEffect(() => {
    async function loadStats() {
      try {
        const { data: domainData } = await supabase
          .from('core_entities')
          .select('attributes')
          .not('attributes', 'is', null);

        const { data: orgData } = await supabase
          .from('core_entities')
          .select(`
            id,
            contributed_by_org_id,
            organizations!core_entities_contributed_by_org_id_fkey (
              name,
              primary_color
            )
          `);

        const { count: edgeCount } = await supabase
          .from('core_equivalences')
          .select('*', { count: 'exact', head: true });

        const domainCounts: Record<string, number> = {};
        (domainData || []).forEach((e: any) => {
          const domain = e.attributes?.domain || 'unknown';
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        });

        const orgCounts: Record<string, { name: string; color: string; count: number }> = {};
        (orgData || []).forEach((e: any) => {
          const org = e.organizations;
          if (org) {
            const key = org.name;
            if (!orgCounts[key]) {
              orgCounts[key] = { name: org.name, color: org.primary_color || '#64748b', count: 0 };
            }
            orgCounts[key].count++;
          }
        });

        setStats({
          totalEntities: orgData?.length || 0,
          totalEdges: edgeCount || 0,
          byDomain: Object.entries(domainCounts)
            .map(([domain, count]) => ({ domain, count }))
            .sort((a, b) => b.count - a.count),
          byOrg: Object.values(orgCounts).sort((a, b) => b.count - a.count),
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      await search(query, filters);
    },
    [search, filters]
  );

  const handleSelectTile = useCallback(
    async (tileId: string) => {
      setSelectedTile(tileId);
      await loadTileEntities(tileId, filters);
    },
    [loadTileEntities, filters]
  );

  const handleSelectEntity = useCallback((entity: IndexEntity) => {
    if (entity.sourceUrl) {
      window.open(entity.sourceUrl, "_blank");
    }
  }, []);

  // Show TileIndexView when a tile is selected
  if (selectedTile) {
    const tile = tiles.find((t) => t.id === selectedTile) || DEFAULT_TILES.find((t) => t.id === selectedTile);
    if (tile) {
      return (
        <TileIndexView
          tile={tile}
          entities={tileEntities}
          loading={loading}
          onBack={() => setSelectedTile(null)}
          onSelectEntity={handleSelectEntity}
        />
      );
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-semibold text-slate-100 mb-1">Knowledge Library</h1>
        <p className="text-sm text-slate-400 mb-4">
          Search and explore the collective knowledge base
        </p>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search procedures, architecture, interfaces..."
        />
      </div>

      {/* Facets */}
      <div className="px-6 py-3 border-b border-slate-700 bg-slate-800/30">
        <Facets filters={filters} onChange={setFilters} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm">
            {error}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-slate-300">Search Results</h2>
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => handleSelectEntity(entity)}
                    className="p-3 bg-slate-800/50 border border-slate-700 rounded hover:border-slate-600 cursor-pointer transition-colors"
                  >
                    <h3 className="text-sm font-medium text-slate-200">{entity.name}</h3>
                    {entity.excerpt && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {entity.excerpt}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-slate-500">
                      <span>{entity.type}</span>
                      <span>{entity.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : !searchLoading ? (
              <p className="text-sm text-slate-500">No results for "{searchQuery}"</p>
            ) : null}
          </div>
        )}

        {/* Knowledge Graph Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Knowledge Graph</h2>

          {/* Stats Summary */}
          <div className="flex items-center gap-6 mb-4 text-sm">
            <span className="text-slate-400">
              <span className="text-slate-200 font-medium">{stats?.totalEntities || 0}</span> entities
            </span>
            <span className="text-slate-400">
              <span className="text-slate-200 font-medium">{stats?.totalEdges || 0}</span> connections
            </span>
            <span className="text-slate-400">
              <span className="text-slate-200 font-medium">{stats?.byOrg.length || 0}</span> teams
            </span>
          </div>

          {/* 3D Graph */}
          <div className="bg-slate-800/50 border border-slate-700 rounded overflow-hidden mb-6">
            <Graph3D />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* By Domain */}
            <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">By Domain</h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {stats?.byDomain.map((d) => (
                    <div key={d.domain} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{d.domain}</span>
                      <span className="text-slate-200">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contributing Teams */}
            <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Contributing Teams</h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {stats?.byOrg.map((org) => (
                    <div key={org.name} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{org.name}</span>
                      <span className="text-slate-200">{org.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Knowledge Map */}
        <div>
          <h2 className="text-sm font-medium text-slate-300 mb-4">Browse by Category</h2>
          <KnowledgeMap
            tiles={tiles}
            onSelectTile={handleSelectTile}
            loading={loading && !searchQuery}
          />
        </div>
      </div>
    </div>
  );
}
