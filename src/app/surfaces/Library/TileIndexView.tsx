/**
 * TileIndexView - Curated list view when a Knowledge Map tile is selected
 *
 * Shows items within a category with tabs:
 * - Most Referenced: Items cited most often
 * - Most Recent: Recently updated/added
 * - Needs Review: Items flagged for review
 * - By Team: Grouped by owning team
 */

import { useState } from "react";
import {
  ChevronRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { KnowledgeTile } from "./KnowledgeMap";

export interface IndexEntity {
  id: string;
  name: string;
  type: string;
  domain: string;
  team?: string;
  referenceCount: number;
  updatedAt: string;
  needsReview?: boolean;
  sourceUrl?: string;
  excerpt?: string;
}

type SortTab = "referenced" | "recent" | "review" | "team";

interface TileIndexViewProps {
  tile: KnowledgeTile;
  entities: IndexEntity[];
  loading?: boolean;
  onBack: () => void;
  onSelectEntity?: (entity: IndexEntity) => void;
}

export function TileIndexView({
  tile,
  entities,
  loading = false,
  onBack,
  onSelectEntity,
}: TileIndexViewProps) {
  const [activeTab, setActiveTab] = useState<SortTab>("referenced");

  const Icon = tile.icon;

  // Sort entities based on active tab
  const sortedEntities = [...entities].sort((a, b) => {
    switch (activeTab) {
      case "referenced":
        return b.referenceCount - a.referenceCount;
      case "recent":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "review":
        // Needs review items first
        if (a.needsReview && !b.needsReview) return -1;
        if (!a.needsReview && b.needsReview) return 1;
        return 0;
      case "team":
        // Group by team
        return (a.team || "").localeCompare(b.team || "");
      default:
        return 0;
    }
  });

  // Group by team for team tab
  const groupedByTeam =
    activeTab === "team"
      ? sortedEntities.reduce((acc, entity) => {
          const team = entity.team || "Unassigned";
          if (!acc[team]) acc[team] = [];
          acc[team].push(entity);
          return acc;
        }, {} as Record<string, IndexEntity[]>)
      : null;

  const needsReviewCount = entities.filter((e) => e.needsReview).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Library
        </button>

        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${tile.bgColor}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tile.title}</h1>
            <p className="text-gray-600">{entities.length} items</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b bg-gray-50 flex gap-2">
        <TabButton
          active={activeTab === "referenced"}
          onClick={() => setActiveTab("referenced")}
          icon={TrendingUp}
          label="Most Referenced"
        />
        <TabButton
          active={activeTab === "recent"}
          onClick={() => setActiveTab("recent")}
          icon={Clock}
          label="Most Recent"
        />
        <TabButton
          active={activeTab === "review"}
          onClick={() => setActiveTab("review")}
          icon={AlertCircle}
          label="Needs Review"
          badge={needsReviewCount > 0 ? needsReviewCount : undefined}
        />
        <TabButton
          active={activeTab === "team"}
          onClick={() => setActiveTab("team")}
          icon={Users}
          label="By Team"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : activeTab === "team" && groupedByTeam ? (
          <TeamGroupedList
            groups={groupedByTeam}
            onSelectEntity={onSelectEntity}
          />
        ) : (
          <EntityList
            entities={sortedEntities}
            showReviewBadge={activeTab === "review"}
            onSelectEntity={onSelectEntity}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

function TabButton({ active, onClick, icon: Icon, label, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge !== undefined && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

interface EntityListProps {
  entities: IndexEntity[];
  showReviewBadge?: boolean;
  onSelectEntity?: (entity: IndexEntity) => void;
}

function EntityList({ entities, showReviewBadge, onSelectEntity }: EntityListProps) {
  if (entities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No items found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entities.map((entity) => (
        <EntityCard
          key={entity.id}
          entity={entity}
          showReviewBadge={showReviewBadge}
          onClick={() => onSelectEntity?.(entity)}
        />
      ))}
    </div>
  );
}

interface EntityCardProps {
  entity: IndexEntity;
  showReviewBadge?: boolean;
  onClick?: () => void;
}

function EntityCard({ entity, showReviewBadge, onClick }: EntityCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">{entity.name}</h3>
          {showReviewBadge && entity.needsReview && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              Needs Review
            </span>
          )}
        </div>
        {entity.excerpt && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entity.excerpt}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
          <span className="px-2 py-0.5 bg-gray-100 rounded">{entity.type}</span>
          <span>{entity.domain}</span>
          {entity.team && <span>• {entity.team}</span>}
          <span>{entity.referenceCount} references</span>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className="text-sm text-gray-400 whitespace-nowrap">
          {formatRelativeTime(entity.updatedAt)}
        </span>
        {entity.sourceUrl && (
          <a
            href={entity.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

interface TeamGroupedListProps {
  groups: Record<string, IndexEntity[]>;
  onSelectEntity?: (entity: IndexEntity) => void;
}

function TeamGroupedList({ groups, onSelectEntity }: TeamGroupedListProps) {
  const teamNames = Object.keys(groups).sort();

  if (teamNames.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No items found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {teamNames.map((team) => (
        <div key={team}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {team}
            <span className="text-gray-400 font-normal">({groups[team].length})</span>
          </h3>
          <div className="space-y-2">
            {groups[team].map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onClick={() => onSelectEntity?.(entity)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
