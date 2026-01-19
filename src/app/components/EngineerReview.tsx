/**
 * EngineerReview - Side-by-side comparison for training extractors
 *
 * PURPOSE: This is a TRAINING interface.
 * - Left side: What the AI extractor found (read-only)
 * - Right side: What the human corrects/confirms
 *
 * The comparison data feeds back into improving extractors:
 * - Where did the extractor get it right?
 * - Where did the extractor miss or hallucinate?
 * - What patterns should we train on?
 *
 * Engineers ARE the experts. Their corrections train the system.
 */

import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import type { ReviewExtractionDTO, ReviewEpistemics } from "@/types/review";

// =============================================================================
// THE 7 CAPTURE QUESTIONS - SIMPLIFIED FOR ENGINEERS
// =============================================================================

/**
 * The 7 questions, phrased for engineers to answer from their experience
 */
export const CAPTURE_QUESTIONS = [
  {
    id: "observer",
    num: 1,
    question: "Who figured this out?",
    engineerPrompt: "Was this learned from testing, from docs, or does someone just know it?",
    options: [
      { value: "hands_on", label: "Hands-on testing/experience", contact: 0.9 },
      { value: "someone_knows", label: "Someone on the team knows this", contact: 0.7 },
      { value: "from_sensors", label: "From sensor data/telemetry", contact: 0.6 },
      { value: "from_docs", label: "From documentation/specs", contact: 0.3 },
      { value: "unknown", label: "Not sure", contact: 0.2 },
    ],
  },
  {
    id: "storage",
    num: 2,
    question: "Where does this knowledge live?",
    engineerPrompt: "Is this written down, or does someone just know it?",
    options: [
      { value: "documented", label: "Written in docs/wiki/readme" },
      { value: "in_code", label: "In the code (comments, config)" },
      { value: "tribal", label: "Someone's head (tribal knowledge)" },
      { value: "mixed", label: "Partially documented" },
      { value: "unknown", label: "Not sure" },
    ],
  },
  {
    id: "dependencies",
    num: 3,
    question: "What else does this connect to?",
    engineerPrompt: "Add any components/systems this depends on or affects",
    freeform: true,
    placeholder: "e.g., I2C bus, power system, thermal manager...",
  },
  {
    id: "conditions",
    num: 4,
    question: "When is this true?",
    engineerPrompt: "What conditions or assumptions need to hold?",
    freeform: true,
    placeholder: "e.g., Only at room temp, only with firmware v2.1, only on rev C boards...",
  },
  {
    id: "validity",
    num: 5,
    question: "How current is this?",
    engineerPrompt: "Does this age out or need rechecking?",
    options: [
      { value: "stable", label: "Stable - unlikely to change" },
      { value: "per_release", label: "Check each release/version" },
      { value: "periodic", label: "Needs periodic recalibration" },
      { value: "outdated", label: "Might be outdated already" },
      { value: "unknown", label: "Not sure" },
    ],
  },
  {
    id: "authorship",
    num: 6,
    question: "Who would know more?",
    engineerPrompt: "Who wrote this or who's the expert?",
    freeform: true,
    placeholder: "e.g., Sarah (thermal lead), the F' team, hardware docs...",
  },
  {
    id: "practice",
    num: 7,
    question: "Do you need to DO this to understand it?",
    engineerPrompt: "Can you learn this from reading, or do you need hands-on practice?",
    options: [
      { value: "readable", label: "Can learn from docs/code" },
      { value: "demo", label: "Need a demo or walkthrough" },
      { value: "practice", label: "Need hands-on practice" },
      { value: "expert", label: "Need significant experience" },
      { value: "unknown", label: "Not sure" },
    ],
  },
];

// =============================================================================
// EPISTEMICS VERIFICATION - Display agent-extracted values for engineer review
// =============================================================================

interface EpistemicFieldConfig {
  id: string;
  label: string;
  getValue: (ep: ReviewEpistemics) => string | null | undefined;
  options?: { value: string; label: string }[];
  freeform?: boolean;
}

/**
 * Simplified display of the 7 Knowledge Capture Questions
 * Shows agent-extracted values with verify/edit controls
 */
