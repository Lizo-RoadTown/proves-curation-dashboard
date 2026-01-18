/**
 * AdminView - Admin Interface
 *
 * Dashboard-first navigation with drill-down sections.
 */

import { useState } from "react";
import { RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import { useReviewExtractions } from "@/hooks/useReviewExtractions";
import { useSources } from "@/hooks/useSources";
import { ExtractionDetail } from "@/app/components/ExtractionDetail";
import { EngineerReview } from "@/app/components/EngineerReview";
import { SourcesSection } from "./SourcesSection";
import { IngestionSection } from "./IngestionSection";
import { TeamDashboard } from "./TeamDashboard";
import type { ReviewExtractionDTO, RejectionCategory } from "@/types/review";

type AdminSection = "dashboard" | "review" | "sources" | "ingestion" | "health" | "policy";

export function AdminView() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [selectedExtractionId, setSelectedExtractionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"simple" | "detailed">("simple");

  // Review extractions
  const {
    extractions,
    loading,
    error,
    fetchExtractions,
    refresh,
    recordDecision,
  } = useReviewExtractions();

  // Team sources (extraction pipelines)
  const {
    sources,
    recentJobs,
    stats,
    loading: sourcesLoading,
    error: sourcesError,
    fetchSources,
    fetchRecentJobs,
    fetchStats,
    createSource,
    updateSource,
    deleteSource,
    triggerCrawl,
    toggleSourceActive,
  } = useSources();

  const handleViewExtraction = (id: string) => {
    setSelectedExtractionId(id);
  };

  const handleBackFromDetail = () => {
    setSelectedExtractionId(null);
    refresh();
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchExtractions({ status: status || undefined });
  };

  // If viewing a specific extraction, show the detail view
  if (selectedExtractionId) {
    const selectedExtraction = extractions.find(e => e.extraction_id === selectedExtractionId);

    if (viewMode === "simple" && selectedExtraction) {
      return (
        <EngineerReview
          extraction={selectedExtraction}
          onApprove={async (notes, captureAnswers) => {
            await recordDecision({
              p_extraction_id: selectedExtractionId,
              p_decision: "accept",
              p_reviewer_id: "dashboard_user",
              p_decision_reason: notes || "Approved via engineer review",
            });
            handleBackFromDetail();
          }}
          onReject={async (reason, category) => {
            await recordDecision({
              p_extraction_id: selectedExtractionId,
              p_decision: "reject",
              p_reviewer_id: "dashboard_user",
              p_rejection_category: category as RejectionCategory,
              p_decision_reason: reason,
            });
            handleBackFromDetail();
          }}
          onBack={handleBackFromDetail}
        />
      );
    }

    return (
      <ExtractionDetail
        extractionId={selectedExtractionId}
        onBack={handleBackFromDetail}
        reviewerId="dashboard_user"
      />
    );
  }

  // Back button for drill-down sections
  const renderBackButton = () => (
    <button
      onClick={() => setActiveSection("dashboard")}
      className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back to Dashboard</span>
    </button>
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-900">
      {/* Dashboard is the main view */}
      {activeSection === "dashboard" && (
        <TeamDashboard
          teamName="Cal Poly Pomona"
          teamSlug="cal-poly-pomona"
          userRole="lead"
          sources={sources}
          sourcesLoading={sourcesLoading}
          onNavigateToReview={() => setActiveSection("review")}
          onNavigateToSources={() => setActiveSection("sources")}
          onNavigateToIngestion={() => setActiveSection("ingestion")}
          onNavigateToHealth={() => setActiveSection("health")}
          onNavigateToPolicy={() => setActiveSection("policy")}
        />
      )}

      {activeSection === "review" && (
        <div className="p-6">
          {renderBackButton()}

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-100">Review Queue</h2>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded px-3 py-1.5"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="">All</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded px-3 py-1.5"
                >
                  <option value="">All Types</option>
                  <option value="component">Components</option>
                  <option value="interface">Interfaces</option>
                  <option value="system">Systems</option>
                  <option value="procedure">Procedures</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => refresh()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-3 mb-4 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">
              Error loading extractions: {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && extractions.length === 0 && (
            <div className="text-center py-12 bg-slate-800/30 border border-slate-700 rounded">
              <p className="text-slate-400">
                {statusFilter === "pending"
                  ? "No pending extractions"
                  : `No ${statusFilter} extractions found`}
              </p>
            </div>
          )}

          {/* Extractions List */}
          {!loading && extractions.length > 0 && (
            <div className="space-y-2">
              {extractions.map((extraction) => (
                <ExtractionCard
                  key={extraction.extraction_id}
                  extraction={extraction}
                  onView={() => handleViewExtraction(extraction.extraction_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "sources" && (
        <div className="p-6">
          {renderBackButton()}
          <SourcesSection
            sources={sources}
            loading={sourcesLoading}
            error={sourcesError}
            onCreateSource={createSource}
            onUpdateSource={updateSource}
            onDeleteSource={deleteSource}
            onTriggerCrawl={triggerCrawl}
            onToggleActive={toggleSourceActive}
            onRefresh={fetchSources}
          />
        </div>
      )}

      {activeSection === "ingestion" && (
        <div className="p-6">
          {renderBackButton()}
          <IngestionSection
            jobs={recentJobs}
            stats={stats}
            sources={sources}
            loading={sourcesLoading}
            onRefresh={() => {
              fetchRecentJobs();
              fetchStats();
            }}
          />
        </div>
      )}

      {activeSection === "health" && (
        <div className="p-6">
          {renderBackButton()}

          <h2 className="text-lg font-semibold text-slate-100 mb-6">Index Health</h2>

          {/* Coverage by Domain */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Coverage by Domain</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { domain: "Ops", coverage: 85 },
                { domain: "Software", coverage: 72 },
                { domain: "Hardware", coverage: 45 },
                { domain: "Process", coverage: 60 },
              ].map((item) => (
                <div key={item.domain} className="p-4 bg-slate-800/50 border border-slate-700 rounded">
                  <p className="text-sm text-slate-400">{item.domain}</p>
                  <p className="text-xl font-medium text-slate-100">{item.coverage}%</p>
                  <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{ width: `${item.coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <h3 className="text-sm font-medium text-slate-400 mb-3">Issues</h3>
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-300">
              12 potential duplicates detected
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded text-sm text-slate-300">
              5 stale entries (&gt;30 days)
            </div>
          </div>
        </div>
      )}

      {activeSection === "policy" && (
        <div className="p-6">
          {renderBackButton()}

          <h2 className="text-lg font-semibold text-slate-100 mb-6">Ingestion Policy</h2>

          <div className="space-y-4">
            {/* Auto-Approval Rules */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
              <h3 className="text-sm font-medium text-slate-200 mb-3">Auto-Approval Rules</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                  />
                  <span className="text-sm text-slate-300">
                    Auto-approve extractions with confidence &gt; 0.9
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                  />
                  <span className="text-sm text-slate-300">
                    Auto-approve from verified sources
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                  />
                  <span className="text-sm text-slate-300">
                    Auto-approve duplicate matches
                  </span>
                </label>
              </div>
            </div>

            {/* Blocked Content */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
              <h3 className="text-sm font-medium text-slate-200 mb-3">Blocked Patterns</h3>
              <textarea
                placeholder="Enter patterns to block (one per line)"
                className="w-full h-24 px-3 py-2 text-sm bg-slate-900 border border-slate-700 text-slate-300 rounded"
                defaultValue="**/node_modules/**&#10;**/build/**&#10;**/.git/**"
              />
            </div>

            {/* Refresh Cadence */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
              <h3 className="text-sm font-medium text-slate-200 mb-3">Refresh Cadence</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Documentation</label>
                  <select className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 text-slate-300 rounded">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Manual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Discord/Chat</label>
                  <select className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 text-slate-300 rounded">
                    <option>Realtime</option>
                    <option>Hourly</option>
                    <option>Daily</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXTRACTION CARD COMPONENT
// =============================================================================

interface ExtractionCardProps {
  extraction: ReviewExtractionDTO;
  onView: () => void;
}

function ExtractionCard({ extraction, onView }: ExtractionCardProps) {
  const confidencePercent = Math.round(extraction.confidence.score * 100);

  return (
    <div
      className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onView}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-slate-200 truncate">
          {extraction.candidate_key}
        </h3>
        <p className="text-xs text-slate-500">
          {extraction.candidate_type} · {extraction.ecosystem || "unknown"} ·{" "}
          {new Date(extraction.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm text-slate-400">{confidencePercent}%</span>
      </div>
    </div>
  );
}
