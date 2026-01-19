/**
 * TeamDashboard - Admin Dashboard
 *
 * Shows team sources, review queue, and system controls.
 * Includes organization selector for switching between universities.
 */

import { ChevronRight, Loader2, ChevronDown } from "lucide-react";
import type { UserOrganization, OrganizationStats } from "@/hooks/useCurrentOrganization";

// =============================================================================
// TYPES
// =============================================================================

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
  // Organization selector
  organizations?: UserOrganization[];
  currentOrgId?: string;
  orgStats?: OrganizationStats | null;
  onSelectOrganization?: (orgId: string) => void;
  // Navigation
  onNavigateToReview: () => void;
  onNavigateToSources: () => void;
  onNavigateToIngestion?: () => void;
  onNavigateToHealth?: () => void;
  onNavigateToPolicy?: () => void;
  onNavigateToAgents?: () => void;
}

export function TeamDashboard({
  teamName,
  teamSlug,
  userRole,
  sources = [],
  sourcesLoading = false,
  organizations = [],
  currentOrgId,
  orgStats,
  onSelectOrganization,
  onNavigateToReview,
  onNavigateToSources,
  onNavigateToIngestion,
  onNavigateToHealth,
  onNavigateToPolicy,
  onNavigateToAgents,
}: TeamDashboardProps) {
  // Use real stats from Supabase if available, otherwise fallback
  const stats = {
    our_sources: orgStats?.our_sources ?? sources.length,
    our_pending_reviews: orgStats?.our_pending_reviews ?? 0,
    our_verified_entities: orgStats?.our_verified_entities ?? 0,
    our_contributors: orgStats?.our_contributors ?? 0,
    shared_total: orgStats?.shared_total ?? 0,
    shared_from_us: orgStats?.shared_from_us ?? 0,
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

  const currentOrg = organizations.find(o => o.org_id === currentOrgId);

  return (
    <div className="p-6 space-y-6">
      {/* Header with Organization Selector */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-100">{teamName}</h1>
            {/* Organization color indicator */}
            {currentOrg && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentOrg.org_color }}
              />
            )}
          </div>
          <p className="text-sm text-slate-400">Admin Dashboard · {userRole}</p>
        </div>

        {/* Organization Selector Dropdown */}
        {organizations.length > 1 && onSelectOrganization && (
          <div className="relative">
            <select
              value={currentOrgId}
              onChange={(e) => onSelectOrganization(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2 pr-10 cursor-pointer hover:border-slate-600 focus:outline-none focus:border-slate-500"
            >
              {organizations.map((org) => (
                <option key={org.org_id} value={org.org_id}>
                  {org.org_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.our_pending_reviews}</p>
          <p className="text-sm text-slate-400">Pending Review</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.our_verified_entities}</p>
          <p className="text-sm text-slate-400">Verified Entities</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.our_sources}</p>
          <p className="text-sm text-slate-400">Active Sources</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.our_contributors}</p>
          <p className="text-sm text-slate-400">Contributors</p>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
          <p className="text-2xl font-medium text-slate-100">{stats.shared_total}</p>
          <p className="text-sm text-slate-400">Shared Entities</p>
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
            <div className="text-center py-8">
              <p className="text-2xl font-medium text-amber-400">{stats.our_pending_reviews}</p>
              <p className="text-slate-400 text-sm mt-1">items need review</p>
            </div>
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
              <button
                onClick={onNavigateToSources}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                + Add a source
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {teamSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      source.status === 'active' ? 'bg-green-500' :
                      source.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm text-slate-200">{source.name}</p>
                      <p className="text-xs text-slate-500">
                        {source.type} · Last: {source.last_crawl}
                      </p>
                    </div>
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
        <div className="grid grid-cols-4 gap-4">
          {onNavigateToAgents && (
            <button
              onClick={onNavigateToAgents}
              className="p-4 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-sm font-medium text-slate-200">Agent Oversight</p>
              <p className="text-xs text-slate-500">Trust levels & proposals</p>
            </button>
          )}
          {onNavigateToIngestion && (
            <button
              onClick={onNavigateToIngestion}
              className="p-4 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-sm font-medium text-slate-200">Ingestion</p>
              <p className="text-xs text-slate-500">Crawl status & jobs</p>
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