const EPISTEMIC_FIELDS: { group: string; fields: EpistemicFieldConfig[] }[] = [
  {
    group: "Q1: Who knew this?",
    fields: [
      {
        id: "observer_type",
        label: "Source Type",
        getValue: (ep) => ep.observer?.type,
        options: [
          { value: "human", label: "Human expert" },
          { value: "system", label: "System/automated" },
          { value: "instrument", label: "Sensor/instrument" },
          { value: "unknown", label: "Unknown" },
        ],
      },
      {
        id: "contact_mode",
        label: "Contact Mode",
        getValue: (ep) => ep.observer?.contact_mode,
        options: [
          { value: "direct", label: "Direct observation" },
          { value: "mediated", label: "Mediated/reported" },
          { value: "effect_only", label: "Inferred from effects" },
          { value: "derived", label: "Derived/calculated" },
        ],
      },
    ],
  },
  {
    group: "Q2: Where does this live?",
    fields: [
      {
        id: "pattern_storage",
        label: "Storage",
        getValue: (ep) => ep.pattern?.storage,
        options: [
          { value: "internalized", label: "In someone's head" },
          { value: "externalized", label: "Written down" },
          { value: "mixed", label: "Partially documented" },
          { value: "unknown", label: "Unknown" },
        ],
      },
      {
        id: "signal_type",
        label: "Signal Type",
        getValue: (ep) => ep.pattern?.signal_type,
        options: [
          { value: "text", label: "Text/docs" },
          { value: "code", label: "Code" },
          { value: "spec", label: "Spec/schema" },
          { value: "log", label: "Log/telemetry" },
        ],
      },
    ],
  },
  {
    group: "Q3: What stays connected?",
    fields: [
      {
        id: "dependencies",
        label: "Dependencies",
        getValue: (ep) => ep.dependencies?.entities?.join(", ") || null,
        freeform: true,
      },
      {
        id: "sequence_role",
        label: "Role in Sequence",
        getValue: (ep) => ep.dependencies?.sequence_role,
        options: [
          { value: "precondition", label: "Precondition" },
          { value: "step", label: "Step in process" },
          { value: "outcome", label: "Outcome" },
          { value: "none", label: "None" },
        ],
      },
    ],
  },
  {
    group: "Q4: When is this true?",
    fields: [
      {
        id: "assumptions",
        label: "Assumptions",
        getValue: (ep) => ep.conditions?.assumptions?.join(", ") || null,
        freeform: true,
      },
      {
        id: "scope",
        label: "Scope",
        getValue: (ep) => ep.conditions?.scope,
        options: [
          { value: "local", label: "Local only" },
          { value: "subsystem", label: "Subsystem" },
          { value: "system", label: "System-wide" },
          { value: "general", label: "General" },
        ],
      },
    ],
  },
  {
    group: "Q5: How current is this?",
    fields: [
      {
        id: "staleness_risk",
        label: "Staleness Risk",
        getValue: (ep) => ep.temporal?.staleness_risk != null ? `${Math.round((ep.temporal.staleness_risk || 0) * 100)}%` : null,
        options: [
          { value: "0", label: "Stable" },
          { value: "0.3", label: "Low risk" },
          { value: "0.6", label: "Medium risk" },
          { value: "0.9", label: "High risk" },
        ],
      },
      {
        id: "refresh_trigger",
        label: "Refresh When",
        getValue: (ep) => ep.temporal?.refresh_trigger,
        freeform: true,
      },
    ],
  },
  {
    group: "Q6: Who wrote this?",
    fields: [
      {
        id: "intent",
        label: "Intent",
        getValue: (ep) => ep.authorship?.intent,
        options: [
          { value: "explain", label: "Explain" },
          { value: "instruct", label: "Instruct" },
          { value: "justify", label: "Justify" },
          { value: "comply", label: "Comply" },
        ],
      },
      {
        id: "uncertainty_notes",
        label: "Uncertainties",
        getValue: (ep) => ep.authorship?.uncertainty_notes,
        freeform: true,
      },
    ],
  },
  {
    group: "Q7: Need to DO it?",
    fields: [
      {
        id: "reenactment_required",
        label: "Needs Practice",
        getValue: (ep) => ep.transferability?.reenactment_required != null ? (ep.transferability.reenactment_required ? "Yes" : "No") : null,
        options: [
          { value: "true", label: "Yes - hands-on needed" },
          { value: "false", label: "No - can learn from docs" },
        ],
      },
      {
        id: "skill_transferability",
        label: "Transferability",
        getValue: (ep) => ep.transferability?.skill_transferability,
        options: [
          { value: "portable", label: "Portable" },
          { value: "conditional", label: "Conditional" },
          { value: "local", label: "Local only" },
          { value: "tacit_like", label: "Tacit/intuitive" },
        ],
      },
    ],
  },
];

// =============================================================================
// TYPES
// =============================================================================

