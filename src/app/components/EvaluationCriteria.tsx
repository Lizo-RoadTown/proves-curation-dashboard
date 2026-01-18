/**
 * EvaluationCriteria - The 7 questions engineers must consider when reviewing extractions
 *
 * Based on PROVES Knowledge Capture Checklist (canon/KNOWLEDGE_CAPTURE_CHECKLIST.md)
 *
 * These questions preserve dimensional grounding and prevent information loss at interfaces.
 */

import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Database,
  Link2,
  Clock,
  Timer,
  User,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";

// =============================================================================
// THE 7 CAPTURE QUESTIONS
// =============================================================================

export const CAPTURE_QUESTIONS = [
  {
    id: "observer_coupling",
    num: 1,
    question: "Who knew this, and how close were they?",
    dimension: "Observer coupling",
    icon: Eye,
    color: "border-blue-200 bg-blue-50",
    iconColor: "text-blue-600",
    subQuestions: [
      "Was this learned by direct involvement, or secondhand?",
      "Did the knower touch the real system, or only outputs?",
      "Would someone else interpret this the same way?",
    ],
    flags: ["Embodiment loss", "Proxy replacement", "Misinterpretation"],
    mapsTo: "Position (relative to observer)",
  },
  {
    id: "pattern_storage",
    num: 2,
    question: "Where does the experience live now?",
    dimension: "Pattern storage location",
    icon: Database,
    color: "border-purple-200 bg-purple-50",
    iconColor: "text-purple-600",
    subQuestions: [
      "Is this skill or judgment carried by people?",
      "Is it written down, modeled, or logged?",
      "Does it survive if the person leaves?",
    ],
    flags: ["Observer loss", "Practice decay", "Authorship loss"],
    mapsTo: "Pattern Storage (internalized vs. externalized)",
  },
  {
    id: "relational_integrity",
    num: 3,
    question: "What has to stay connected for this to work?",
    dimension: "Relational integrity",
    icon: Link2,
    color: "border-green-200 bg-green-50",
    iconColor: "text-green-600",
    subQuestions: [
      "Does this depend on sequence, timing, or coordination?",
      "Are decisions tied to outcomes?",
      "Are pieces stored together or scattered?",
    ],
    flags: ["Fragmentation", "Silo effects", "Hidden dependencies"],
    mapsTo: "Interface mechanisms, relational structure",
  },
  {
    id: "context_preservation",
    num: 4,
    question: "Under what conditions was this true?",
    dimension: "Context preservation",
    icon: Clock,
    color: "border-yellow-200 bg-yellow-50",
    iconColor: "text-yellow-600",
    subQuestions: [
      "What assumptions were in place?",
      "What constraints mattered?",
      "Would this still hold in a different setting?",
    ],
    flags: ["Model overreach", "Context collapse"],
    mapsTo: "Formalizability, scope conditions",
  },
  {
    id: "temporal_validity",
    num: 5,
    question: "When does this stop being reliable?",
    dimension: "Temporal validity",
    icon: Timer,
    color: "border-orange-200 bg-orange-50",
    iconColor: "text-orange-600",
    subQuestions: [
      "Does this age out?",
      "Does it require recalibration?",
      "Has the system changed since this was learned?",
    ],
    flags: ["Drift", "Lifecycle mismatch"],
    mapsTo: "Temporality (snapshot vs. lifecycle)",
  },
  {
    id: "authorship_intent",
    num: 6,
    question: "Who wrote or taught this, and why?",
    dimension: "Authorship & intent",
    icon: User,
    color: "border-indigo-200 bg-indigo-50",
    iconColor: "text-indigo-600",
    subQuestions: [
      "Was this exploratory, provisional, or certain?",
      "Was it written to explain, persuade, or comply?",
      "What uncertainty was present but not recorded?",
    ],
    flags: ["Bad authorship", "Pedagogical distortion", "False authority"],
    mapsTo: "Provenance, epistemic status",
  },
  {
    id: "reenactment_dependency",
    num: 7,
    question: "Does this only work if someone keeps doing it?",
    dimension: "Reenactment dependency",
    icon: RotateCw,
    color: "border-red-200 bg-red-50",
    iconColor: "text-red-600",
    subQuestions: [
      "Does this knowledge require practice?",
      "Does it degrade without use?",
      "Can it be understood without having done it?",
    ],
    flags: ["Embodied decay", "Skill erosion"],
    mapsTo: "Pattern Storage (internalized/embodied)",
  },
];

