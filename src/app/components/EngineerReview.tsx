/**
 * EngineerReview - Review UI that captures engineer's embodied knowledge
 *
 * Engineers ARE the experts. They can evaluate both:
 * 1. Technical accuracy (is this real?)
 * 2. Epistemic grounding (how was this known? by whom?)
 *
 * The 7-question checklist maps directly to what engineers know from experience.
 *
 * WHY THIS MATTERS:
 * The metadata from your answers becomes edge features in the Knowledge Graph.
 * A Graph Neural Network uses these features to:
 * - Weight predictions based on epistemic grounding (tribal vs documented)
 * - Flag knowledge at risk of loss (someone leaves = edge weakens)
 * - Trigger refresh when staleness thresholds cross
 * - Predict transfer difficulty for onboarding new team members
 *
 * Your embodied knowledge makes the neural network smarter.
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
  ArrowRight,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  Database,
  Link2,
  Clock,
  Timer,
  User,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Network,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import type { ReviewExtractionDTO } from "@/types/review";

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
    icon: Eye,
    color: "border-blue-200 bg-blue-50",
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
    icon: Database,
    color: "border-purple-200 bg-purple-50",
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
    icon: Link2,
    color: "border-green-200 bg-green-50",
    freeform: true,
    placeholder: "e.g., I2C bus, power system, thermal manager...",
  },
  {
    id: "conditions",
    num: 4,
    question: "When is this true?",
    engineerPrompt: "What conditions or assumptions need to hold?",
    icon: Clock,
    color: "border-yellow-200 bg-yellow-50",
    freeform: true,
    placeholder: "e.g., Only at room temp, only with firmware v2.1, only on rev C boards...",
  },
  {
    id: "validity",
    num: 5,
    question: "How current is this?",
    engineerPrompt: "Does this age out or need rechecking?",
    icon: Timer,
    color: "border-orange-200 bg-orange-50",
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
    icon: User,
    color: "border-indigo-200 bg-indigo-50",
    freeform: true,
    placeholder: "e.g., Sarah (thermal lead), the F' team, hardware docs...",
  },
  {
    id: "practice",
    num: 7,
    question: "Do you need to DO this to understand it?",
    engineerPrompt: "Can you learn this from reading, or do you need hands-on practice?",
    icon: RotateCw,
    color: "border-red-200 bg-red-50",
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
// TYPES
// =============================================================================

interface CaptureAnswers {
  observer?: string;
  storage?: string;
  dependencies?: string;
  conditions?: string;
  validity?: string;
  authorship?: string;
  practice?: string;
}

interface EngineerReviewProps {
  extraction: ReviewExtractionDTO;
  onApprove: (notes?: string, captureAnswers?: CaptureAnswers) => Promise<void>;
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
      </Card>

      {/* Technical Accuracy */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Is this accurate?</h2>
        <div className="space-y-3">
          {[
            { id: "exists", question: "Does this actually exist?", description: "Is this real, not hallucinated?" },
            { id: "evidence", question: "Does the evidence support this?", description: "Does the quote say what the AI claims?" },
            { id: "accurate", question: "Are the details correct?", description: "Names, interfaces, behavior?" },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-1">
                <button
                  onClick={() => setAccuracyChecks(prev => ({ ...prev, [item.id]: true }))}
                  className={`p-1.5 rounded ${
                    accuracyChecks[item.id] === true
                      ? "bg-green-100 text-green-600 ring-2 ring-green-300"
                      : "bg-white text-gray-400 hover:text-green-500"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setAccuracyChecks(prev => ({ ...prev, [item.id]: false }))}
                  className={`p-1.5 rounded ${
                    accuracyChecks[item.id] === false
                      ? "bg-red-100 text-red-600 ring-2 ring-red-300"
                      : "bg-white text-gray-400 hover:text-red-500"
                  }`}
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

      {/* WHY THIS MATTERS - GNN Explanation */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Network className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-indigo-900 mb-2">
              Your Answers Power the Knowledge Graph
            </h2>
            <p className="text-sm text-indigo-800 mb-3">
              This isn't busywork. Your metadata becomes <strong>edge features</strong> in a Graph Neural Network that helps the entire community.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles className="h-4 w-4" />
                <span>Weights predictions by confidence</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-700">
                <AlertCircle className="h-4 w-4" />
                <span>Flags knowledge at risk of loss</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-700">
                <RefreshCw className="h-4 w-4" />
                <span>Triggers refresh when stale</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-700">
                <Users className="h-4 w-4" />
                <span>Predicts onboarding difficulty</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Knowledge Capture - The 7 Questions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Knowledge Metadata</h2>
          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
            Feeds the Neural Network
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Answer what you know from your experience. Each answer becomes a signal the system learns from.
        </p>

        <div className="space-y-3">
          {CAPTURE_QUESTIONS.map((q) => {
            const Icon = q.icon;
            const isExpanded = expandedQuestions[q.id];
            const hasAnswer = !!captureAnswers[q.id as keyof CaptureAnswers];

            return (
              <div key={q.id} className={`border rounded-lg ${q.color}`}>
                <button
                  onClick={() => toggleQuestion(q.id)}
                  className="w-full p-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <div>
                      <span className="font-medium">{q.question}</span>
                      {hasAnswer && (
                        <CheckCircle className="h-4 w-4 text-green-500 inline ml-2" />
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3">
                    <p className="text-sm text-gray-600 mb-2">{q.engineerPrompt}</p>

                    {q.freeform ? (
                      <Input
                        placeholder={q.placeholder}
                        value={captureAnswers[q.id as keyof CaptureAnswers] || ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        className="bg-white"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {q.options?.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setAnswer(q.id, opt.value)}
                            className={`p-2 text-left text-sm rounded border transition-all ${
                              captureAnswers[q.id as keyof CaptureAnswers] === opt.value
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
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
      </Card>

      {/* Decision */}
      <Card className="p-6">
        {!showRejectForm ? (
          <div className="space-y-4">
            {/* Status messages */}
            {!allAccuracyAnswered && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">Answer the accuracy questions above</span>
              </div>
            )}

            {anyAccuracyFailed && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">Something is wrong - please reject with a reason</span>
              </div>
            )}

            {allAccuracyPassed && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">Ready to approve</span>
                </div>
                <Textarea
                  placeholder="Any additional notes..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  rows={2}
                />
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove(approveNotes, captureAnswers)}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve - Add to Library
                </Button>
              </div>
            )}

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
            </div>
          </div>
        ) : (
          /* Reject form */
          <div className="space-y-4">
            <h3 className="font-semibold">Why should this be rejected?</h3>

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
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
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
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRejectForm(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
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
      <div className="text-center text-sm text-gray-500 space-y-1">
        <div>
          <Network className="h-4 w-4 inline mr-1" />
          <strong>Library</strong> → <strong>Knowledge Metadata</strong> → <strong>Graph Neural Network</strong>
        </div>
        <div className="text-xs text-gray-400">
          Your expertise becomes intelligence the whole community can query
        </div>
      </div>
    </div>
  );
}
