/**
 * MobileReview - Mobile-optimized engineer knowledge review
 *
 * PURPOSE: Quick, thumb-friendly review on mobile devices
 * - Show coupling info: FROM, TO, VIA, WHAT FLOWS (matches desktop)
 * - Tap to agree/disagree with each field
 * - Edit mode to correct information
 * - Epistemic metadata verification (7 questions)
 * - Clear "No data extracted" messages with instructions
 *
 * Entry point: Sign-in choice "Mobile Review App"
 */

import { useState, useEffect } from "react";
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
  AlertCircle,
} from "lucide-react";
import { useReviewExtractions } from "@/hooks/useReviewExtractions";
import type { ReviewEpistemics } from "@/types/review";

interface MobileReviewProps {
  onExit: () => void;
  organizationId?: string;
}

// Helper to extract coupling fields from candidate_payload (matches desktop)
function extractCouplingFields(payload: Record<string, unknown>) {
  // Handle nested flow object
  const flowObj = payload.flow as Record<string, unknown> | string | undefined;
  const flowValue = typeof flowObj === 'object' && flowObj !== null
    ? (flowObj.what as string || "")
    : (flowObj || payload.what_flows || payload.flow_type || "") as string;

  return {
    from_component: (payload.from_component || payload.source || payload.from || payload.source_component || "") as string,
    to_component: (payload.to_component || payload.target || payload.to || payload.target_component || "") as string,
    via_interface: (payload.via_interface || payload.via || payload.interface || "") as string,
    flow: flowValue,
    name: (payload.name || "") as string,
    description: (payload.description || payload.summary || "") as string,
  };
}

// Core coupling fields for FRAMES review (matches desktop EngineerReview)
const COUPLING_FIELDS = [
  { id: "from_component", label: "FROM COMPONENT", placeholder: "Enter source component if known..." },
  { id: "to_component", label: "TO COMPONENT", placeholder: "Enter target component if known..." },
  { id: "via_interface", label: "VIA INTERFACE", placeholder: "Enter interface if known..." },
  { id: "flow", label: "WHAT FLOWS", placeholder: "What data/signals flow through this?" },
];

// Entity fields for non-coupling extractions
const ENTITY_FIELDS = [
  { id: "name", label: "NAME", placeholder: "Enter correct name if different..." },
  { id: "description", label: "DESCRIPTION", placeholder: "Add or correct description..." },
];

// Epistemic metadata fields (simplified 7 questions - matches desktop)
const EPISTEMIC_GROUPS = [
  {
    id: "observer",
    question: "Q1: Who knew this?",
    fields: [
      { id: "observer_type", label: "Source Type", getValue: (ep: ReviewEpistemics) => ep.observer?.type },
      { id: "contact_mode", label: "Contact Mode", getValue: (ep: ReviewEpistemics) => ep.observer?.contact_mode },
    ],
  },
  {
    id: "storage",
    question: "Q2: Where does this live?",
    fields: [
      { id: "pattern_storage", label: "Storage", getValue: (ep: ReviewEpistemics) => ep.pattern?.storage },
      { id: "signal_type", label: "Signal Type", getValue: (ep: ReviewEpistemics) => ep.pattern?.signal_type },
    ],
  },
  {
    id: "dependencies",
    question: "Q3: What stays connected?",
    fields: [
      { id: "dependencies", label: "Dependencies", getValue: (ep: ReviewEpistemics) => ep.dependencies?.entities?.join(", ") || null },
      { id: "sequence_role", label: "Role", getValue: (ep: ReviewEpistemics) => ep.dependencies?.sequence_role },
    ],
  },
  {
    id: "conditions",
    question: "Q4: When is this true?",
    fields: [
      { id: "assumptions", label: "Assumptions", getValue: (ep: ReviewEpistemics) => ep.conditions?.assumptions?.join(", ") || null },
      { id: "scope", label: "Scope", getValue: (ep: ReviewEpistemics) => ep.conditions?.scope },
    ],
  },
  {
    id: "validity",
    question: "Q5: How current is this?",
    fields: [
      { id: "staleness_risk", label: "Staleness", getValue: (ep: ReviewEpistemics) => ep.temporal?.staleness_risk != null ? `${Math.round((ep.temporal.staleness_risk || 0) * 100)}% risk` : null },
      { id: "refresh_trigger", label: "Refresh When", getValue: (ep: ReviewEpistemics) => ep.temporal?.refresh_trigger },
    ],
  },
  {
    id: "authorship",
    question: "Q6: Who wrote this?",
    fields: [
      { id: "intent", label: "Intent", getValue: (ep: ReviewEpistemics) => ep.authorship?.intent },
      { id: "uncertainty_notes", label: "Uncertainties", getValue: (ep: ReviewEpistemics) => ep.authorship?.uncertainty_notes },
    ],
  },
  {
    id: "practice",
    question: "Q7: Need to DO it?",
    fields: [
      { id: "reenactment_required", label: "Needs Practice", getValue: (ep: ReviewEpistemics) => ep.transferability?.reenactment_required != null ? (ep.transferability.reenactment_required ? "Yes" : "No") : null },
      { id: "skill_transferability", label: "Transferability", getValue: (ep: ReviewEpistemics) => ep.transferability?.skill_transferability },
    ],
  },
];

