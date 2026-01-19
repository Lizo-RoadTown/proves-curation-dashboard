/**
 * LibraryView - Library Interface
 *
 * Layout:
 * - Search bar
 * - Facet filters
 * - Knowledge Map tiles
 * - Stats summary
 *
 * Note: 3D Knowledge Graph is in Mission Control, not here.
 */

import { useState, useCallback, useEffect } from "react";
import { SearchBar } from "./SearchBar";
import { Facets, type FacetFilters } from "./Facets";
import { KnowledgeMap, DEFAULT_TILES } from "./KnowledgeMap";
import { TileIndexView, type IndexEntity } from "./TileIndexView";
import { useLibrary } from "@/hooks/useLibrary";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

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
    <div className="h-full flex flex-col bg-[#0f172a]">
      {/* Header */}
      <div className="p-6 border-b border-[#334155]">
        <h1 className="text-xl font-semibold text-[#e2e8f0] mb-1">Knowledge Library</h1>
        <p className="text-sm text-[#94a3b8] mb-4">
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
      <div className="px-6 py-3 border-b border-[#334155] bg-[#1e293b]/30">
        <Facets filters={filters} onChange={setFilters} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-[#1e293b] border border-[#334155] rounded text-[#94a3b8] text-sm">
            {error}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-[#94a3b8]">Search Results</h2>
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-[#64748b]" />}
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => handleSelectEntity(entity)}
                    className="p-3 bg-[#1e293b]/50 border border-[#334155] rounded hover:border-[#475569] cursor-pointer transition-colors"
                  >
                    <h3 className="text-sm font-medium text-[#e2e8f0]">{entity.name}</h3>
                    {entity.excerpt && (
                      <p className="text-sm text-[#64748b] mt-1 line-clamp-2">
                        {entity.excerpt}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-[#64748b]">
                      <span>{entity.type}</span>
                      <span>{entity.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : !searchLoading ? (
              <p className="text-sm text-[#64748b]">No results for "{searchQuery}"</p>
            ) : null}
          </div>
        )}

        {/* Knowledge Graph Health - Cockpit Style Gauges */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Entity Count Gauge */}
          <div className="p-6 bg-[#1e293b]/50 border border-[#334155] rounded flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <RadialBarChart
                width={96}
                height={96}
                cx={48}
                cy={48}
                innerRadius={32}
                outerRadius={46}
                startAngle={90}
                endAngle={-270}
                data={[{ value: 80, fill: "#06b6d4" }]}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-cyan-400">{stats?.totalEntities || 0}</span>
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-[#e2e8f0]">Entities</p>
              <p className="text-sm text-[#64748b] mt-1">Verified knowledge</p>
            </div>
          </div>

          {/* Connections Gauge */}
          <div className="p-6 bg-[#1e293b]/50 border border-[#334155] rounded flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <RadialBarChart
                width={96}
                height={96}
                cx={48}
                cy={48}
                innerRadius={32}
                outerRadius={46}
                startAngle={90}
                endAngle={-270}
                data={[{ value: Math.min((stats?.totalEdges || 0) / Math.max(stats?.totalEntities || 1, 1) * 50, 100), fill: "#8b5cf6" }]}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-purple-400">{stats?.totalEdges || 0}</span>
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-[#e2e8f0]">Connections</p>
              <p className="text-sm text-[#64748b] mt-1">
                {stats?.totalEntities ? ((stats?.totalEdges || 0) / stats.totalEntities).toFixed(1) : 0} avg/entity
              </p>
            </div>
          </div>

          {/* Teams Gauge */}
          <div className="p-6 bg-[#1e293b]/50 border border-[#334155] rounded flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <RadialBarChart
                width={96}
                height={96}
                cx={48}
                cy={48}
                innerRadius={32}
                outerRadius={46}
                startAngle={90}
                endAngle={-270}
                data={[{ value: Math.min((stats?.byOrg.length || 0) * 20, 100), fill: "#22c55e" }]}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-green-400">{stats?.byOrg.length || 0}</span>
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-[#e2e8f0]">Teams</p>
              <p className="text-sm text-[#64748b] mt-1">Contributing</p>
            </div>
          </div>
        </div>

        {/* Knowledge Map */}
        <div className="flex-1">
          <h2 className="text-base font-medium text-[#94a3b8] mb-6">Browse by Category</h2>
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
