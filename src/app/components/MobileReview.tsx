/**
 * MobileReview - Mobile-optimized engineer knowledge review
 *
 * PURPOSE: Quick, thumb-friendly review on mobile devices
 * - Show coupling info: FROM, TO, WHAT FLOWS
 * - Tap to agree/disagree with each field
 * - Edit mode to correct information
 * - Large touch targets for accuracy checks
 *
 * Entry point: Sign-in choice "Mobile Review App"
 */

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  LogOut,
  Loader2,
  Save,
  X,
  ArrowRight,
} from "lucide-react";
import { useReviewExtractions } from "@/hooks/useReviewExtractions";
import type { ReviewExtractionDTO, ReviewEpistemics } from "@/types/review";

interface MobileReviewProps {
  onExit: () => void;
  organizationId?: string;
}

// Helper to extract coupling fields from candidate_payload
function extractCouplingFields(payload: Record<string, unknown>) {
  return {
    source: (payload.source || payload.from || payload.source_component || payload.from_component || "") as string,
    target: (payload.target || payload.to || payload.target_component || payload.to_component || "") as string,
    flowType: (payload.flow_type || payload.what_flows || payload.flow || payload.coupling_type || "") as string,
    description: (payload.description || payload.summary || "") as string,
    couplingStrength: (payload.coupling_strength || payload.strength || "") as string,
  };
}

// Core coupling fields for FRAMES review
const COUPLING_FIELDS = [
  { id: "source", label: "FROM", placeholder: "Source component", icon: "→" },
  { id: "target", label: "TO", placeholder: "Target component", icon: "←" },
  { id: "flowType", label: "WHAT FLOWS", placeholder: "Data, power, commands...", icon: "⟷" },
  { id: "description", label: "DESCRIPTION", placeholder: "What this coupling does", icon: "📝" },
];

// Simplified epistemic fields for mobile
const MOBILE_EPISTEMIC_CHECKS = [
  { id: "observer", label: "Who knew?", getVal: (ep: ReviewEpistemics) => ep.observer?.type || ep.observer?.contact_mode },
  { id: "storage", label: "Where stored?", getVal: (ep: ReviewEpistemics) => ep.pattern?.storage },
  { id: "dependencies", label: "Connected to?", getVal: (ep: ReviewEpistemics) => ep.dependencies?.entities?.slice(0, 2).join(", ") },
  { id: "scope", label: "Scope", getVal: (ep: ReviewEpistemics) => ep.conditions?.scope },
  { id: "staleness", label: "Current?", getVal: (ep: ReviewEpistemics) => ep.temporal?.staleness_risk != null ? `${Math.round((1 - (ep.temporal.staleness_risk || 0)) * 100)}% fresh` : null },
  { id: "transferable", label: "Learnable?", getVal: (ep: ReviewEpistemics) => ep.transferability?.skill_transferability },
];

