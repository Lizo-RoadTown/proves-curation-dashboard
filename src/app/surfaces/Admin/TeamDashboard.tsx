/**
 * TeamDashboard - Admin Dashboard
 *
 * Shows team sources, review queue, and system controls.
 * Includes organization selector for switching between universities.
 */

import { ChevronRight, Loader2, ChevronDown } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
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
  onNavigateToPolicy?: () => void;
  onNavigateToAgents?: () => void;
  onNavigateToDiscovery?: () => void;
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
  onNavigateToPolicy,
  onNavigateToAgents,
  onNavigateToDiscovery,
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
    <div className="p-6 space-y-6 flex-1 flex flex-col">
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

      {/* Review Health - Main Focus */}
      <div className="grid grid-cols-3 gap-6">
        {/* Review Queue Gauge */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded flex flex-col items-center">
          <div className="relative w-36 h-36">
            <RadialBarChart
              width={144}
              height={144}
              cx={72}
              cy={72}
              innerRadius={50}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              data={[{ value: Math.min(stats.our_pending_reviews * 10, 100), fill: stats.our_pending_reviews > 0 ? "#f59e0b" : "#22c55e" }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={10} />
            </RadialBarChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${stats.our_pending_reviews > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                {stats.our_pending_reviews}
              </span>
              <span className="text-xs text-slate-500">pending</span>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-2">Review Queue</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.our_pending_reviews === 0 ? "All clear" : "Items awaiting review"}
          </p>
        </div>

        {/* Verified vs Total - Completion Ring */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded flex flex-col items-center">
          <div className="relative w-36 h-36">
            <RadialBarChart
              width={144}
              height={144}
              cx={72}
              cy={72}
              innerRadius={50}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              data={[{ value: stats.our_verified_entities > 0 ? Math.min((stats.our_verified_entities / Math.max(stats.our_verified_entities + stats.our_pending_reviews, 1)) * 100, 100) : 0, fill: "#06b6d4" }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={10} />
            </RadialBarChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-cyan-400">{stats.our_verified_entities}</span>
              <span className="text-xs text-slate-500">verified</span>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-2">Knowledge Base</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.shared_from_us} shared to collective
          </p>
        </div>

        {/* Pipeline Health */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded flex flex-col items-center">
          <div className="relative w-36 h-36">
            <RadialBarChart
              width={144}
              height={144}
              cx={72}
              cy={72}
              innerRadius={50}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              data={[{ value: stats.our_sources > 0 ? Math.min(stats.our_sources * 20, 100) : 0, fill: "#8b5cf6" }]}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={10} />
            </RadialBarChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-purple-400">{stats.our_sources}</span>
              <span className="text-xs text-slate-500">sources</span>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-2">Active Pipelines</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.our_contributors} contributors
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Review Queue */}
        <div className="bg-slate-800/50 border border-slate-700 rounded p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-slate-200">Review Queue</h2>
            <button
              onClick={onNavigateToReview}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {stats.our_pending_reviews === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-400 text-sm">No pending items</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-4xl font-medium text-amber-400">{stats.our_pending_reviews}</p>
              <p className="text-slate-400 text-sm mt-2">items need review</p>
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="bg-slate-800/50 border border-slate-700 rounded p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-slate-200">Connected Sources</h2>
            <button
              onClick={onNavigateToSources}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              Manage <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {sourcesLoading && teamSources.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Loading sources...</p>
            </div>
          ) : teamSources.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-slate-400 text-sm">No sources connected</p>
              <button
                onClick={onNavigateToSources}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                + Add a source
              </button>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto">
              {teamSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      source.status === 'active' ? 'bg-green-500' :
                      source.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm text-slate-200">{source.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {source.type} · Last: {source.last_crawl}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">
                    {source.entities_found} items
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Index Health Gauges - Cockpit Style */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-6">
        <h2 className="text-base font-medium text-slate-200 mb-4">Index Health</h2>
        <div className="grid grid-cols-4 gap-4">
          {/* Ops Coverage */}
          <div className="flex flex-col items-center p-4">
            <div className="relative w-20 h-20">
              <RadialBarChart
                width={80}
                height={80}
                cx={40}
                cy={40}
                innerRadius={26}
                outerRadius={38}
                startAngle={90}
                endAngle={-270}
                data={[{ value: 85, fill: "#22c55e" }]}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={6} />
              </RadialBarChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-green-400">85%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Ops</p>
          </div>

          {/* Software Coverage */}
          <div className="flex flex-col items-center p-4">
            <div className="relative w-20 h-20">
              <RadialBarChart
                width={80}
                height={80}
                cx={40}
                cy={40}
                innerRadius={26}
                outerRadius={38}
                startAngle={90}
                endAngle={-270}
                data={[{ value: 72, fill: "#06b6d4" }]}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={6} />
              </RadialBarChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-cyan-400">72%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Software</p>
          </div>

          {/* Hardware Coverage */}
          <div className="flex flex-col items-center p-4">
            <div className="relative w-20 h-20">
              <RadialBarChart
                width={80}
                height={80}
                cx={40}
                cy={40}
                innerRadius={26}
                outerRadius={38}
                startAngle={90}
                endAngle={-270}
                data={[{ value: 45, fill: "#f59e0b" }]}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={6} />
              </RadialBarChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-amber-400">45%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Hardware</p>
          </div>

          {/* Process Coverage */}
          <div className="flex flex-col items-center p-4">
            <div className="relative w-20 h-20">
              <RadialBarChart
                width={80}
                height={80}
                cx={40}
                cy={40}
                innerRadius={26}
                outerRadius={38}
                startAngle={90}
                endAngle={-270}
                data={[{ value: 60, fill: "#8b5cf6" }]}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#334155" }} dataKey="value" cornerRadius={6} />
              </RadialBarChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-purple-400">60%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Process</p>
          </div>
        </div>

        {/* Issues row */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-400">12 duplicates</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-slate-400">5 stale (&gt;30d)</span>
          </div>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="bg-slate-800/50 border border-slate-700 rounded p-6">
        <h2 className="text-base font-medium text-slate-200 mb-6">System Controls</h2>
        <div className="grid grid-cols-4 gap-6">
          {onNavigateToAgents && (
            <button
              onClick={onNavigateToAgents}
              className="p-6 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-base font-medium text-slate-200">Agent Oversight</p>
              <p className="text-sm text-slate-500 mt-1">Trust levels & proposals</p>
            </button>
          )}
          {onNavigateToIngestion && (
            <button
              onClick={onNavigateToIngestion}
              className="p-6 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-base font-medium text-slate-200">Ingestion</p>
              <p className="text-sm text-slate-500 mt-1">Crawl status & jobs</p>
            </button>
          )}
          {onNavigateToPolicy && (
            <button
              onClick={onNavigateToPolicy}
              className="p-6 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-base font-medium text-slate-200">Policy</p>
              <p className="text-sm text-slate-500 mt-1">Auto-approval rules</p>
            </button>
          )}
          {onNavigateToDiscovery && (
            <button
              onClick={onNavigateToDiscovery}
              className="p-6 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900 hover:border-slate-600 transition-colors text-left"
            >
              <p className="text-base font-medium text-slate-200">URL Discovery</p>
              <p className="text-sm text-slate-500 mt-1">Smart crawler for docs</p>
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
