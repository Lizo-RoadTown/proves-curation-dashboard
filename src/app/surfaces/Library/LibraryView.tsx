/**
 * LibraryView - Main Library surface with search + Knowledge Map
 *
 * Layout:
 * - Search bar (always prominent)
 * - Facet filters (Mission, Team, Domain, Artifact type)
 * - Knowledge Map tiles (few, stable categories)
 * - TileIndexView when a tile is selected
 */

import { useState, useCallback, useEffect } from "react";
import { SearchBar } from "./SearchBar";
import { Facets, type FacetFilters } from "./Facets";
import { KnowledgeMap, DEFAULT_TILES } from "./KnowledgeMap";
import { TileIndexView, type IndexEntity } from "./TileIndexView";
import { Graph3D } from "@/app/components/Graph3D";
import { useLibrary } from "@/hooks/useLibrary";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, AlertCircle, Network, Users, Layers, BookOpen, Lightbulb } from "lucide-react";

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
        // Get entity counts by domain
        const { data: domainData } = await supabase
          .from('core_entities')
          .select('attributes')
          .not('attributes', 'is', null);

        // Get entity counts by organization
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

        // Get total edges
        const { count: edgeCount } = await supabase
          .from('core_equivalences')
          .select('*', { count: 'exact', head: true });

        // Process domain stats
        const domainCounts: Record<string, number> = {};
        (domainData || []).forEach((e: any) => {
          const domain = e.attributes?.domain || 'unknown';
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        });

        // Process org stats
        const orgCounts: Record<string, { name: string; color: string; count: number }> = {};
        (orgData || []).forEach((e: any) => {
          const org = e.organizations;
          if (org) {
            const key = org.name;
            if (!orgCounts[key]) {
              orgCounts[key] = { name: org.name, color: org.primary_color || '#3b82f6', count: 0 };
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

  /**
   * Handle search
   */
  const handleSearch = useCallback(
    async (query: string) => {
      await search(query, filters);
    },
    [search, filters]
  );

  /**
   * Handle tile selection
   */
  const handleSelectTile = useCallback(
    async (tileId: string) => {
      setSelectedTile(tileId);
      await loadTileEntities(tileId, filters);
    },
    [loadTileEntities, filters]
  );

  /**
   * Handle entity selection (could open detail view)
   */
  const handleSelectEntity = useCallback((entity: IndexEntity) => {
    // For now, open source URL if available
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Library</h1>
        <p className="text-gray-600 mb-6">
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
      <div className="px-6 py-4 border-b bg-gray-50">
        <Facets filters={filters} onChange={setFilters} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Results
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </h2>

            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => handleSelectEntity(entity)}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{entity.name}</h3>
                    {entity.excerpt && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {entity.excerpt}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2 text-sm text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {entity.type}
                      </span>
                      <span>{entity.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : !searchLoading ? (
              <p className="text-gray-500">No results found for "{searchQuery}"</p>
            ) : null}
          </div>
        )}

        {/* ================================================================== */}
        {/* SHARED COMMUNITY KNOWLEDGE - Full Section */}
        {/* ================================================================== */}
        <div className="mb-8">
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Network className="w-6 h-6 text-blue-600" />
              Shared Community Knowledge
            </h2>
            <p className="text-gray-600 mt-1">
              All verified knowledge from all teams is accessible to you. Your team's contributions are highlighted in the graph.
            </p>
          </div>

          {/* 3D Graph */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
            <Graph3D />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* By Domain */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                By Domain
              </h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {stats?.byDomain.map((d) => (
                    <div key={d.domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 capitalize">{d.domain}</span>
                      <span className="text-lg font-bold text-gray-900">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contributing Teams */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Contributing Teams
              </h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  {stats?.byOrg.map((org) => (
                    <div key={org.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: org.color }}
                        />
                        <span className="text-sm text-gray-700">{org.name}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{org.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* How the Knowledge Graph Works */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              How the Knowledge Graph Works
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Each <strong>node</strong> represents a component, system, or procedure.{" "}
              <strong>Edges</strong> represent knowledge couplings — how things connect, depend on, or flow to each other.
              Edge thickness shows coupling strength. Your team's contributions are highlighted with their organization color.
            </p>
            <p className="text-sm text-gray-700 mt-3 leading-relaxed">
              <em>This is the collective brain.</em> The more teams contribute, the more complete our shared understanding becomes.
            </p>
          </div>

          {/* Want to contribute more? */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-green-600" />
              Want to contribute more?
            </h3>
            <p className="text-sm text-gray-700">
              Add more sources in the <strong>Admin</strong> view. Your verified extractions automatically flow to the
              shared library and appear in the graph as new nodes and edges.
            </p>
          </div>
        </div>

        {/* Knowledge Map */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Knowledge Map
          </h2>
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