export function MobileReview({ onExit, organizationId }: MobileReviewProps) {
  const { extractions, loading, error, submitDecision, refetch } = useReviewExtractions(organizationId);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Field-level agreement tracking (thumbs up/down per field)
  const [fieldAgreement, setFieldAgreement] = useState<Record<string, boolean | null>>({});

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  const [verifiedEpistemics, setVerifiedEpistemics] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const current = extractions[currentIndex];
  const total = extractions.length;

  // Extract coupling fields from current extraction
  const couplingFields = current ? extractCouplingFields(current.candidate_payload) : null;

  const resetChecks = () => {
    setFieldAgreement({});
    setVerifiedEpistemics(new Set());
    setIsEditing(false);
    setEditedFields({});
  };

  const startEditing = () => {
    if (couplingFields) {
      setEditedFields({
        source: couplingFields.source,
        target: couplingFields.target,
        flowType: couplingFields.flowType,
        description: couplingFields.description,
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedFields({});
  };

  const goNext = () => {
    resetChecks();
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    resetChecks();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleApprove = async () => {
    if (!current) return;
    setIsSubmitting(true);
    try {
      const hasEdits = Object.keys(editedFields).length > 0;
      const agreedFields = Object.entries(fieldAgreement)
        .filter(([_, v]) => v === true)
        .map(([k]) => k);
      const disagreedFields = Object.entries(fieldAgreement)
        .filter(([_, v]) => v === false)
        .map(([k]) => k);

      await submitDecision(current.extraction_id, "accept", {
        decision_reason: hasEdits
          ? `Mobile review - approved with edits to: ${Object.keys(editedFields).join(", ")}`
          : `Mobile review - approved. Agreed: ${agreedFields.join(", ") || "all"}`,
        // TODO: Pass edited payload when backend supports it
      });
      goNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!current) return;
    setIsSubmitting(true);
    try {
      const disagreedFields = Object.entries(fieldAgreement)
        .filter(([_, v]) => v === false)
        .map(([k]) => k);

      await submitDecision(current.extraction_id, "reject", {
        decision_reason: disagreedFields.length > 0
          ? `${reason}. Disagreed with: ${disagreedFields.join(", ")}`
          : reason,
        rejection_category: "other",
      });
      goNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has reviewed the key coupling fields
  const coreFieldIds = ["source", "target", "flowType"];
  const hasReviewedCoreFields = coreFieldIds.some(id => fieldAgreement[id] !== undefined);
  const anyFieldDisagreed = Object.values(fieldAgreement).some(v => v === false);
  const allCoreFieldsAgreed = coreFieldIds.every(id => fieldAgreement[id] === true);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#06b6d4]" />
          <p className="text-sm text-[#64748b]">Loading review queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-red-400">{error}</p>
        <Button onClick={() => refetch()} variant="outline" className="border-[#334155] text-[#cbd5e1]">
          Retry
        </Button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 gap-4">
        <CheckCircle className="h-16 w-16 text-green-400" />
        <h1 className="text-xl font-semibold text-[#e2e8f0]">All caught up!</h1>
        <p className="text-[#94a3b8] text-center">No extractions need review right now.</p>
        <Button onClick={onExit} variant="outline" className="border-[#334155] text-[#cbd5e1]">
          <LogOut className="h-4 w-4 mr-2" />
          Exit Review
        </Button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 gap-4">
        <CheckCircle className="h-16 w-16 text-green-400" />
        <h1 className="text-xl font-semibold text-[#e2e8f0]">Review complete!</h1>
        <p className="text-[#94a3b8]">You reviewed all {total} extractions.</p>
        <Button onClick={onExit} variant="outline" className="border-[#334155] text-[#cbd5e1]">
          <LogOut className="h-4 w-4 mr-2" />
          Exit Review
        </Button>
      </div>
    );
  }

  const { candidate_key, candidate_type, evidence, snapshot, epistemics } = current;
  const coupling = couplingFields!;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1e293b] border-b border-[#334155] px-4 py-3 flex items-center justify-between">
        <button onClick={onExit} className="text-[#94a3b8] hover:text-[#e2e8f0]">
          <LogOut className="h-5 w-5" />
        </button>
        <div className="text-center">
          <span className="text-[#e2e8f0] font-medium">{currentIndex + 1} / {total}</span>
          <Badge variant="outline" className="ml-2 text-xs bg-[#334155] text-[#cbd5e1] border-[#334155]">
            {candidate_type}
          </Badge>
        </div>
        {!isEditing ? (
          <button onClick={startEditing} className="text-[#94a3b8] hover:text-[#e2e8f0]">
            <Edit2 className="h-5 w-5" />
          </button>
        ) : (
          <button onClick={cancelEditing} className="text-red-400 hover:text-red-300">
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Entity Name */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
          <h2 className="text-lg font-semibold text-[#e2e8f0] break-words">{candidate_key}</h2>
          <p className="text-sm text-[#64748b] mt-1">{candidate_type}</p>
        </div>

        {/* COUPLING FIELDS - The Core FRAMES Info */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#64748b] uppercase tracking-wider">Coupling Details</span>
            {!isEditing && (
              <span className="text-xs text-[#64748b]">Tap 👍/👎 to agree or disagree</span>
            )}
          </div>

          {/* FROM → TO visual */}
          {!isEditing && (coupling.source || coupling.target) && (
            <div className="flex items-center justify-center gap-2 mb-4 py-3 bg-[#334155]/30 rounded-lg">
              <span className="text-[#e2e8f0] font-medium text-sm truncate max-w-[40%]">
                {coupling.source || "?"}
              </span>
              <ArrowRight className="h-4 w-4 text-[#06b6d4] flex-shrink-0" />
              <span className="text-[#e2e8f0] font-medium text-sm truncate max-w-[40%]">
                {coupling.target || "?"}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {COUPLING_FIELDS.map((field) => {
              const value = isEditing
                ? editedFields[field.id] || ""
                : coupling[field.id as keyof typeof coupling] || "";
              const agreement = fieldAgreement[field.id];

              return (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748b] uppercase tracking-wider flex-1">
                      {field.label}
                    </span>
                    {!isEditing && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setFieldAgreement(prev => ({
                            ...prev,
                            [field.id]: prev[field.id] === true ? null : true
                          }))}
                          className={`p-1.5 rounded transition-all ${
                            agreement === true
                              ? "bg-green-500/30 text-green-400"
                              : "bg-[#334155]/50 text-[#64748b]"
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setFieldAgreement(prev => ({
                            ...prev,
                            [field.id]: prev[field.id] === false ? null : false
                          }))}
                          className={`p-1.5 rounded transition-all ${
                            agreement === false
                              ? "bg-red-500/30 text-red-400"
                              : "bg-[#334155]/50 text-[#64748b]"
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFields[field.id] || ""}
                      onChange={(e) => setEditedFields(prev => ({
                        ...prev,
                        [field.id]: e.target.value
                      }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 bg-[#334155] border border-[#475569] rounded-lg text-[#e2e8f0] text-sm placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/50"
                    />
                  ) : (
                    <p className={`text-sm px-3 py-2 rounded-lg ${
                      value
                        ? "text-[#e2e8f0] bg-[#334155]/30"
                        : "text-[#64748b] italic bg-[#334155]/20"
                    } ${agreement === false ? "ring-1 ring-red-500/50" : ""} ${agreement === true ? "ring-1 ring-green-500/50" : ""}`}>
                      {value || `No ${field.label.toLowerCase()} specified`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence Quote */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#64748b] uppercase tracking-wider">Evidence</span>
            {snapshot.source_url && (
              <a
                href={snapshot.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06b6d4] hover:text-[#22d3ee]"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="text-sm text-[#cbd5e1] italic leading-relaxed">
            "{evidence.raw_text || "No evidence text"}"
          </p>
        </div>

        {/* Epistemic Quick Checks (if available) */}
        {epistemics && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
            <span className="text-xs text-[#64748b] uppercase tracking-wider block mb-3">Knowledge Metadata</span>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_EPISTEMIC_CHECKS.map((field) => {
                const value = field.getVal(epistemics);
                const isVerified = verifiedEpistemics.has(field.id);
                return (
                  <button
                    key={field.id}
                    onClick={() => setVerifiedEpistemics(prev => {
                      const next = new Set(prev);
                      if (next.has(field.id)) {
                        next.delete(field.id);
                      } else {
                        next.add(field.id);
                      }
                      return next;
                    })}
                    className={`p-3 rounded-lg text-left transition-all ${
                      isVerified
                        ? "bg-green-500/20 border border-green-500/50"
                        : "bg-[#334155]/50 border border-[#334155]"
                    }`}
                  >
                    <p className="text-xs text-[#64748b]">{field.label}</p>
                    <p className={`text-sm truncate ${value ? "text-[#e2e8f0]" : "text-[#64748b] italic"}`}>
                      {value || "Not detected"}
                    </p>
                    {isVerified && <CheckCircle className="h-3 w-3 text-green-400 mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation & Actions */}
      <div className="sticky bottom-0 bg-[#1e293b] border-t border-[#334155] p-4 space-y-3">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg bg-[#334155] text-[#94a3b8] disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 mx-4 h-1 bg-[#334155] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#06b6d4] transition-all"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
          <button
            onClick={goNext}
            disabled={currentIndex >= total - 1}
            className="p-2 rounded-lg bg-[#334155] text-[#94a3b8] disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Decision Buttons */}
        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={cancelEditing}
              variant="outline"
              className="h-14 border-[#334155] text-[#94a3b8]"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="h-14 bg-[#06b6d4]/20 hover:bg-[#06b6d4]/30 text-[#06b6d4] border border-[#06b6d4]/30"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save & Approve
                </>
              )}
            </Button>
          </div>
        ) : !hasReviewedCoreFields ? (
          <div className="space-y-2">
            <p className="text-center text-sm text-[#64748b]">
              Review the coupling fields above (👍 or 👎)
            </p>
            <Button
              onClick={goNext}
              variant="outline"
              className="w-full h-12 border-[#334155] text-[#94a3b8]"
            >
              Skip for now
            </Button>
          </div>
        ) : anyFieldDisagreed ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleReject("Field disagreement - needs correction")}
              disabled={isSubmitting}
              className="h-14 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </Button>
            <Button
              onClick={startEditing}
              className="h-14 bg-[#06b6d4]/20 hover:bg-[#06b6d4]/30 text-[#06b6d4] border border-[#06b6d4]/30"
            >
              <Edit2 className="h-5 w-5 mr-2" />
              Edit & Fix
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleReject("Needs more review")}
              disabled={isSubmitting}
              variant="outline"
              className="h-14 border-[#334155] text-[#94a3b8]"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="h-14 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
