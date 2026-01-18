/**
 * ReviewForEngineers - Simplified review UI for engineers
 *
 * Engineers evaluate TECHNICAL accuracy:
 * - Is this coupling/component real?
 * - Is the evidence correct?
 * - Is the extraction accurate?
 *
 * They DON'T evaluate epistemic quality (observer coupling, interface mechanisms) -
 * that's for the researcher.
 */

import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import type { ReviewExtractionDTO } from "@/types/review";

// =============================================================================
// WHAT ENGINEERS EVALUATE
// =============================================================================

/**
 * The 4 things engineers verify:
 */
export const ENGINEER_CHECKLIST = [
  {
    id: "exists",
    question: "Does this actually exist in the system?",
    description: "Is this component/connection real, not hallucinated?",
  },
  {
    id: "evidence",
    question: "Does the evidence support this?",
    description: "Does the quoted text actually say what the AI claims?",
  },
  {
    id: "accurate",
    question: "Is the extraction accurate?",
    description: "Are the details (names, interfaces, behavior) correct?",
  },
  {
    id: "relationships",
    question: "Are there other relationships to note?",
    description: "Does this connect to other components the AI missed?",
  },
];

/**
 * What engineers CAN contribute based on their domain knowledge
 * (NOT meta-level epistemic evaluation - that's for the researcher)
 */
export const ENGINEER_CONTRIBUTIONS = {
  additionalRelationships: {
    label: "Add related components",
    hint: "This also connects to...",
  },
  corrections: {
    label: "Correct inaccuracies",
    hint: "The name should be... / This actually does...",
  },
  context: {
    label: "Add context",
    hint: "This is part of... / This only applies when...",
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface ReviewForEngineersProps {
  extraction: ReviewExtractionDTO;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (reason: string, category: string) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function ReviewForEngineers({
  extraction,
  onApprove,
  onReject,
  onBack,
  isSubmitting = false,
}: ReviewForEngineersProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCategory, setRejectCategory] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [checklistState, setChecklistState] = useState<Record<string, boolean | null>>({});

  const { evidence, snapshot, confidence, lineage, candidate_payload } = extraction;

  // Parse coupling info
  const from = candidate_payload.from_component || candidate_payload.name;
  const to = candidate_payload.to_component;
  const via = candidate_payload.via_interface;
  const flow = candidate_payload.flow?.what || candidate_payload.flow;
  const isCoupling = from && to;

  const handleChecklistChange = (id: string, value: boolean | null) => {
    setChecklistState(prev => ({ ...prev, [id]: value }));
  };

  const allChecked = Object.values(checklistState).filter(v => v !== null).length === ENGINEER_CHECKLIST.length;
  const hasFailure = Object.values(checklistState).some(v => v === false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Queue
        </Button>
        <Badge variant="outline" className={lineage.verified ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          {lineage.verified ? "Source Verified" : "Unverified Source"}
        </Badge>
      </div>

      {/* What was extracted */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">What the AI Extracted</h2>

        {isCoupling ? (
          <div className="space-y-4">
            {/* Coupling visualization */}
            <div className="flex items-center gap-3 flex-wrap p-4 bg-gray-50 rounded-lg">
              <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded font-medium">
                {from as string}
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <ArrowRight className="h-5 w-5" />
                {via && <span className="text-sm italic">via {via as string}</span>}
                <ArrowRight className="h-5 w-5" />
              </div>
              <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded font-medium">
                {to as string}
              </div>
            </div>

            {/* What flows */}
            {flow && (
              <div>
                <span className="text-sm text-gray-500">What flows:</span>
                <p className="text-gray-900">{flow as string}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900">{extraction.candidate_key}</h3>
            <p className="text-sm text-gray-500">{extraction.candidate_type}</p>
            {candidate_payload.description && (
              <p className="mt-2 text-gray-700">{candidate_payload.description as string}</p>
            )}
          </div>
        )}

        {/* AI confidence */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-gray-500">AI Confidence:</span>
          <div className={`px-2 py-1 rounded text-sm font-medium ${
            confidence.score >= 0.8 ? "bg-green-100 text-green-700" :
            confidence.score >= 0.5 ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>
            {Math.round(confidence.score * 100)}%
          </div>
          {confidence.reason && (
            <span className="text-sm text-gray-600 italic">"{confidence.reason}"</span>
          )}
        </div>
      </Card>

      {/* Evidence */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Evidence from Source</h2>
          {snapshot.source_url && (
            <a
              href={snapshot.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View Original <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-gray-800 italic">
            "{evidence.raw_text || "No evidence text available"}"
          </p>
        </div>

        {snapshot.source_url && (
          <p className="mt-2 text-sm text-gray-500">
            Source: {snapshot.source_url}
          </p>
        )}
      </Card>

      {/* Engineer Checklist */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Your Review</h2>
          <HelpCircle className="h-4 w-4 text-gray-400" title="As an engineer, verify the technical accuracy" />
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Based on your expertise, verify this extraction is technically accurate.
        </p>

        <div className="space-y-3">
          {ENGINEER_CHECKLIST.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => handleChecklistChange(item.id, true)}
                  className={`p-1.5 rounded transition-all ${
                    checklistState[item.id] === true
                      ? "bg-green-100 text-green-600 ring-2 ring-green-300"
                      : "bg-white text-gray-400 hover:text-green-500 hover:bg-green-50"
                  }`}
                  title="Yes"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleChecklistChange(item.id, false)}
                  className={`p-1.5 rounded transition-all ${
                    checklistState[item.id] === false
                      ? "bg-red-100 text-red-600 ring-2 ring-red-300"
                      : "bg-white text-gray-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title="No"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="font-medium text-gray-900">{item.question}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Decision Buttons */}
      <Card className="p-6">
        {!showRejectForm ? (
          <div className="space-y-4">
            {/* Quick approve */}
            {allChecked && !hasFailure && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">All checks passed - ready to approve</span>
                </div>
                <Textarea
                  placeholder="Optional: Add any notes about this extraction..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  rows={2}
                />
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove(approveNotes)}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve - Add to Library
                </Button>
              </div>
            )}

            {/* Warning if not all checked */}
            {!allChecked && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">Complete the checklist above before making a decision</span>
              </div>
            )}

            {/* Failure detected */}
            {hasFailure && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">You marked something as incorrect - please reject with a reason</span>
              </div>
            )}

            {/* Buttons row */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              {(!allChecked || hasFailure) && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!allChecked || hasFailure || isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Reject form */
          <div className="space-y-4">
            <h3 className="font-semibold">Why should this be rejected?</h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "hallucinated", label: "Doesn't exist / Hallucinated" },
                { id: "wrong_evidence", label: "Evidence doesn't match" },
                { id: "inaccurate", label: "Details are wrong" },
                { id: "duplicate", label: "Already in library" },
                { id: "incomplete", label: "Missing key information" },
                { id: "other", label: "Other reason" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRejectCategory(option.id)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    rejectCategory === option.id
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Explain why this extraction is incorrect (helps improve the AI)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => onReject(rejectReason, rejectCategory)}
                disabled={!rejectCategory || !rejectReason || isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Extraction
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Help text */}
      <div className="text-center text-sm text-gray-500">
        <MessageSquare className="h-4 w-4 inline mr-1" />
        Your feedback helps improve the AI's future extractions
      </div>
    </div>
  );
}
