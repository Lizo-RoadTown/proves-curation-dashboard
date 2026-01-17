/**
 * ExtractionDetail - Human review interface for a single extraction
 *
 * Shows 5 sections:
 * 1. Evidence (quote, source, lineage verification)
 * 2. AI Reasoning (rationale summary, uncertainty factors)
 * 3. Duplicate Check (exact/similar matches, merge recommendation)
 * 4. Entity Payload (editable fields)
 * 5. Decision (approve/modify/reject with structured feedback)
 */

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { Slider } from "@/app/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/app/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Shield,
  ShieldAlert,
  GitMerge,
  Edit3,
  Save,
  Loader2,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { useReviewExtractions } from "@/hooks/useReviewExtractions";
import type {
  ReviewExtractionDTO,
  RejectionCategory,
  ReviewFormState,
  PayloadDiff,
} from "@/types/review";
import {
  REJECTION_LABELS,
  REJECTION_GROUPS,
  computePayloadDiff,
} from "@/types/review";

// =============================================================================
// TYPES
// =============================================================================

interface ExtractionDetailProps {
  extractionId: string;
  onBack: () => void;
  reviewerId?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ExtractionDetail({ extractionId, onBack, reviewerId = "dashboard_user" }: ExtractionDetailProps) {
  const {
    currentExtraction,
    loadingDetail,
    error,
    fetchExtractionById,
    recordDecision,
    recordEdit,
  } = useReviewExtractions();

  // UI State
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expandable sections
  const [evidenceExpanded, setEvidenceExpanded] = useState(true);
  const [reasoningExpanded, setReasoningExpanded] = useState(true);
  const [duplicateExpanded, setDuplicateExpanded] = useState(true);
  const [payloadExpanded, setPayloadExpanded] = useState(true);

  // Form state
  const [formState, setFormState] = useState<ReviewFormState>({
    editedPayload: {},
    hasUnsavedEdits: false,
    decision: null,
    rejectionCategory: null,
    decisionReason: "",
    confidenceOverride: null,
    confidenceOverrideReason: "",
    sourceFlagged: false,
    sourceFlagReason: "",
  });

  // Fetch extraction on mount
  useEffect(() => {
    fetchExtractionById(extractionId);
  }, [extractionId, fetchExtractionById]);

  // Initialize form state when extraction loads
  useEffect(() => {
    if (currentExtraction) {
      setFormState(prev => ({
        ...prev,
        editedPayload: { ...currentExtraction.candidate_payload },
      }));
    }
  }, [currentExtraction]);

  // Compute payload diff
  const payloadDiff = useMemo<PayloadDiff[]>(() => {
    if (!currentExtraction) return [];
    return computePayloadDiff(
      currentExtraction.candidate_payload,
      formState.editedPayload
    );
  }, [currentExtraction, formState.editedPayload]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handlePayloadFieldChange = (field: string, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      editedPayload: { ...prev.editedPayload, [field]: value },
      hasUnsavedEdits: true,
    }));
  };

  const handleSaveEdits = async () => {
    if (!currentExtraction) return;

    setIsSubmitting(true);
    try {
      await recordEdit({
        p_extraction_id: extractionId,
        p_reviewer_id: reviewerId,
        p_before_payload: currentExtraction.candidate_payload,
        p_after_payload: formState.editedPayload,
        p_edit_reason: "Manual edits during review",
        p_apply_to_extraction: true,
      });
      setFormState(prev => ({ ...prev, hasUnsavedEdits: false }));
    } catch (err) {
      console.error("Failed to save edits:", err);
      alert(`Failed to save edits: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!currentExtraction) return;

    setIsSubmitting(true);
    try {
      // If there are unsaved edits, save them first
      if (formState.hasUnsavedEdits) {
        await recordEdit({
          p_extraction_id: extractionId,
          p_reviewer_id: reviewerId,
          p_before_payload: currentExtraction.candidate_payload,
          p_after_payload: formState.editedPayload,
          p_edit_reason: "Edits before approval",
        });
      }

      await recordDecision({
        p_extraction_id: extractionId,
        p_decision: "accept",
        p_reviewer_id: reviewerId,
        p_decision_reason: formState.decisionReason || "Approved via dashboard",
        p_human_confidence_override: formState.confidenceOverride ?? undefined,
        p_confidence_override_reason: formState.confidenceOverrideReason || undefined,
        p_source_flagged: formState.sourceFlagged,
        p_source_flag_reason: formState.sourceFlagReason || undefined,
      });

      setShowApproveDialog(false);
      onBack();
    } catch (err) {
      console.error("Failed to approve:", err);
      alert(`Failed to approve: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!currentExtraction) return;
    if (!formState.rejectionCategory) {
      alert("Please select a rejection category");
      return;
    }

    setIsSubmitting(true);
    try {
      await recordDecision({
        p_extraction_id: extractionId,
        p_decision: "reject",
        p_reviewer_id: reviewerId,
        p_rejection_category: formState.rejectionCategory,
        p_decision_reason: formState.decisionReason || undefined,
        p_human_confidence_override: formState.confidenceOverride ?? undefined,
        p_confidence_override_reason: formState.confidenceOverrideReason || undefined,
        p_source_flagged: formState.sourceFlagged,
        p_source_flag_reason: formState.sourceFlagReason || undefined,
      });

      setShowRejectDialog(false);
      onBack();
    } catch (err) {
      console.error("Failed to reject:", err);
      alert(`Failed to reject: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderLineageStatus = () => {
    if (!currentExtraction) return null;
    const { lineage } = currentExtraction;

    if (lineage.verified && lineage.confidence >= 0.9) {
      return (
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified (exact match)
        </Badge>
      );
    } else if (lineage.verified && lineage.confidence >= 0.7) {
      return (
        <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Verified (normalized)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
          <XCircle className="w-3 h-3 mr-1" />
          Not verified
        </Badge>
      );
    }
  };

  const renderConfidenceBar = (score: number) => {
    const color = score >= 0.8 ? "bg-green-500" : score >= 0.5 ? "bg-yellow-500" : "bg-red-500";
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${score * 100}%` }} />
        </div>
        <span className="text-sm font-semibold">{Math.round(score * 100)}%</span>
      </div>
    );
  };

  // =============================================================================
  // LOADING / ERROR STATES
  // =============================================================================

  if (loadingDetail || !currentExtraction) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading extraction...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>
    );
  }

  const { evidence, confidence, snapshot, lineage } = currentExtraction;

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{currentExtraction.candidate_key}</h2>
            <p className="text-sm text-gray-600">
              {currentExtraction.candidate_type} &middot; {currentExtraction.ecosystem || "unknown"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderLineageStatus()}
          <Badge variant="outline">{currentExtraction.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Evidence Section */}
          <Card className="p-6">
            <Collapsible open={evidenceExpanded} onOpenChange={setEvidenceExpanded}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  1. Evidence
                  <span className="text-xs text-gray-500 font-normal">(Source verification)</span>
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {evidenceExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-4">
                {/* Quote */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Extracted Evidence
                  </label>
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm italic">
                      {evidence.raw_text || "No evidence text available"}
                    </p>
                  </div>
                </div>

                {/* Source */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Source</label>
                    <p className="text-sm text-gray-600">{snapshot.source_url || "Unknown source"}</p>
                  </div>
                  {snapshot.source_url && (
                    <a
                      href={snapshot.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Open Source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Lineage details */}
                {evidence.byte_offset !== null && (
                  <div className="text-xs text-gray-500">
                    Byte offset: {evidence.byte_offset} | Length: {evidence.byte_length} |
                    Checksum: {evidence.checksum?.slice(0, 12)}...
                  </div>
                )}

                {/* Full context toggle */}
                {snapshot.context_excerpt && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        Show Full Context <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="p-4 bg-gray-50 rounded border max-h-64 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {snapshot.context_excerpt}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* 2. AI Reasoning Section */}
          <Card className="p-6">
            <Collapsible open={reasoningExpanded} onOpenChange={setReasoningExpanded}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  2. AI Reasoning
                  <span className="text-xs text-gray-500 font-normal">(Why this was extracted)</span>
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {reasoningExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-4">
                {/* Confidence */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Confidence: {Math.round(confidence.score * 100)}%
                  </label>
                  {renderConfidenceBar(confidence.score)}
                  <p className="text-sm text-gray-600 mt-2">{confidence.reason}</p>
                </div>

                {/* Signals observed */}
                {evidence.rationale_summary.signals_observed.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Signals Observed
                    </label>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {evidence.rationale_summary.signals_observed.map((signal, i) => (
                        <li key={i}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Comparisons made */}
                {evidence.rationale_summary.comparisons_made.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Comparisons Made
                    </label>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {evidence.rationale_summary.comparisons_made.map((comp, i) => (
                        <li key={i}>{comp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Uncertainty factors */}
                {evidence.rationale_summary.uncertainty_factors.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <label className="text-sm font-medium text-yellow-800 mb-2 block flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Uncertainty Factors
                    </label>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {evidence.rationale_summary.uncertainty_factors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* 3. Duplicate Check Section */}
          <Card className="p-6">
            <Collapsible open={duplicateExpanded} onOpenChange={setDuplicateExpanded}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  3. Duplicate Check
                  {evidence.duplicate_check.similar_entities.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {evidence.duplicate_check.similar_entities.length} similar
                    </Badge>
                  )}
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {duplicateExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-4">
                {/* AI recommendation */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">AI Recommendation:</span>
                  <Badge variant={
                    evidence.duplicate_check.recommendation === 'create_new' ? 'secondary' :
                    evidence.duplicate_check.recommendation === 'merge_with' ? 'outline' : 'destructive'
                  }>
                    {evidence.duplicate_check.recommendation === 'create_new' && "Create New Entity"}
                    {evidence.duplicate_check.recommendation === 'merge_with' && "Consider Merging"}
                    {evidence.duplicate_check.recommendation === 'needs_review' && "Needs Manual Review"}
                  </Badge>
                </div>

                {/* Exact matches */}
                {evidence.duplicate_check.exact_matches.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <label className="text-sm font-medium text-red-800 mb-2 block">
                      Exact Matches Found
                    </label>
                    <ul className="text-sm text-red-700">
                      {evidence.duplicate_check.exact_matches.map((id, i) => (
                        <li key={i} className="font-mono">{id}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Similar entities */}
                {evidence.duplicate_check.similar_entities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Similar Entities
                    </label>
                    <div className="space-y-2">
                      {evidence.duplicate_check.similar_entities.map((entity, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{entity.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({Math.round(entity.similarity * 100)}% similar)</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <GitMerge className="h-3 w-3 mr-1" />
                            Merge
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {evidence.duplicate_check.exact_matches.length === 0 && evidence.duplicate_check.similar_entities.length === 0 && (
                  <p className="text-sm text-gray-500">No duplicates or similar entities found.</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* 4. Entity Payload Section */}
          <Card className="p-6">
            <Collapsible open={payloadExpanded} onOpenChange={setPayloadExpanded}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  4. Entity Payload
                  <span className="text-xs text-gray-500 font-normal">(Editable)</span>
                  {formState.hasUnsavedEdits && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      Unsaved changes
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {formState.hasUnsavedEdits && (
                    <Button variant="outline" size="sm" onClick={handleSaveEdits} disabled={isSubmitting}>
                      <Save className="h-4 w-4 mr-1" />
                      Save Edits
                    </Button>
                  )}
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {payloadExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <CollapsibleContent className="space-y-4">
                {Object.entries(formState.editedPayload).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-700 capitalize">{key}</label>
                    {typeof value === "string" ? (
                      <Input
                        value={value}
                        onChange={(e) => handlePayloadFieldChange(key, e.target.value)}
                        className="mt-1"
                      />
                    ) : Array.isArray(value) ? (
                      <Input
                        value={value.join(", ")}
                        onChange={(e) => handlePayloadFieldChange(key, e.target.value.split(", ").filter(Boolean))}
                        className="mt-1"
                        placeholder="Comma-separated values"
                      />
                    ) : (
                      <Textarea
                        value={JSON.stringify(value, null, 2)}
                        onChange={(e) => {
                          try {
                            handlePayloadFieldChange(key, JSON.parse(e.target.value));
                          } catch {
                            // Invalid JSON, keep as string
                          }
                        }}
                        className="mt-1 font-mono text-xs"
                        rows={3}
                      />
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>

        {/* Right Column - Decision Panel */}
        <div className="space-y-6">
          {/* Decision Actions */}
          <Card className="p-6 sticky top-6">
            <h3 className="font-semibold mb-4">5. Review Decision</h3>

            <div className="space-y-4">
              {/* Approve */}
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setShowApproveDialog(true)}
                disabled={isSubmitting}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <p className="text-xs text-gray-600">Add to verified library.</p>

              {/* Show diff and approve */}
              {formState.hasUnsavedEdits && (
                <Button
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => setShowDiffDialog(true)}
                  disabled={isSubmitting}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Review Changes & Approve
                </Button>
              )}

              {/* Reject */}
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setShowRejectDialog(true)}
                disabled={isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <p className="text-xs text-gray-600">Requires a structured reason.</p>
            </div>

            {/* Optional: Confidence Override */}
            <div className="mt-6 pt-4 border-t">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Confidence Override (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Disagree with AI's {Math.round(confidence.score * 100)}% confidence?
              </p>
              <Slider
                value={[formState.confidenceOverride !== null ? formState.confidenceOverride * 100 : confidence.score * 100]}
                onValueChange={([value]) => {
                  const newValue = value / 100;
                  setFormState(prev => ({
                    ...prev,
                    confidenceOverride: Math.abs(newValue - confidence.score) > 0.05 ? newValue : null,
                  }));
                }}
                max={100}
                step={5}
                className="w-full"
              />
              {formState.confidenceOverride !== null && (
                <div className="mt-2">
                  <Input
                    placeholder="Why do you disagree with the confidence?"
                    value={formState.confidenceOverrideReason}
                    onChange={(e) => setFormState(prev => ({ ...prev, confidenceOverrideReason: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            {/* Optional: Source Flag */}
            <div className="mt-4 pt-4 border-t">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formState.sourceFlagged}
                  onChange={(e) => setFormState(prev => ({ ...prev, sourceFlagged: e.target.checked }))}
                  className="rounded"
                />
                <ShieldAlert className="h-4 w-4 text-yellow-600" />
                Flag source as questionable
              </label>
              {formState.sourceFlagged && (
                <Input
                  placeholder="Why is this source questionable?"
                  value={formState.sourceFlagReason}
                  onChange={(e) => setFormState(prev => ({ ...prev, sourceFlagReason: e.target.value }))}
                  className="mt-2 text-sm"
                />
              )}
            </div>
          </Card>

          {/* Help Panel */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold mb-1">Review Guidelines</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>&bull; Verify evidence matches the entity</li>
                  <li>&bull; Check for duplicates before approving</li>
                  <li>&bull; Edit payload fields if needed</li>
                  <li>&bull; Flag questionable sources</li>
                  <li>&bull; Override confidence if you disagree</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve This Extraction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add "{currentExtraction.candidate_key}" to the verified library.
              {formState.hasUnsavedEdits && " Your edits will be saved."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700">Approval notes (optional)</label>
            <Textarea
              placeholder="Any notes about this approval..."
              value={formState.decisionReason}
              onChange={(e) => setFormState(prev => ({ ...prev, decisionReason: e.target.value }))}
              rows={2}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject This Extraction?</AlertDialogTitle>
            <AlertDialogDescription>
              Select a reason to help improve future extractions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            {/* Rejection category dropdown */}
            <div>
              <label className="text-sm font-medium text-gray-700">Rejection Category *</label>
              <Select
                value={formState.rejectionCategory || ""}
                onValueChange={(value) => setFormState(prev => ({ ...prev, rejectionCategory: value as RejectionCategory }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REJECTION_GROUPS).map(([family, { label, categories }]) => (
                    <SelectGroup key={family}>
                      <SelectLabel>{label}</SelectLabel>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {REJECTION_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional notes */}
            <div>
              <label className="text-sm font-medium text-gray-700">Additional notes (optional)</label>
              <Textarea
                placeholder="Explain why this extraction should be rejected..."
                value={formState.decisionReason}
                onChange={(e) => setFormState(prev => ({ ...prev, decisionReason: e.target.value }))}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isSubmitting || !formState.rejectionCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diff Preview Dialog */}
      <AlertDialog open={showDiffDialog} onOpenChange={setShowDiffDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Review Your Changes</AlertDialogTitle>
            <AlertDialogDescription>
              The following changes will be saved before approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            {payloadDiff.length > 0 ? (
              <div className="space-y-2">
                {payloadDiff.map((diff, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-sm capitalize">{diff.field}</div>
                    {diff.changeType === 'added' && (
                      <div className="text-sm text-green-600">+ {JSON.stringify(diff.newValue)}</div>
                    )}
                    {diff.changeType === 'removed' && (
                      <div className="text-sm text-red-600">- {JSON.stringify(diff.oldValue)}</div>
                    )}
                    {diff.changeType === 'modified' && (
                      <>
                        <div className="text-sm text-red-600">- {JSON.stringify(diff.oldValue)}</div>
                        <div className="text-sm text-green-600">+ {JSON.stringify(diff.newValue)}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No changes detected.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes & Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
