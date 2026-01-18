/**
 * TeamDashboard - Admin Dashboard
 *
 * Shows team sources, review queue, and system controls.
 */

import { ChevronRight, Loader2 } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface TeamStats {
  our_sources: number;
  our_pending_reviews: number;
  our_verified_this_week: number;
  our_total_contributed: number;
  our_contributors: number;
}

interface TeamSource {
  id: string;
  name: string;
  type: "github" | "notion" | "gdrive" | "discord";
  status: "active" | "paused" | "error";
  last_crawl: string;
  entities_found: number;
  pending_reviews: number;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface TeamDashboardProps {
  teamName: string;
  teamSlug: string;
  userRole: string;
  sources?: any[];
  sourcesLoading?: boolean;
  onNavigateToReview: () => void;
  onNavigateToSources: () => void;
  onNavigateToIngestion?: () => void;
  onNavigateToHealth?: () => void;
  onNavigateToPolicy?: () => void;
}

export function TeamDashboard({
  teamName,
  teamSlug,
  userRole,
  sources = [],
  sourcesLoading = false,
  onNavigateToReview,
  onNavigateToSources,
  onNavigateToIngestion,
  onNavigateToHealth,
  onNavigateToPolicy,
}: TeamDashboardProps) {
  const stats: TeamStats = {
    our_sources: sources.length,
    our_pending_reviews: 0,
    our_verified_this_week: 0,
    our_total_contributed: 0,
    our_contributors: 8,
  };

  const teamSources: TeamSource[] = sources.map((s: any) => ({
    id: s.id,
    name: s.name,
    type: s.source_type?.includes('github') ? 'github' :
          s.source_type?.includes('notion') ? 'notion' :
          s.source_type?.includes('discord') ? 'discord' : 'github',
    status: s.is_active ? 'active' : 'paused',
    last_crawl: s.last_crawl_at ? formatRelativeTime(s.last_crawl_at) : 'Never',
    entities_found: s.item_count || 0,
    pending_reviews: 0,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">{teamName}</h1>
        <p className="text-sm text-slate-400">Admin Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.our_pending_reviews}</p>
          <p className="text-sm text-slate-400">Pending Review</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.our_verified_this_week}</p>
          <p className="text-sm text-slate-400">Verified This Week</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.our_sources}</p>
          <p className="text-sm text-slate-400">Active Sources</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.our_total_contributed}</p>
          <p className="text-sm text-slate-400">Total Contributed</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Review Queue */}
        <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-200">Review Queue</h2>
            <button
              onClick={onNavigateToReview}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {stats.our_pending_reviews === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No pending items</p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Queue items will appear here</p>
          )}
        </div>

        {/* Sources */}
        <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-200">Connected Sources</h2>
            <button
              onClick={onNavigateToSources}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              Manage <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {sourcesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            </div>
          ) : teamSources.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No sources connected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded"
                >
                  <div>
                    <p className="text-sm text-slate-200">{source.name}</p>
                    <p className="text-xs text-slate-500">
                      {source.type} · Last: {source.last_crawl}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {source.entities_found} items
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Tools */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
        <h2 className="text-sm font-medium text-slate-200 mb-4">System Controls</h2>
        <div className="grid grid-cols-3 gap-4">
          {onNavigateToIngestion && (
            <button
              onClick={onNavigateToIngestion}
              className="p-4 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-sm font-medium text-slate-200">Ingestion</p>
              <p className="text-xs text-slate-500">Crawl status</p>
            </button>
          )}
          {onNavigateToHealth && (
            <button
              onClick={onNavigateToHealth}
              className="p-4 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-sm font-medium text-slate-200">Index Health</p>
              <p className="text-xs text-slate-500">Coverage & drift</p>
            </button>
          )}
          {onNavigateToPolicy && (
            <button
              onClick={onNavigateToPolicy}
              className="p-4 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-sm font-medium text-slate-200">Policy</p>
              <p className="text-xs text-slate-500">Auto-approval rules</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