interface EpistemicEdits {
  [fieldId: string]: string;
}

interface CaptureAnswers {
  observer?: string;
  storage?: string;
  dependencies?: string;
  conditions?: string;
  validity?: string;
  authorship?: string;
  practice?: string;
}

// Human corrections to extractor output
interface HumanCorrections {
  // For entities
  name?: string;
  description?: string;
  // For couplings
  from_component?: string;
  to_component?: string;
  via_interface?: string;
  flow?: string;
  // Common
  notes?: string;
}

interface EngineerReviewProps {
  extraction: ReviewExtractionDTO;
  onApprove: (notes?: string, captureAnswers?: CaptureAnswers, corrections?: HumanCorrections, epistemicEdits?: EpistemicEdits) => Promise<void>;
  onReject: (reason: string, category: string) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EngineerReview({
  extraction,
  onApprove,
  onReject,
  onBack,
  isSubmitting = false,
}: EngineerReviewProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCategory, setRejectCategory] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [captureAnswers, setCaptureAnswers] = useState<CaptureAnswers>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // Epistemic verification state
  const [epistemicEdits, setEpistemicEdits] = useState<EpistemicEdits>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set());

  // Human corrections - initialize from extractor data
  const [corrections, setCorrections] = useState<HumanCorrections>({});

  // Technical accuracy checks
  const [accuracyChecks, setAccuracyChecks] = useState<Record<string, boolean | null>>({
    exists: null,
    evidence: null,
    accurate: null,
  });

  const { evidence, snapshot, confidence, lineage, candidate_payload } = extraction;

  // Parse coupling info
  const from = candidate_payload.from_component || candidate_payload.source || candidate_payload.name;
  const to = candidate_payload.to_component || candidate_payload.target;
  const via = candidate_payload.via_interface;
  const flow = candidate_payload.flow?.what || candidate_payload.flow;
  const isCoupling = from && to;

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setAnswer = (questionId: string, value: string) => {
    setCaptureAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const allAccuracyPassed = Object.values(accuracyChecks).every(v => v === true);
  const anyAccuracyFailed = Object.values(accuracyChecks).some(v => v === false);
  const allAccuracyAnswered = Object.values(accuracyChecks).every(v => v !== null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-[#0f172a] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-[#cbd5e1] hover:text-[#e2e8f0] hover:bg-[#1e293b]">
          ← Back to Queue
        </Button>
        <Badge variant="outline" className={lineage.verified ? "border-[#334155] bg-[#1e293b] text-[#cbd5e1]" : "border-[#334155] bg-[#1e293b] text-[#94a3b8]"}>
          {lineage.verified ? "Source Verified" : "Unverified Source"}
        </Badge>
      </div>

      {/* SIDE-BY-SIDE COMPARISON: Extractor vs Human */}
      <Card className="p-6 bg-[#1e293b]/50 border-[#334155]">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-[#e2e8f0]">Extractor vs Human</h2>
          <Badge variant="outline" className="text-xs bg-[#334155] text-[#cbd5e1] border-[#334155]">
            Training Data
          </Badge>
        </div>
        <p className="text-sm text-[#94a3b8] mb-4">
          Left: What the AI extracted. Right: Your corrections (or confirm if correct).
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* LEFT: Extractor Output (Read-Only) */}
          <div className="border border-[#334155] rounded-lg p-4 bg-[#1e293b]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-[#cbd5e1]">AI Extractor Found</span>
            </div>

            {isCoupling ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">From Component</label>
                  <div className="px-3 py-2 bg-[#334155] text-[#e2e8f0] rounded text-sm">
                    {from as string || <span className="text-[#64748b] italic">Not detected</span>}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">To Component</label>
                  <div className="px-3 py-2 bg-[#334155] text-[#e2e8f0] rounded text-sm">
                    {to as string || <span className="text-[#64748b] italic">Not detected</span>}
                  </div>
                </div>
                {via && (
                  <div>
                    <label className="text-xs text-[#64748b] block mb-1">Via Interface</label>
                    <div className="px-3 py-2 bg-[#334155] text-[#cbd5e1] rounded text-sm">{via as string}</div>
                  </div>
                )}
                {flow && (
                  <div>
                    <label className="text-xs text-[#64748b] block mb-1">What Flows</label>
                    <div className="px-3 py-2 bg-[#334155] text-[#cbd5e1] rounded text-sm">{flow as string}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">Name</label>
                  <div className="px-3 py-2 bg-[#334155] text-[#e2e8f0] rounded text-sm">{extraction.candidate_key}</div>
                </div>
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">Type</label>
                  <div className="px-3 py-2 bg-[#334155] text-[#cbd5e1] rounded text-sm">{extraction.candidate_type}</div>
                </div>
                {candidate_payload.description && (
                  <div>
                    <label className="text-xs text-[#64748b] block mb-1">Description</label>
                    <div className="px-3 py-2 bg-[#334155] text-[#cbd5e1] rounded text-sm">{candidate_payload.description as string}</div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-[#334155]">
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Human Corrections (Editable) */}
          <div className="border border-[#334155] rounded-lg p-4 bg-[#1e293b]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-[#cbd5e1]">Your Corrections</span>
            </div>

            {isCoupling ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">From Component</label>
                  <Input
                    placeholder={from as string || "Enter correct component..."}
                    value={corrections.from_component || ""}
                    onChange={(e) => setCorrections(prev => ({ ...prev, from_component: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">To Component</label>
                  <Input
                    placeholder={to as string || "Enter correct component..."}
                    value={corrections.to_component || ""}
                    onChange={(e) => setCorrections(prev => ({ ...prev, to_component: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">Via Interface</label>
                  <Input
                    placeholder={via as string || "Enter interface..."}
                    value={corrections.via_interface || ""}
                    onChange={(e) => setCorrections(prev => ({ ...prev, via_interface: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">What Flows</label>
                  <Input
                    placeholder={flow as string || "What data/signals flow?"}
                    value={corrections.flow || ""}
                    onChange={(e) => setCorrections(prev => ({ ...prev, flow: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">Name</label>
                  <Input
                    placeholder={extraction.candidate_key}
                    value={corrections.name || ""}
                    onChange={(e) => setCorrections(prev => ({ ...prev, name: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#64748b] block mb-1">Description</label>
                  <Textarea
                    placeholder={candidate_payload.description as string || "Add description..."}
                    value={corrections.description || ""}
                    onChange={(e) => setCorrections(prev => ({ ...prev, description: e.target.value }))}
                    className="text-sm"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-[#334155]">
              <p className="text-xs text-[#64748b]">
                Leave blank if extractor was correct. Only fill in corrections.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Evidence */}
      <Card className="p-6 bg-[#1e293b]/50 border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#e2e8f0]">Evidence from Source</h2>
          {snapshot.source_url && (
            <a
              href={snapshot.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#94a3b8] hover:text-[#e2e8f0] flex items-center gap-1"
            >
              View Original <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="p-4 bg-[#334155] border-l-4 border-[#06b6d4] rounded">
          <p className="text-[#cbd5e1] italic">
            "{evidence.raw_text || "No evidence text available"}"
          </p>
        </div>
      </Card>

      {/* Technical Accuracy */}
      <Card className="p-6 bg-[#1e293b]/50 border-[#334155]">
        <h2 className="text-lg font-semibold text-[#e2e8f0] mb-4">Is this accurate?</h2>
        <div className="space-y-3">
          {[
            { id: "exists", question: "Does this actually exist?", description: "Is this real, not hallucinated?" },
            { id: "evidence", question: "Does the evidence support this?", description: "Does the quote say what the AI claims?" },
            { id: "accurate", question: "Are the details correct?", description: "Names, interfaces, behavior?" },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-[#334155]/50 rounded-lg">
              <div className="flex gap-1">
                <button
                  onClick={() => setAccuracyChecks(prev => ({ ...prev, [item.id]: true }))}
                  className={`p-1.5 rounded ${
                    accuracyChecks[item.id] === true
                      ? "bg-[#475569] text-green-400 ring-2 ring-green-500/50"
                      : "bg-[#1e293b] text-[#64748b] hover:text-green-400"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setAccuracyChecks(prev => ({ ...prev, [item.id]: false }))}
                  className={`p-1.5 rounded ${
                    accuracyChecks[item.id] === false
                      ? "bg-[#475569] text-red-400 ring-2 ring-red-500/50"
                      : "bg-[#1e293b] text-[#64748b] hover:text-red-400"
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="font-medium text-[#e2e8f0]">{item.question}</p>
                <p className="text-sm text-[#64748b]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Epistemic Metadata - Agent-extracted values for verification */}
      <Card className="p-6 bg-[#1e293b]/50 border-[#334155]">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-[#e2e8f0]">Knowledge Metadata</h2>
          <Badge variant="outline" className="text-xs bg-[#334155] text-[#cbd5e1] border-[#334155]">
            Verify Agent Extraction
          </Badge>
          {extraction.epistemics && (
            <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
              {verifiedFields.size}/{EPISTEMIC_FIELDS.flatMap(g => g.fields).length} Verified
            </Badge>
          )}
        </div>

        {extraction.epistemics ? (
          <>
            <p className="text-sm text-[#94a3b8] mb-4">
              Review what the AI extracted. Click <ThumbsUp className="h-3 w-3 inline text-green-400" /> to verify or <Edit2 className="h-3 w-3 inline text-[#06b6d4]" /> to correct.
            </p>

            <div className="space-y-4">
              {EPISTEMIC_FIELDS.map((group) => (
                <div key={group.group} className="border border-[#334155] rounded-lg bg-[#1e293b] overflow-hidden">
                  <div className="px-3 py-2 bg-[#334155]/50 border-b border-[#334155]">
                    <span className="text-sm font-medium text-[#cbd5e1]">{group.group}</span>
                  </div>
                  <div className="p-3 grid gap-2">
                    {group.fields.map((field) => {
                      const agentValue = field.getValue(extraction.epistemics!);
                      const isEditing = editingField === field.id;
                      const isVerified = verifiedFields.has(field.id);
                      const editedValue = epistemicEdits[field.id];
                      const displayValue = editedValue ?? agentValue;

                      return (
                        <div key={field.id} className="flex items-center gap-2">
                          <span className="text-xs text-[#64748b] w-24 flex-shrink-0">{field.label}:</span>

                          {isEditing ? (
                            // Edit mode
                            <div className="flex-1 flex items-center gap-2">
                              {field.freeform ? (
                                <Input
                                  value={editedValue ?? agentValue ?? ""}
                                  onChange={(e) => setEpistemicEdits(prev => ({ ...prev, [field.id]: e.target.value }))}
                                  className="flex-1 h-8 text-sm bg-[#0f172a] border-[#334155] text-[#e2e8f0]"
                                  autoFocus
                                />
                              ) : (
                                <select
                                  value={editedValue ?? agentValue ?? ""}
                                  onChange={(e) => setEpistemicEdits(prev => ({ ...prev, [field.id]: e.target.value }))}
                                  className="flex-1 h-8 text-sm rounded bg-[#0f172a] border border-[#334155] text-[#e2e8f0] px-2"
                                  autoFocus
                                >
                                  <option value="">Select...</option>
                                  {field.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              )}
                              <button
                                onClick={() => {
                                  setEditingField(null);
                                  setVerifiedFields(prev => new Set(prev).add(field.id));
                                }}
                                className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingField(null);
                                  setEpistemicEdits(prev => {
                                    const copy = { ...prev };
                                    delete copy[field.id];
                                    return copy;
                                  });
                                }}
                                className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            // Display mode
                            <div className="flex-1 flex items-center gap-2">
                              <span className={`text-sm flex-1 ${
                                displayValue
                                  ? editedValue ? "text-[#06b6d4]" : "text-[#e2e8f0]"
                                  : "text-[#64748b] italic"
                              }`}>
                                {displayValue || "Not detected"}
                                {editedValue && <span className="text-xs text-[#64748b] ml-1">(edited)</span>}
                              </span>

                              {/* Verify button */}
                              <button
                                onClick={() => setVerifiedFields(prev => {
                                  const next = new Set(prev);
                                  if (next.has(field.id)) {
                                    next.delete(field.id);
                                  } else {
                                    next.add(field.id);
                                  }
                                  return next;
                                })}
                                className={`p-1 rounded transition-all ${
                                  isVerified
                                    ? "bg-green-500/30 text-green-400 ring-1 ring-green-500/50"
                                    : "bg-[#334155] text-[#64748b] hover:text-green-400"
                                }`}
                                title={isVerified ? "Verified - click to unverify" : "Click to verify"}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>

                              {/* Edit button */}
                              <button
                                onClick={() => setEditingField(field.id)}
                                className="p-1 rounded bg-[#334155] text-[#64748b] hover:text-[#06b6d4]"
                                title="Edit this value"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Fallback: No agent epistemics, show manual entry
          <>
            <p className="text-sm text-[#94a3b8] mb-4">
              No epistemic metadata from extraction. Answer what you know from your experience.
            </p>
            <div className="space-y-3">
              {CAPTURE_QUESTIONS.map((q) => {
                const isExpanded = expandedQuestions[q.id];
                const hasAnswer = !!captureAnswers[q.id as keyof CaptureAnswers];

                return (
                  <div key={q.id} className="border border-[#334155] rounded-lg bg-[#1e293b]">
                    <button
                      onClick={() => toggleQuestion(q.id)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium text-[#e2e8f0]">{q.question}</span>
                          {hasAnswer && (
                            <CheckCircle className="h-4 w-4 text-green-400 inline ml-2" />
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-[#94a3b8]" /> : <ChevronDown className="h-4 w-4 text-[#94a3b8]" />}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3">
                        <p className="text-sm text-[#94a3b8] mb-2">{q.engineerPrompt}</p>

                        {q.freeform ? (
                          <Input
                            placeholder={q.placeholder}
                            value={captureAnswers[q.id as keyof CaptureAnswers] || ""}
                            onChange={(e) => setAnswer(q.id, e.target.value)}
                            className="bg-[#0f172a] border-[#334155] text-[#e2e8f0] placeholder:text-[#64748b]"
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {q.options?.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setAnswer(q.id, opt.value)}
                                className={`p-2 text-left text-sm rounded border transition-all ${
                                  captureAnswers[q.id as keyof CaptureAnswers] === opt.value
                                    ? "border-[#06b6d4] bg-[#334155] text-[#e2e8f0]"
                                    : "border-[#334155] bg-[#0f172a] text-[#94a3b8] hover:border-[#06b6d4]"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Decision */}
      <Card className="p-6 bg-[#1e293b]/50 border-[#334155]">
        {!showRejectForm ? (
          <div className="space-y-4">
            {/* Status messages */}
            {!allAccuracyAnswered && (
              <div className="p-3 bg-[#334155] border border-[#334155] rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#94a3b8]" />
                <span className="text-[#cbd5e1]">Answer the accuracy questions above</span>
              </div>
            )}

            {anyAccuracyFailed && (
              <div className="p-3 bg-[#334155] border border-[#334155] rounded-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="text-[#cbd5e1]">Something is wrong - please reject with a reason</span>
              </div>
            )}

            {allAccuracyPassed && (
              <div className="space-y-3">
                <div className="p-3 bg-[#334155] border border-[#334155] rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-[#cbd5e1]">Ready to approve</span>
                </div>
                <Textarea
                  placeholder="Any additional notes..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  rows={2}
                  className="bg-[#0f172a] border-[#334155] text-[#e2e8f0] placeholder:text-[#64748b]"
                />
                <Button
                  className="w-full bg-[#475569] hover:bg-[#64748b] text-[#e2e8f0]"
                  onClick={() => onApprove(approveNotes, captureAnswers, corrections, epistemicEdits)}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {Object.keys(epistemicEdits).length > 0 || Object.values(corrections).some(v => v)
                    ? "Approve with Corrections"
                    : "Approve - Extractor Correct"}
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#334155] text-[#cbd5e1] hover:bg-[#334155] hover:text-[#e2e8f0]"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        ) : (
          /* Reject form */
          <div className="space-y-4">
            <h3 className="font-semibold text-[#e2e8f0]">Why should this be rejected?</h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "hallucinated", label: "Doesn't exist / Made up" },
                { id: "wrong_evidence", label: "Evidence doesn't match" },
                { id: "inaccurate", label: "Details are wrong" },
                { id: "duplicate", label: "Already in library" },
                { id: "incomplete", label: "Missing key info" },
                { id: "other", label: "Other reason" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRejectCategory(option.id)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    rejectCategory === option.id
                      ? "border-[#06b6d4] bg-[#334155] text-[#e2e8f0]"
                      : "border-[#334155] bg-[#1e293b] text-[#94a3b8] hover:border-[#06b6d4]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="What's wrong? (helps improve the AI)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="bg-[#0f172a] border-[#334155] text-[#e2e8f0] placeholder:text-[#64748b]"
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRejectForm(false)} disabled={isSubmitting} className="border-[#334155] text-[#cbd5e1] hover:bg-[#334155]">
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#475569] hover:bg-[#64748b] text-[#e2e8f0]"
                onClick={() => onReject(rejectReason, rejectCategory)}
                disabled={!rejectCategory || !rejectReason || isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-[#64748b] space-y-1">
        <div>
          <span className="text-[#94a3b8]">Library</span> → <span className="text-[#94a3b8]">Knowledge Metadata</span> → <span className="text-[#94a3b8]">Graph Neural Network</span>
        </div>
        <div className="text-xs text-[#475569]">
          Your expertise becomes intelligence the whole community can query
        </div>
      </div>
    </div>
  );
}
