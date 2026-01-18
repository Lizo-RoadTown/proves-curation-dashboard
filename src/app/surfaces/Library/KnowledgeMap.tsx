/**
 * KnowledgeMap - Tile grid for navigating knowledge categories
 *
 * Categories are stable and intentionally few:
 * - Procedures: Ops runbooks, checklists
 * - Architecture: System/Software/Hardware design
 * - Interfaces: ICDs, ports, component links
 * - Decisions: ADRs, trade studies
 * - Lessons Learned: Post-mortems, gotchas
 */

import { FileText, Cpu, Link2, Lightbulb, AlertTriangle, Loader2 } from "lucide-react";

export interface KnowledgeTile {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  count: number;
  color: string;
  bgColor: string;
}

// Default tiles - these map to entity_type categories
export const DEFAULT_TILES: KnowledgeTile[] = [
  {
    id: "procedures",
    title: "Procedures",
    description: "Ops runbooks, checklists",
    icon: FileText,
    count: 0,
    color: "text-blue-600",
    bgColor: "bg-blue-500",
  },
  {
    id: "architecture",
    title: "Architecture",
    description: "System/Software/Hardware design",
    icon: Cpu,
    count: 0,
    color: "text-purple-600",
    bgColor: "bg-purple-500",
  },
  {
    id: "interfaces",
    title: "Interfaces",
    description: "ICDs, ports, component links",
    icon: Link2,
    count: 0,
    color: "text-green-600",
    bgColor: "bg-green-500",
  },
  {
    id: "decisions",
    title: "Decisions",
    description: "ADRs, trade studies",
    icon: Lightbulb,
    count: 0,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500",
  },
  {
    id: "lessons",
    title: "Lessons Learned",
    description: "Post-mortems, gotchas",
    icon: AlertTriangle,
    count: 0,
    color: "text-red-600",
    bgColor: "bg-red-500",
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <button
            key={tile.id}
            onClick={() => onSelectTile(tile.id)}
            className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className={`p-3 rounded-xl ${tile.bgColor} group-hover:scale-110 transition-transform`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{tile.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{tile.description}</p>
              <p className="text-sm font-medium text-gray-700 mt-2">
                {tile.count.toLocaleString()} items
              </p>
            </div>
          </button>
        );
      })}
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
    <div className="space-y-2">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const isSelected = selectedTile === tile.id;
        return (
          <button
            key={tile.id}
            onClick={() => onSelectTile(tile.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              isSelected
                ? "bg-blue-50 border border-blue-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${tile.bgColor}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">{tile.title}</span>
            </div>
            <span className="text-xs text-gray-500">{tile.count}</span>
          </button>
        );
      })}
    </div>
  );
}
