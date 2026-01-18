/**
 * LibraryView - Main Library surface with search + Knowledge Map
 *
 * Layout:
 * - Search bar (always prominent)
 * - Facet filters (Mission, Team, Domain, Artifact type)
 * - Knowledge Map tiles (few, stable categories)
 * - TileIndexView when a tile is selected
 */

import { useState, useCallback } from "react";
import { SearchBar } from "./SearchBar";
import { Facets, type FacetFilters } from "./Facets";
import { KnowledgeMap, DEFAULT_TILES } from "./KnowledgeMap";
import { TileIndexView, type IndexEntity } from "./TileIndexView";
import { useLibrary } from "@/hooks/useLibrary";
import { Loader2, Search, AlertCircle } from "lucide-react";

export function LibraryView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [filters, setFilters] = useState<FacetFilters>({
    mission: "all",
    team: "all",
    domain: "all",
    artifactType: "all",
  });

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