// =============================================================================
// SCORING HELPERS
// =============================================================================

export interface QuestionScore {
  questionId: string;
  status: "good" | "concern" | "missing" | "na";
  note?: string;
}

/**
 * Calculate overall extraction quality based on question scores
 */
export function calculateQuality(scores: QuestionScore[]): {
  quality: "high" | "medium" | "low" | "incomplete";
  goodCount: number;
  concernCount: number;
  missingCount: number;
} {
  const good = scores.filter(s => s.status === "good").length;
  const concern = scores.filter(s => s.status === "concern").length;
  const missing = scores.filter(s => s.status === "missing").length;

  let quality: "high" | "medium" | "low" | "incomplete";
  if (missing >= 3) {
    quality = "incomplete";
  } else if (good >= 5 && concern <= 1) {
    quality = "high";
  } else if (concern >= 3 || missing >= 2) {
    quality = "low";
  } else {
    quality = "medium";
  }

  return { quality, goodCount: good, concernCount: concern, missingCount: missing };
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface EvaluationChecklistProps {
  /** Compact mode for sidebar */
  compact?: boolean;
  /** Current scores (for review) */
  scores?: QuestionScore[];
  /** Callback when score changes */
  onScoreChange?: (scores: QuestionScore[]) => void;
  /** Read-only mode */
  readOnly?: boolean;
}

/**
 * The main evaluation checklist component
 */
export function EvaluationChecklist({
  compact = false,
  scores = [],
  onScoreChange,
  readOnly = false,
}: EvaluationChecklistProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const handleScoreChange = (questionId: string, status: QuestionScore["status"], note?: string) => {
    if (readOnly || !onScoreChange) return;

    const newScores = [...scores];
    const existing = newScores.findIndex(s => s.questionId === questionId);
    if (existing >= 0) {
      newScores[existing] = { questionId, status, note };
    } else {
      newScores.push({ questionId, status, note });
    }
    onScoreChange(newScores);
  };

  const getScoreForQuestion = (questionId: string): QuestionScore | undefined => {
    return scores.find(s => s.questionId === questionId);
  };

  if (compact) {
    return (
      <Card className="p-3 bg-gray-50 border-gray-200">
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              7 Capture Questions
            </span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-2">
            <div className="space-y-1">
              {CAPTURE_QUESTIONS.map((q) => {
                const score = getScoreForQuestion(q.id);
                const Icon = q.icon;
                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestion(activeQuestion === q.id ? null : q.id)}
                    className={`w-full text-left p-2 rounded text-xs transition-all ${
                      activeQuestion === q.id ? q.color : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3 w-3 ${q.iconColor}`} />
                      <span className="flex-1 truncate">{q.question}</span>
                      {score && <StatusIcon status={score.status} size="sm" />}
                    </div>
                    {activeQuestion === q.id && (
                      <div className="mt-2 text-gray-600">
                        <p className="italic mb-1">{q.dimension}</p>
                        <ul className="space-y-0.5">
                          {q.subQuestions.map((sq, i) => (
                            <li key={i}>• {sq}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  // Full checklist view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Knowledge Capture Checklist</h3>
        {scores.length > 0 && (
          <QualitySummary scores={scores} />
        )}
      </div>

      <p className="text-sm text-gray-600">
        Ask these questions to preserve dimensional grounding and prevent information loss.
      </p>

      <div className="space-y-3">
        {CAPTURE_QUESTIONS.map((q) => {
          const score = getScoreForQuestion(q.id);
          const Icon = q.icon;

          return (
            <Card key={q.id} className={`p-4 border-l-4 ${q.color.replace("bg-", "border-l-").replace("-50", "-400")}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${q.color}`}>
                  <Icon className={`h-4 w-4 ${q.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-400">Q{q.num}</span>
                    <h4 className="font-medium text-gray-900">{q.question}</h4>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">{q.dimension}</p>

                  <ul className="text-sm text-gray-600 space-y-1 mb-3">
                    {q.subQuestions.map((sq, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-gray-400">•</span>
                        {sq}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Flags:</span>
                    {q.flags.map((flag, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex gap-1">
                    <ScoreButton
                      status="good"
                      active={score?.status === "good"}
                      onClick={() => handleScoreChange(q.id, "good")}
                    />
                    <ScoreButton
                      status="concern"
                      active={score?.status === "concern"}
                      onClick={() => handleScoreChange(q.id, "concern")}
                    />
                    <ScoreButton
                      status="missing"
                      active={score?.status === "missing"}
                      onClick={() => handleScoreChange(q.id, "missing")}
                    />
                  </div>
                )}

                {readOnly && score && (
                  <StatusIcon status={score.status} size="md" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface StatusIconProps {
  status: QuestionScore["status"];
  size?: "sm" | "md";
}

function StatusIcon({ status, size = "md" }: StatusIconProps) {
  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  switch (status) {
    case "good":
      return <CheckCircle className={`${sizeClass} text-green-500`} />;
    case "concern":
      return <AlertTriangle className={`${sizeClass} text-yellow-500`} />;
    case "missing":
      return <XCircle className={`${sizeClass} text-red-500`} />;
    case "na":
      return <span className={`${sizeClass} text-gray-400`}>—</span>;
  }
}

interface ScoreButtonProps {
  status: QuestionScore["status"];
  active: boolean;
  onClick: () => void;
}

function ScoreButton({ status, active, onClick }: ScoreButtonProps) {
  const baseClass = "p-1.5 rounded transition-all";
  let colorClass = "";
  let Icon = CheckCircle;

  switch (status) {
    case "good":
      Icon = CheckCircle;
      colorClass = active
        ? "bg-green-100 text-green-600 ring-2 ring-green-300"
        : "hover:bg-green-50 text-gray-400 hover:text-green-500";
      break;
    case "concern":
      Icon = AlertTriangle;
      colorClass = active
        ? "bg-yellow-100 text-yellow-600 ring-2 ring-yellow-300"
        : "hover:bg-yellow-50 text-gray-400 hover:text-yellow-500";
      break;
    case "missing":
      Icon = XCircle;
      colorClass = active
        ? "bg-red-100 text-red-600 ring-2 ring-red-300"
        : "hover:bg-red-50 text-gray-400 hover:text-red-500";
      break;
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${colorClass}`} title={status}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

interface QualitySummaryProps {
  scores: QuestionScore[];
}

function QualitySummary({ scores }: QualitySummaryProps) {
  const { quality, goodCount, concernCount, missingCount } = calculateQuality(scores);

  const qualityColors = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-red-100 text-red-800",
    incomplete: "bg-gray-100 text-gray-800",
  };

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${qualityColors[quality]}`}>
      {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality
      <span className="ml-2 text-gray-500">
        ({goodCount} good, {concernCount} concern, {missingCount} missing)
      </span>
    </div>
  );
}

// =============================================================================
// INLINE HELP COMPONENT
// =============================================================================

interface QuestionHelpProps {
  questionId: string;
}

/**
 * Inline help tooltip for a specific question
 */
export function QuestionHelp({ questionId }: QuestionHelpProps) {
  const question = CAPTURE_QUESTIONS.find(q => q.id === questionId);
  if (!question) return null;

  const Icon = question.icon;

  return (
    <div className={`p-3 rounded-lg border ${question.color}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${question.iconColor}`} />
        <span className="text-sm font-medium">{question.question}</span>
      </div>
      <ul className="text-xs text-gray-600 space-y-1">
        {question.subQuestions.map((sq, i) => (
          <li key={i}>• {sq}</li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// QUICK BADGE COMPONENT
// =============================================================================

interface CaptureQualityBadgeProps {
  scores: QuestionScore[];
  showDetails?: boolean;
}

/**
 * Small badge showing overall capture quality
 */
export function CaptureQualityBadge({ scores, showDetails = false }: CaptureQualityBadgeProps) {
  const { quality, goodCount, concernCount, missingCount } = calculateQuality(scores);

  const qualityColors = {
    high: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-red-100 text-red-700 border-red-200",
    incomplete: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${qualityColors[quality]}`}>
      {quality === "high" && <CheckCircle className="h-3 w-3" />}
      {quality === "concern" && <AlertTriangle className="h-3 w-3" />}
      {quality === "low" && <XCircle className="h-3 w-3" />}
      {quality}
      {showDetails && ` (${goodCount}/${scores.length})`}
    </span>
  );
}
