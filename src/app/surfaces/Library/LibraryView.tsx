/**
 * LibraryView - Mission Control Library Interface
 *
 * Layout:
 * - Search bar (always prominent)
 * - Facet filters (Mission, Team, Domain, Artifact type)
 * - 3D Knowledge Graph visualization
 * - Knowledge Map tiles (few, stable categories)
 *
 * Dark theme with mission control aesthetic.
 */

import { useState, useCallback, useEffect } from "react";
import { SearchBar } from "./SearchBar";
import { Facets, type FacetFilters } from "./Facets";
import { KnowledgeMap, DEFAULT_TILES } from "./KnowledgeMap";
import { TileIndexView, type IndexEntity } from "./TileIndexView";
import { Graph3D } from "@/app/components/Graph3D";
import { useLibrary } from "@/hooks/useLibrary";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Search,
  AlertCircle,
  Network,
  Users,
  Layers,
  BookOpen,
  Lightbulb,
  Database,
  GitBranch,
} from "lucide-react";

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
      <div className="p-6 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Knowledge Library</h1>
        </div>
        <p className="text-slate-400 mb-6">
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
      <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
        <Facets filters={filters} onChange={setFilters} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-3 text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400" />
            {error}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Search className="w-4 h-4 text-blue-400" />
              Search Results
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            </h2>

            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => handleSelectEntity(entity)}
                    className="p-4 bg-slate-800/50 border border-slate-700 rounded hover:border-blue-500/50 cursor-pointer transition-all"
                  >
                    <h3 className="font-medium text-slate-200">{entity.name}</h3>
                    {entity.excerpt && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                        {entity.excerpt}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2 text-sm">
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded font-mono text-xs uppercase">
                        {entity.type}
                      </span>
                      <span className="text-slate-500">{entity.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : !searchLoading ? (
              <p className="text-slate-500 font-mono text-sm">NO RESULTS FOR "{searchQuery.toUpperCase()}"</p>
            ) : null}
          </div>
        )}

        {/* ================================================================== */}
        {/* SHARED COMMUNITY KNOWLEDGE - Full Section */}
        {/* ================================================================== */}
        <div className="mb-8">
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
              <Network className="w-5 h-5 text-blue-400" />
              Shared Community Knowledge
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              All verified knowledge from all teams. Your team's contributions are highlighted in the graph.
            </p>
          </div>

          {/* Stats Summary Bar */}
          <div className="flex items-center gap-6 mb-6 p-4 bg-slate-800/30 border border-slate-700 rounded">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-2xl font-mono font-bold text-slate-100">{stats?.totalEntities || 0}</span>
              <span className="text-xs text-slate-500 uppercase">Entities</span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span className="text-2xl font-mono font-bold text-slate-100">{stats?.totalEdges || 0}</span>
              <span className="text-xs text-slate-500 uppercase">Edges</span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-mono font-bold text-slate-100">{stats?.byOrg.length || 0}</span>
              <span className="text-xs text-slate-500 uppercase">Teams</span>
            </div>
          </div>

          {/* 3D Graph */}
          <div className="bg-slate-800/50 border border-slate-700 rounded overflow-hidden mb-6">
            <Graph3D />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* By Domain */}
            <div className="bg-slate-800/50 border border-slate-700 rounded p-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Layers className="w-4 h-4 text-purple-400" />
                By Domain
              </h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {stats?.byDomain.map((d) => (
                    <div key={d.domain} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded">
                      <span className="text-sm text-slate-300 uppercase font-mono">{d.domain}</span>
                      <span className="text-lg font-mono font-bold text-slate-100">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contributing Teams */}
            <div className="bg-slate-800/50 border border-slate-700 rounded p-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Users className="w-4 h-4 text-emerald-400" />
                Contributing Teams
              </h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {stats?.byOrg.map((org) => (
                    <div key={org.name} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-[0_0_6px]"
                          style={{ backgroundColor: org.color, boxShadow: `0 0 6px ${org.color}50` }}
                        />
                        <span className="text-sm text-slate-300">{org.name}</span>
                      </div>
                      <span className="text-lg font-mono font-bold text-slate-100">{org.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* How the Knowledge Graph Works */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <BookOpen className="w-4 h-4 text-blue-400" />
              How the Knowledge Graph Works
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Each <span className="text-blue-300 font-medium">node</span> represents a component, system, or procedure.{" "}
              <span className="text-purple-300 font-medium">Edges</span> represent knowledge couplings — how things connect, depend on, or flow to each other.
              Edge thickness shows coupling strength. Team contributions are highlighted with their organization color.
            </p>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed font-mono text-xs">
              THE COLLECTIVE BRAIN — MORE TEAMS = MORE COMPLETE UNDERSTANDING
            </p>
          </div>

          {/* Want to contribute more? */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              Contribute More
            </h3>
            <p className="text-sm text-slate-300">
              Add more sources in the <span className="text-emerald-300 font-medium">Admin</span> view.
              Verified extractions automatically flow to the shared library and appear in the graph.
            </p>
          </div>
        </div>

        {/* Knowledge Map */}
        <div>
          <h2 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wide">
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