export function MobileReview({ onExit, organizationId }: MobileReviewProps) {
  const { extractions, loading, error, recordDecision, refresh, fetchExtractions } = useReviewExtractions();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch with organization filter on mount
  useEffect(() => {
    if (organizationId) {
      fetchExtractions({ organizationId, status: 'pending' });
    }
  }, [organizationId, fetchExtractions]);

  // Field-level agreement tracking (thumbs up/down per field)
  const [fieldAgreement, setFieldAgreement] = useState<Record<string, boolean | null>>({});

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  // Epistemic verification and editing
  const [verifiedEpistemics, setVerifiedEpistemics] = useState<Set<string>>(new Set());
  const [epistemicEdits, setEpistemicEdits] = useState<Record<string, string>>({});
  const [editingEpistemicField, setEditingEpistemicField] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const current = extractions[currentIndex];
  const total = extractions.length;

  // Extract fields from current extraction
  const extractedFields = current ? extractCouplingFields(current.candidate_payload) : null;

  // Determine if this is a coupling (has from AND to) or an entity
  const isCoupling = extractedFields && (extractedFields.from_component || extractedFields.to_component);

  // Get the appropriate fields based on type
  const fieldsToShow = isCoupling ? COUPLING_FIELDS : ENTITY_FIELDS;

  const resetChecks = () => {
    setFieldAgreement({});
    setVerifiedEpistemics(new Set());
    setEpistemicEdits({});
    setEditingEpistemicField(null);
    setIsEditing(false);
    setEditedFields({});
  };

  const startEditing = () => {
    if (extractedFields) {
      setEditedFields({ ...extractedFields });
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
      const hasEdits = Object.values(editedFields).some(v => v);
      const hasEpistemicEdits = Object.keys(epistemicEdits).length > 0;
      const agreedFields = Object.entries(fieldAgreement)
        .filter(([_, v]) => v === true)
        .map(([k]) => k);

      // Get current user ID from supabase
      const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
      if (!user) throw new Error("Not authenticated");

      await recordDecision({
        p_extraction_id: current.extraction_id,
        p_decision: "accept",
        p_reviewer_id: user.id,
        p_decision_reason: hasEdits || hasEpistemicEdits
          ? `Mobile review - approved with corrections`
          : `Mobile review - approved. Verified: ${agreedFields.join(", ") || "reviewed"}`,
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

      // Get current user ID from supabase
      const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
      if (!user) throw new Error("Not authenticated");

      await recordDecision({
        p_extraction_id: current.extraction_id,
        p_decision: "reject",
        p_reviewer_id: user.id,
        p_decision_reason: disagreedFields.length > 0
          ? `${reason}. Issues with: ${disagreedFields.join(", ")}`
          : reason,
        p_rejection_category: "other",
      });
      goNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check review progress
  const anyFieldDisagreed = Object.values(fieldAgreement).some(v => v === false);
  const hasReviewedSomeFields = Object.keys(fieldAgreement).length > 0;

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
        <Button onClick={() => refresh()} variant="outline" className="border-[#334155] text-[#cbd5e1]">
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
  const fields = extractedFields!;

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

        {/* EXTRACTION FIELDS - Coupling or Entity */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#64748b] uppercase tracking-wider">
              {isCoupling ? "Coupling Details" : "Entity Details"}
            </span>
            {!isEditing && (
              <span className="text-xs text-[#64748b]">👍 agree · 👎 disagree</span>
            )}
          </div>

          {/* FROM → TO visual (for couplings) */}
          {!isEditing && isCoupling && (fields.from_component || fields.to_component) && (
            <div className="flex items-center justify-center gap-2 mb-4 py-3 bg-[#334155]/30 rounded-lg">
              <span className="text-[#e2e8f0] font-medium text-sm truncate max-w-[40%]">
                {fields.from_component || "?"}
              </span>
              <ArrowRight className="h-4 w-4 text-[#06b6d4] flex-shrink-0" />
              <span className="text-[#e2e8f0] font-medium text-sm truncate max-w-[40%]">
                {fields.to_component || "?"}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {fieldsToShow.map((field) => {
              const extractedValue = fields[field.id as keyof typeof fields] || "";
              const editValue = isEditing ? (editedFields[field.id] || "") : extractedValue;
              const agreement = fieldAgreement[field.id];
              const hasNoData = !extractedValue;

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
                      value={editValue}
                      onChange={(e) => setEditedFields(prev => ({
                        ...prev,
                        [field.id]: e.target.value
                      }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 bg-[#334155] border border-[#475569] rounded-lg text-[#e2e8f0] text-sm placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/50"
                    />
                  ) : hasNoData ? (
                    // NO DATA EXTRACTED - explicit message
                    <div className={`px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 ${
                      agreement === false ? "ring-1 ring-red-500/50" : ""
                    } ${agreement === true ? "ring-1 ring-green-500/50" : ""}`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-amber-300">No data extracted</p>
                          <p className="text-xs text-[#94a3b8] mt-0.5">
                            Tap <Edit2 className="h-3 w-3 inline" /> to enter if known
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm px-3 py-2 rounded-lg text-[#e2e8f0] bg-[#334155]/30 ${
                      agreement === false ? "ring-1 ring-red-500/50" : ""
                    } ${agreement === true ? "ring-1 ring-green-500/50" : ""}`}>
                      {extractedValue}
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

        {/* EPISTEMIC METADATA - The 7 Questions */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#64748b] uppercase tracking-wider">Knowledge Metadata</span>
            {epistemics && (
              <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                {verifiedEpistemics.size}/{EPISTEMIC_GROUPS.flatMap(g => g.fields).length} verified
              </Badge>
            )}
          </div>

          {epistemics ? (
            <div className="space-y-3">
              {EPISTEMIC_GROUPS.map((group) => (
                <div key={group.id} className="border border-[#334155]/50 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-[#334155]/30">
                    <span className="text-xs font-medium text-[#94a3b8]">{group.question}</span>
                  </div>
                  <div className="p-2 space-y-2">
                    {group.fields.map((field) => {
                      const value = field.getValue(epistemics);
                      const isVerified = verifiedEpistemics.has(field.id);
                      const editedValue = epistemicEdits[field.id];
                      const displayValue = editedValue ?? value;
                      const hasNoData = !displayValue;
                      const isEditingThis = editingEpistemicField === field.id;

                      return (
                        <div key={field.id} className="flex items-center gap-2">
                          <span className="text-xs text-[#64748b] w-20 flex-shrink-0">{field.label}:</span>
                          <div className="flex-1 min-w-0">
                            {isEditingThis ? (
                              <input
                                type="text"
                                value={epistemicEdits[field.id] ?? value ?? ""}
                                onChange={(e) => setEpistemicEdits(prev => ({
                                  ...prev,
                                  [field.id]: e.target.value
                                }))}
                                onBlur={() => setEditingEpistemicField(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") setEditingEpistemicField(null);
                                  if (e.key === "Escape") {
                                    setEpistemicEdits(prev => {
                                      const next = { ...prev };
                                      delete next[field.id];
                                      return next;
                                    });
                                    setEditingEpistemicField(null);
                                  }
                                }}
                                autoFocus
                                className="w-full px-2 py-1 bg-[#334155] border border-[#06b6d4] rounded text-xs text-[#e2e8f0] focus:outline-none"
                                placeholder="Enter value..."
                              />
                            ) : hasNoData ? (
                              <button
                                onClick={() => setEditingEpistemicField(field.id)}
                                className="text-xs text-amber-400 flex items-center gap-1 hover:text-amber-300"
                              >
                                <AlertCircle className="h-3 w-3" />
                                <span>Not extracted - tap to add</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingEpistemicField(field.id)}
                                className={`text-xs truncate block text-left w-full hover:underline ${
                                  editedValue ? "text-[#06b6d4]" : "text-[#e2e8f0]"
                                }`}
                              >
                                {displayValue}
                                {editedValue && <span className="text-[#64748b] ml-1">(edited)</span>}
                              </button>
                            )}
                          </div>
                          {!isEditingThis && (
                            <>
                              <button
                                onClick={() => setEditingEpistemicField(field.id)}
                                className="p-1 rounded bg-[#334155]/50 text-[#64748b] hover:text-[#06b6d4] flex-shrink-0"
                                title="Edit"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setVerifiedEpistemics(prev => {
                                  const next = new Set(prev);
                                  if (next.has(field.id)) {
                                    next.delete(field.id);
                                  } else {
                                    next.add(field.id);
                                  }
                                  return next;
                                })}
                                className={`p-1 rounded transition-all flex-shrink-0 ${
                                  isVerified
                                    ? "bg-green-500/30 text-green-400"
                                    : "bg-[#334155]/50 text-[#64748b]"
                                }`}
                                title="Verify"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // No epistemics from agent - allow manual entry
            <div className="space-y-3">
              <div className="px-3 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-300">No metadata extracted by agent</p>
                    <p className="text-xs text-[#94a3b8] mt-1">
                      Tap any field below to add what you know.
                    </p>
                  </div>
                </div>
              </div>
              {/* Show empty fields for manual entry when no epistemics */}
              {EPISTEMIC_GROUPS.map((group) => (
                <div key={group.id} className="border border-[#334155]/50 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-[#334155]/30">
                    <span className="text-xs font-medium text-[#94a3b8]">{group.question}</span>
                  </div>
                  <div className="p-2 space-y-2">
                    {group.fields.map((field) => {
                      const editedValue = epistemicEdits[field.id];
                      const isEditingThis = editingEpistemicField === field.id;

                      return (
                        <div key={field.id} className="flex items-center gap-2">
                          <span className="text-xs text-[#64748b] w-20 flex-shrink-0">{field.label}:</span>
                          <div className="flex-1 min-w-0">
                            {isEditingThis ? (
                              <input
                                type="text"
                                value={editedValue ?? ""}
                                onChange={(e) => setEpistemicEdits(prev => ({
                                  ...prev,
                                  [field.id]: e.target.value
                                }))}
                                onBlur={() => setEditingEpistemicField(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") setEditingEpistemicField(null);
                                  if (e.key === "Escape") {
                                    setEpistemicEdits(prev => {
                                      const next = { ...prev };
                                      delete next[field.id];
                                      return next;
                                    });
                                    setEditingEpistemicField(null);
                                  }
                                }}
                                autoFocus
                                className="w-full px-2 py-1 bg-[#334155] border border-[#06b6d4] rounded text-xs text-[#e2e8f0] focus:outline-none"
                                placeholder="Enter value..."
                              />
                            ) : editedValue ? (
                              <button
                                onClick={() => setEditingEpistemicField(field.id)}
                                className="text-xs text-[#06b6d4] truncate block text-left w-full hover:underline"
                              >
                                {editedValue} <span className="text-[#64748b]">(added)</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingEpistemicField(field.id)}
                                className="text-xs text-[#64748b] italic hover:text-[#94a3b8]"
                              >
                                Tap to add...
                              </button>
                            )}
                          </div>
                          {!isEditingThis && (
                            <button
                              onClick={() => setEditingEpistemicField(field.id)}
                              className="p-1 rounded bg-[#334155]/50 text-[#64748b] hover:text-[#06b6d4] flex-shrink-0"
                              title="Edit"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        ) : !hasReviewedSomeFields ? (
          <div className="space-y-2">
            <p className="text-center text-sm text-[#64748b]">
              Review the fields above (👍 or 👎) or tap <Edit2 className="h-3 w-3 inline" /> to correct
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
