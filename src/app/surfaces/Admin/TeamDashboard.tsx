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
  onNavigateToReview: () => void;
  onNavigateToSources: () => void;
}

export function TeamDashboard({
  teamName,
  teamSlug,
  userRole,
  onNavigateToReview,
  onNavigateToSources,
}: TeamDashboardProps) {
  // Mock data - replace with real API calls
  const stats: TeamStats = {
    our_sources: 5,
    our_pending_reviews: 12,
    our_verified_this_week: 34,
    our_total_contributed: 156,
    our_contributors: 8,
  };

  const pendingReviews: PendingReviewItem[] = [
    { id: "1", type: "coupling", name: "GPS → Flight Computer", source_name: "PROVES Kit Docs", confidence: 0.87, created_at: "2h ago" },
    { id: "2", type: "component", name: "OrbitFSW", source_name: "GitHub - proves-kit", confidence: 0.92, created_at: "3h ago" },
    { id: "3", type: "interface", name: "I2C Bus Protocol", source_name: "Discord #hardware", confidence: 0.75, created_at: "5h ago" },
  ];

  const teamSources: TeamSource[] = [
    { id: "1", name: "proves-kit", type: "github", status: "active", last_crawl: "2h ago", entities_found: 89, pending_reviews: 4 },
    { id: "2", name: "PROVES Notion", type: "notion", status: "active", last_crawl: "1d ago", entities_found: 45, pending_reviews: 3 },
    { id: "3", name: "#hardware Discord", type: "discord", status: "active", last_crawl: "30m ago", entities_found: 23, pending_reviews: 5 },
  ];

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
        </div>
    </div>
  );
}
