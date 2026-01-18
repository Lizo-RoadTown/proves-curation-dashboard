/**
 * AdminView - Mission Control Admin Interface
 *
 * Dashboard-first navigation with drill-down sections.
 * Dark theme with electric blue/amber/green status colors.
 */

import { useState } from "react";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileCheck,
  ArrowLeft,
  Filter,
  ChevronRight,
  Activity,
  Zap,
} from "lucide-react";
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

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-300 bg-emerald-500/20 border-emerald-500/30";
    if (score >= 0.5) return "text-amber-300 bg-amber-500/20 border-amber-500/30";
    return "text-red-300 bg-red-500/20 border-red-500/30";
  };

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
      <span className="font-mono uppercase text-xs">Back to Dashboard</span>
    </button>
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-900">
      {/* Dashboard is the main view */}
      {activeSection === "dashboard" && (
        <TeamDashboard
          teamName="PROVES Lab"
          teamSlug="proves-lab"
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
        <div className="p-6 bg-slate-900 min-h-full">
          {renderBackButton()}

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                <FileCheck className="w-5 h-5 text-amber-400" />
                Review Queue
              </h2>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded px-3 py-1.5 font-mono"
                >
                  <option value="pending">PENDING</option>
                  <option value="accepted">ACCEPTED</option>
                  <option value="rejected">REJECTED</option>
                  <option value="">ALL</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded px-3 py-1.5 font-mono"
                >
                  <option value="">ALL TYPES</option>
                  <option value="component">COMPONENTS</option>
                  <option value="interface">INTERFACES</option>
                  <option value="system">SYSTEMS</option>
                  <option value="procedure">PROCEDURES</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => refresh()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="font-mono text-xs uppercase">Refresh</span>
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-300">Error loading extractions</p>
                <p className="text-sm text-red-400/80 font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="ml-3 text-slate-400 font-mono text-sm uppercase">Loading extractions...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && extractions.length === 0 && (
            <div className="text-center py-12 bg-slate-800/30 border border-slate-700 rounded">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-200 mb-1">Queue Clear</h3>
              <p className="text-sm text-slate-500 font-mono uppercase">
                {statusFilter === "pending"
                  ? "No pending extractions"
                  : `No ${statusFilter} extractions found`}
              </p>
            </div>
          )}

          {/* Extractions List */}
          {!loading && extractions.length > 0 && (
            <div className="space-y-3">
              {extractions.map((extraction) => (
                <ExtractionCard
                  key={extraction.extraction_id}
                  extraction={extraction}
                  onView={() => handleViewExtraction(extraction.extraction_id)}
                  getConfidenceColor={getConfidenceColor}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "sources" && (
        <div className="p-6 bg-slate-900 min-h-full">
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
        <div className="p-6 bg-slate-900 min-h-full">
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
        <div className="p-6 bg-slate-900 min-h-full">
          {renderBackButton()}

          <h2 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2 uppercase tracking-wide">
            <Activity className="w-5 h-5 text-emerald-400" />
            Index Health
          </h2>

          {/* Coverage by Domain */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide font-mono">
              Coverage by Domain
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { domain: "OPS", coverage: 85, color: "bg-emerald-500" },
                { domain: "SOFTWARE", coverage: 72, color: "bg-blue-500" },
                { domain: "HARDWARE", coverage: 45, color: "bg-amber-500" },
                { domain: "PROCESS", coverage: 60, color: "bg-purple-500" },
              ].map((item) => (
                <div key={item.domain} className="p-4 bg-slate-800/50 border border-slate-700 rounded">
                  <p className="text-xs text-slate-500 font-mono uppercase">{item.domain}</p>
                  <p className="text-2xl font-mono font-bold text-slate-100">{item.coverage}%</p>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide font-mono">
            Issues Detected
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-300">12 potential duplicates</p>
                <p className="text-xs text-amber-400/60 font-mono">SIMILAR COMPONENTS FROM DIFFERENT SOURCES</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded">
              <Clock className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-300">5 stale entries (&gt;30 days)</p>
                <p className="text-xs text-red-400/60 font-mono">KNOWLEDGE MAY NEED REFRESH</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "policy" && (
        <div className="p-6 bg-slate-900 min-h-full">
          {renderBackButton()}

          <h2 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2 uppercase tracking-wide">
            <Zap className="w-5 h-5 text-purple-400" />
            Ingestion Policy
          </h2>

          <div className="space-y-4">
            {/* Auto-Approval Rules */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
              <h3 className="font-medium text-slate-200 mb-3 font-mono text-sm uppercase">Auto-Approval Rules</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-slate-200">
                    Auto-approve extractions with confidence &gt; 0.9
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-slate-200">
                    Auto-approve from verified sources (F' docs, PROVES Kit)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-slate-200">
                    Auto-approve duplicate matches
                  </span>
                </label>
              </div>
            </div>

            {/* Blocked Content */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
              <h3 className="font-medium text-slate-200 mb-3 font-mono text-sm uppercase">Blocked Patterns</h3>
              <textarea
                placeholder="Enter patterns to block (one per line)"
                className="w-full h-24 px-3 py-2 text-sm bg-slate-900 border border-slate-600 text-slate-300 rounded font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                defaultValue="**/node_modules/**&#10;**/build/**&#10;**/.git/**"
              />
            </div>

            {/* Refresh Cadence */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
              <h3 className="font-medium text-slate-200 mb-3 font-mono text-sm uppercase">Refresh Cadence</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-mono uppercase">Documentation</label>
                  <select className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 text-slate-300 rounded font-mono">
                    <option>DAILY</option>
                    <option>WEEKLY</option>
                    <option>MANUAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-mono uppercase">Discord/Chat</label>
                  <select className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 text-slate-300 rounded font-mono">
                    <option>REALTIME</option>
                    <option>HOURLY</option>
                    <option>DAILY</option>
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
  getConfidenceColor: (score: number) => string;
}

function ExtractionCard({ extraction, onView, getConfidenceColor }: ExtractionCardProps) {
  const confidencePercent = Math.round(extraction.confidence.score * 100);

  return (
    <div
      className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded hover:border-blue-500/50 hover:bg-slate-800/70 transition-all cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Type indicator */}
        <div className="w-10 h-10 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-300 font-mono font-semibold text-xs">
            {extraction.candidate_type.slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-200 truncate group-hover:text-slate-100">
              {extraction.candidate_key}
            </h3>
            {extraction.edit_count > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                {extraction.edit_count} EDIT{extraction.edit_count > 1 ? "S" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate font-mono">
            {extraction.candidate_type.toUpperCase()} · {extraction.ecosystem?.toUpperCase() || "UNKNOWN"} ·{" "}
            {new Date(extraction.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Right side - confidence and action */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Confidence badge */}
        <div className={`px-3 py-1 rounded text-sm font-mono font-medium border ${getConfidenceColor(extraction.confidence.score)}`}>
          {confidencePercent}%
        </div>

        {/* Lineage indicator */}
        {extraction.lineage.verified ? (
          <CheckCircle className="w-5 h-5 text-emerald-400" title="Lineage verified" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-400" title="Lineage unverified" />
        )}

        {/* View arrow */}
        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
      </div>
    </div>
  );
}
