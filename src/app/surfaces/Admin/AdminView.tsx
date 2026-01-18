import { useState } from "react";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileCheck,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useReviewExtractions } from "@/hooks/useReviewExtractions";
import { useSources } from "@/hooks/useSources";
import { ExtractionDetail } from "@/app/components/ExtractionDetail";
import { EngineerReview } from "@/app/components/EngineerReview";
import { CouplingCard, CouplingCardCompact } from "@/app/components/CouplingCard";
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
  const [viewMode, setViewMode] = useState<"simple" | "detailed">("simple"); // simple = engineer-friendly

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
    if (score >= 0.8) return "text-green-600 bg-green-50";
    if (score >= 0.5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const handleViewExtraction = (id: string) => {
    setSelectedExtractionId(id);
  };

  const handleBackFromDetail = () => {
    setSelectedExtractionId(null);
    refresh(); // Refresh the list after returning
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchExtractions({ status: status || undefined });
  };

  // If viewing a specific extraction, show the detail view
  if (selectedExtractionId) {
    const selectedExtraction = extractions.find(e => e.extraction_id === selectedExtractionId);

    // Simple mode: Engineer-friendly review with knowledge capture
    if (viewMode === "simple" && selectedExtraction) {
      return (
        <EngineerReview
          extraction={selectedExtraction}
          onApprove={async (notes, captureAnswers) => {
            // TODO: Store captureAnswers as enrichment metadata
            await recordDecision({
              p_extraction_id: selectedExtractionId,
              p_decision: "accept",
              p_reviewer_id: "dashboard_user",
              p_decision_reason: notes || "Approved via engineer review",
              // captureAnswers would be stored separately as epistemic enrichment
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

    // Detailed mode: Full researcher view
    return (
      <ExtractionDetail
        extractionId={selectedExtractionId}
        onBack={handleBackFromDetail}
        reviewerId="dashboard_user" // TODO: Get from auth context
      />
    );
  }

  // Dashboard is the main view, sections are drill-downs with back button
  const renderBackButton = () => (
    <button
      onClick={() => setActiveSection("dashboard")}
      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
    >
      <ArrowRight className="w-4 h-4 rotate-180" />
      Back to Dashboard
    </button>
  );

  return (
    <div className="h-full overflow-y-auto">
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
        <div className="p-6">
          {renderBackButton()}
          {/* Filters and Actions */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Review Queue</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="">All</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
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
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Error loading extractions</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading extractions...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && extractions.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No extractions to review</h3>
              <p className="text-sm text-gray-600">
                {statusFilter === "pending"
                  ? "All caught up! Check back later for new extractions."
                  : `No ${statusFilter} extractions found.`}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Index Health</h2>

          {/* Coverage by Domain */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Coverage by Domain</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { domain: "Ops", coverage: 85, color: "bg-green-500" },
                { domain: "Software", coverage: 72, color: "bg-blue-500" },
                { domain: "Hardware", coverage: 45, color: "bg-yellow-500" },
                { domain: "Process", coverage: 60, color: "bg-purple-500" },
              ].map((item) => (
                <div key={item.domain} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">{item.domain}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.coverage}%</p>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
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
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Issues to Address</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">12 potential duplicates detected</p>
                <p className="text-xs text-yellow-600">Components with similar names from different sources</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">5 stale entries (&gt;30 days)</p>
                <p className="text-xs text-red-600">Knowledge that may need refresh</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "policy" && (
        <div className="p-6">
          {renderBackButton()}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingestion Policy</h2>

          <div className="space-y-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Auto-Approval Rules</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">
                    Auto-approve extractions with confidence &gt; 0.9
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">
                    Auto-approve from verified sources (F' docs, PROVES Kit)
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">
                    Auto-approve duplicate matches
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Blocked Content</h3>
              <textarea
                placeholder="Enter patterns to block (one per line)"
                className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                defaultValue="**/node_modules/**&#10;**/build/**&#10;**/.git/**"
              />
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Refresh Cadence</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Documentation</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Manual only</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Discord/Chat</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option>Real-time</option>
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
  getConfidenceColor: (score: number) => string;
}

function ExtractionCard({ extraction, onView, getConfidenceColor }: ExtractionCardProps) {
  const confidencePercent = Math.round(extraction.confidence.score * 100);

  return (
    <div
      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Type indicator */}
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-semibold text-xs">
            {extraction.candidate_type.slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{extraction.candidate_key}</h3>
            {extraction.edit_count > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                {extraction.edit_count} edit{extraction.edit_count > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {extraction.candidate_type} · {extraction.ecosystem || "unknown"} ·{" "}
            {new Date(extraction.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Right side - confidence and action */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Confidence badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(extraction.confidence.score)}`}>
          {confidencePercent}%
        </div>

        {/* Lineage indicator */}
        {extraction.lineage.verified ? (
          <CheckCircle className="w-5 h-5 text-green-500" title="Lineage verified" />
        ) : (
          <AlertCircle className="w-5 h-5 text-yellow-500" title="Lineage unverified" />
        )}

        {/* View arrow */}
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}
