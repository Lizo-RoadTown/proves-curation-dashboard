/**
 * KnowledgeMap - Mission Control tile grid for knowledge categories
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
  borderColor?: string;
}

// Default tiles - these map to entity_type categories
export const DEFAULT_TILES: KnowledgeTile[] = [
  {
    id: "procedures",
    title: "Procedures",
    description: "Ops runbooks, checklists",
    icon: FileText,
    count: 0,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    id: "architecture",
    title: "Architecture",
    description: "System/Software/Hardware design",
    icon: Cpu,
    count: 0,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: "interfaces",
    title: "Interfaces",
    description: "ICDs, ports, component links",
    icon: Link2,
    count: 0,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
  },
  {
    id: "decisions",
    title: "Decisions",
    description: "ADRs, trade studies",
    icon: Lightbulb,
    count: 0,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    id: "lessons",
    title: "Lessons Learned",
    description: "Post-mortems, gotchas",
    icon: AlertTriangle,
    count: 0,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/30",
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
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
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
            className={`flex items-start gap-4 p-5 bg-slate-800/50 border ${tile.borderColor || 'border-slate-700'} rounded hover:bg-slate-800/80 hover:border-blue-500/50 transition-all text-left group`}
          >
            <div className={`p-3 rounded ${tile.bgColor} border ${tile.borderColor || 'border-slate-700'} group-hover:scale-110 transition-transform`}>
              <Icon className={`w-6 h-6 ${tile.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-100">{tile.title}</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono uppercase">{tile.description}</p>
              <p className="text-sm font-mono font-medium text-slate-300 mt-2">
                {tile.count.toLocaleString()} <span className="text-slate-500">items</span>
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
              isSelected
                ? "bg-blue-500/20 border border-blue-500/50"
                : "hover:bg-slate-800 border border-transparent"
            }`}
          >
            <div className={`p-1.5 rounded ${tile.bgColor} border ${tile.borderColor || 'border-slate-700'}`}>
              <Icon className={`w-4 h-4 ${tile.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-200">{tile.title}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">{tile.count}</span>
          </button>
        );
      })}
    </div>
  );
}
