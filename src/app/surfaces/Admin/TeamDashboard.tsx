/**
 * TeamDashboard - Admin view for managing team contributions
 *
 * Shows YOUR TEAM's:
 * - Sources you contribute
 * - Your review queue (pending extractions)
 * - Your verified items
 * - Team members/contributors
 *
 * The Shared Library view has moved to the Library tab.
 *
 * Key insight: Extractions from YOUR sources go to YOUR review queue.
 * Once verified by you, they flow to the shared library.
 */

import { useState } from "react";
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
} from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ActivityFeedCompact } from "@/app/components/ActivityFeed";

// =============================================================================
// TYPES
// =============================================================================

interface TeamStats {
  // Our team's contributions
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
// MAIN COMPONENT
// =============================================================================

interface TeamDashboardProps {
  teamName: string;
  teamSlug: string;
  userRole: string;
  sources?: any[]; // Real sources from useSources hook
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
  // Use real sources data when available, otherwise show empty state
  const stats: TeamStats = {
    our_sources: sources.length,
    our_pending_reviews: 0, // TODO: Get from extractions
    our_verified_this_week: 0, // TODO: Get from verified entities
    our_total_contributed: 0, // TODO: Get from core_entities count
    our_contributors: 8, // TODO: Get from team members
  };

  // TODO: Replace with real pending reviews from useReviewExtractions
  const pendingReviews: PendingReviewItem[] = [];

  // Transform real sources to TeamSource format
  const teamSources: TeamSource[] = sources.map((s: any) => ({
    id: s.id,
    name: s.name,
    type: s.source_type?.includes('github') ? 'github' :
          s.source_type?.includes('notion') ? 'notion' :
          s.source_type?.includes('discord') ? 'discord' : 'github',
    status: s.is_active ? 'active' : 'paused',
    last_crawl: s.last_crawl_at ? formatRelativeTime(s.last_crawl_at) : 'Never',
    entities_found: s.item_count || 0,
    pending_reviews: 0, // TODO: Get pending count per source
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header with Team Context */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{teamName}</h1>
          <p className="text-sm text-gray-500">Manage your team's contributions to the shared library</p>
        </div>
      </div>

      {/* How It Works - Always visible */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center gap-4">
          <Network className="h-8 w-8 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                  Your Sources
                </Badge>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  Your Review Queue
                </Badge>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  Verified
                </Badge>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                Shared Library
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Extractions from your sources come to your team for verification. Once approved, they're shared with everyone.
            </p>
          </div>
        </div>
      </Card>

      {/* Team Management */}
      <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileCheck className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.our_pending_reviews}</p>
                  <p className="text-xs text-gray-500">Pending Review</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.our_verified_this_week}</p>
                  <p className="text-xs text-gray-500">Verified This Week</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.our_sources}</p>
                  <p className="text-xs text-gray-500">Active Sources</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.our_total_contributed}</p>
                  <p className="text-xs text-gray-500">Contributed to Shared</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Pending Reviews */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-yellow-600" />
                  Your Review Queue
                </h2>
                <Button variant="outline" size="sm" onClick={onNavigateToReview}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-2">
                {pendingReviews.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={onNavigateToReview}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.type} · from {item.source_name} · {item.created_at}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.confidence >= 0.8 ? "bg-green-100 text-green-700" :
                        item.confidence >= 0.6 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {Math.round(item.confidence * 100)}%
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>

              {stats.our_pending_reviews === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>All caught up!</p>
                </div>
              )}
            </Card>

            {/* Team Sources */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Your Sources
                </h2>
                <Button variant="outline" size="sm" onClick={onNavigateToSources}>
                  <Plus className="h-4 w-4 mr-1" /> Add Source
                </Button>
              </div>

              <div className="space-y-2">
                {teamSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        source.status === "active" ? "bg-green-500" :
                        source.status === "paused" ? "bg-yellow-500" :
                        "bg-red-500"
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{source.name}</p>
                        <p className="text-xs text-gray-500">
                          {source.type} · Last crawl: {source.last_crawl}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {source.pending_reviews > 0 && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                          {source.pending_reviews} pending
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {source.entities_found} found
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Bottom row: Contributors + Activity Feed */}
          <div className="grid grid-cols-2 gap-6">
            {/* Your Contributors */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Your Team ({stats.our_contributors} members)
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                Members of {teamName} can verify extractions from your sources and contribute to the shared library.
              </p>
            </Card>

            {/* AI Activity Feed */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  AI Activity
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </h2>
              </div>
              <ActivityFeedCompact maxEvents={5} />
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                What the AI extraction system is doing right now
              </p>
            </Card>
          </div>

          {/* Admin Quick Links */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h2>
            <div className="grid grid-cols-3 gap-4">
              {onNavigateToIngestion && (
                <button
                  onClick={onNavigateToIngestion}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Ingestion</p>
                    <p className="text-xs text-gray-500">Crawl status & jobs</p>
                  </div>
                </button>
              )}
              {onNavigateToHealth && (
                <button
                  onClick={onNavigateToHealth}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Index Health</p>
                    <p className="text-xs text-gray-500">Coverage & drift</p>
                  </div>
                </button>
              )}
              {onNavigateToPolicy && (
                <button
                  onClick={onNavigateToPolicy}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <Shield className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Policy</p>
                    <p className="text-xs text-gray-500">Auto-approval rules</p>
                  </div>
                </button>
              )}
            </div>
          </Card>
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
