/**
 * TeamDashboard - Mission Control Admin View
 *
 * Shows YOUR TEAM's:
 * - Sources you contribute
 * - Your review queue (pending extractions)
 * - Your verified items
 * - Team members/contributors
 *
 * Mission Control aesthetic: dark backgrounds, sharp corners,
 * monospace data, electric blue/amber/green status colors.
 */

import {
  Building2,
  Users,
  Database,
  FileCheck,
  Globe,
  ArrowRight,
  CheckCircle,
  Network,
  Plus,
  ChevronRight,
  Bot,
  RefreshCw,
  BarChart3,
  Shield,
  Activity,
} from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ActivityFeedCompact } from "@/app/components/ActivityFeed";

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

interface PendingReviewItem {
  id: string;
  type: string;
  name: string;
  source_name: string;
  confidence: number;
  created_at: string;
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
// STATUS INDICATOR COMPONENT
// =============================================================================

function StatusDot({ status }: { status: "active" | "paused" | "error" | "live" }) {
  const colors = {
    active: "bg-emerald-400 shadow-emerald-400/50",
    paused: "bg-amber-400 shadow-amber-400/50",
    error: "bg-red-400 shadow-red-400/50",
    live: "bg-emerald-400 shadow-emerald-400/50",
  };
  return (
    <span className={`w-2 h-2 rounded-full ${colors[status]} shadow-[0_0_6px]`} />
  );
}

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

function StatCard({
  icon: Icon,
  value,
  label,
  iconColor,
  glowColor,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  iconColor: string;
  glowColor?: string;
}) {
  return (
    <Card className="bg-slate-800/50 border-slate-700 p-4 hover:bg-slate-800/70 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded ${glowColor || 'bg-slate-700/50'}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-mono font-bold text-slate-100">{value}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        </div>
      </div>
    </Card>
  );
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

  const pendingReviews: PendingReviewItem[] = [];

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
    <div className="p-6 space-y-6 bg-slate-900 min-h-full">
      {/* Header with Team Context */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded">
          <Building2 className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{teamName}</h1>
          <p className="text-sm text-slate-400">Mission Control Dashboard</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded">
          <StatusDot status="live" />
          <span className="text-xs font-mono text-emerald-400 uppercase">Systems Online</span>
        </div>
      </div>

      {/* Data Flow Pipeline */}
      <Card className="p-4 bg-slate-800/30 border-slate-700">
        <div className="flex items-center gap-4">
          <Network className="h-6 w-6 text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-xs font-mono">
                SOURCES
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-mono">
                REVIEW QUEUE
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-mono">
                VERIFIED
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs font-mono">
                SHARED LIBRARY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Extractions from your sources flow to review. Verified items publish to shared library.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={FileCheck}
          value={stats.our_pending_reviews}
          label="Pending Review"
          iconColor="text-amber-400"
          glowColor="bg-amber-500/10"
        />
        <StatCard
          icon={CheckCircle}
          value={stats.our_verified_this_week}
          label="Verified This Week"
          iconColor="text-emerald-400"
          glowColor="bg-emerald-500/10"
        />
        <StatCard
          icon={Database}
          value={stats.our_sources}
          label="Active Sources"
          iconColor="text-blue-400"
          glowColor="bg-blue-500/10"
        />
        <StatCard
          icon={Globe}
          value={stats.our_total_contributed}
          label="Shared Total"
          iconColor="text-purple-400"
          glowColor="bg-purple-500/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Review Queue Panel */}
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
              <FileCheck className="h-4 w-4 text-amber-400" />
              Review Queue
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToReview}
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
            >
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-2">
            {pendingReviews.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900/80 cursor-pointer transition-colors"
                onClick={onNavigateToReview}
              >
                <div>
                  <p className="font-medium text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {item.type} · {item.source_name} · {item.created_at}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-mono rounded ${
                    item.confidence >= 0.8 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                    item.confidence >= 0.6 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                    "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}>
                    {Math.round(item.confidence * 100)}%
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>

          {stats.our_pending_reviews === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-slate-400 text-sm">Queue Clear</p>
              <p className="text-slate-500 text-xs font-mono">NO PENDING ITEMS</p>
            </div>
          )}
        </Card>

        {/* Sources Panel */}
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
              <Database className="h-4 w-4 text-blue-400" />
              Connected Sources
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToSources}
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Source
            </Button>
          </div>

          <div className="space-y-2">
            {teamSources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded"
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={source.status} />
                  <div>
                    <p className="font-medium text-slate-200">{source.name}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {source.type.toUpperCase()} · Last: {source.last_crawl}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {source.pending_reviews > 0 && (
                    <span className="px-2 py-1 text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                      {source.pending_reviews} pending
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono">
                    {source.entities_found} items
                  </span>
                </div>
              </div>
            ))}

            {teamSources.length === 0 && (
              <div className="text-center py-8">
                <Database className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-slate-400 text-sm">No Sources Connected</p>
                <p className="text-slate-500 text-xs font-mono">ADD A SOURCE TO BEGIN</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Team + Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Team Members */}
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
              <Users className="h-4 w-4 text-cyan-400" />
              Team ({stats.our_contributors})
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            {teamName} members can verify extractions and contribute to the shared library.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 uppercase">Access Level:</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
              {userRole.toUpperCase()}
            </span>
          </div>
        </Card>

        {/* AI Activity Feed */}
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
              <Bot className="h-4 w-4 text-purple-400" />
              AI Activity
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                LIVE
              </span>
            </h2>
          </div>
          <ActivityFeedCompact maxEvents={5} />
          <p className="text-xs text-slate-500 font-mono mt-3 pt-3 border-t border-slate-700">
            REALTIME EXTRACTION ACTIVITY
          </p>
        </Card>
      </div>

      {/* Admin Tools */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" />
          System Controls
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {onNavigateToIngestion && (
            <button
              onClick={onNavigateToIngestion}
              className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900/80 hover:border-blue-500/30 transition-all text-left group"
            >
              <RefreshCw className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
              <div>
                <p className="font-medium text-slate-200 group-hover:text-slate-100">Ingestion</p>
                <p className="text-xs text-slate-500 font-mono">CRAWL STATUS</p>
              </div>
            </button>
          )}
          {onNavigateToHealth && (
            <button
              onClick={onNavigateToHealth}
              className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900/80 hover:border-emerald-500/30 transition-all text-left group"
            >
              <BarChart3 className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300" />
              <div>
                <p className="font-medium text-slate-200 group-hover:text-slate-100">Index Health</p>
                <p className="text-xs text-slate-500 font-mono">COVERAGE & DRIFT</p>
              </div>
            </button>
          )}
          {onNavigateToPolicy && (
            <button
              onClick={onNavigateToPolicy}
              className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700 rounded hover:bg-slate-900/80 hover:border-purple-500/30 transition-all text-left group"
            >
              <Shield className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
              <div>
                <p className="font-medium text-slate-200 group-hover:text-slate-100">Policy</p>
                <p className="text-xs text-slate-500 font-mono">AUTO-APPROVAL RULES</p>
              </div>
            </button>
          )}
        </div>
      </Card>
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
