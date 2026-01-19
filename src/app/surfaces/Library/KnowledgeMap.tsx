/**
 * KnowledgeMap - Tile grid for knowledge categories
 *
 * Categories:
 * - Procedures: Ops runbooks, checklists
 * - Architecture: System/Software/Hardware design
 * - Interfaces: ICDs, ports, component links
 * - Decisions: ADRs, trade studies
 * - Lessons Learned: Post-mortems, gotchas
 */

import { Loader2 } from "lucide-react";

export interface KnowledgeTile {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  count: number;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

// Default tiles - these map to entity_type categories
export const DEFAULT_TILES: KnowledgeTile[] = [
  {
    id: "procedures",
    title: "Procedures",
    description: "Ops runbooks, checklists",
    count: 0,
  },
  {
    id: "architecture",
    title: "Architecture",
    description: "System/Software/Hardware design",
    count: 0,
  },
  {
    id: "interfaces",
    title: "Interfaces",
    description: "ICDs, ports, component links",
    count: 0,
  },
  {
    id: "decisions",
    title: "Decisions",
    description: "ADRs, trade studies",
    count: 0,
  },
  {
    id: "lessons",
    title: "Lessons Learned",
    description: "Post-mortems, gotchas",
    count: 0,
  },
];

interface KnowledgeMapProps {
  tiles: KnowledgeTile[];
  onSelectTile: (tileId: string) => void;
  loading?: boolean;
}

export function KnowledgeMap({ tiles, onSelectTile, loading = false }: KnowledgeMapProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          onClick={() => onSelectTile(tile.id)}
          className="p-6 bg-slate-800/50 border border-slate-700 rounded hover:bg-slate-800 hover:border-slate-600 transition-colors text-left min-h-[140px] flex flex-col"
        >
          <h3 className="text-base font-medium text-slate-200">{tile.title}</h3>
          <p className="text-sm text-slate-500 mt-2 flex-1">{tile.description}</p>
          <p className="text-lg text-slate-300 mt-4">
            {tile.count.toLocaleString()} <span className="text-sm text-slate-500">items</span>
          </p>
        </button>
      ))}
    </div>
  );
}

/**
 * Compact version for sidebar or smaller displays
 */
export function KnowledgeMapCompact({
  tiles,
  onSelectTile,
  selectedTile,
}: {
  tiles: KnowledgeTile[];
  onSelectTile: (tileId: string) => void;
  selectedTile?: string;
}) {
  return (
    <div className="space-y-1">
      {tiles.map((tile) => {
        const isSelected = selectedTile === tile.id;
        return (
          <button
            key={tile.id}
            onClick={() => onSelectTile(tile.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded text-left text-sm transition-colors ${
              isSelected
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <span>{tile.title}</span>
            <span className="text-slate-500">{tile.count}</span>
          </button>
        );
      })}
    </div>
  );
}
