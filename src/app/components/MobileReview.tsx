/**
 * MobileReview - Mobile-optimized engineer knowledge review
 *
 * PURPOSE: Quick, thumb-friendly review on mobile devices
 * - Swipe cards for quick decisions
 * - Tap to verify epistemic metadata
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
} from "lucide-react";
import { useReviewExtractions } from "@/hooks/useReviewExtractions";
import type { ReviewExtractionDTO, ReviewEpistemics } from "@/types/review";

interface MobileReviewProps {
  onExit: () => void;
  organizationId?: string;
}

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
  const [accuracyChecks, setAccuracyChecks] = useState<Record<string, boolean | null>>({
    exists: null,
    evidence: null,
    accurate: null,
  });
  const [verifiedEpistemics, setVerifiedEpistemics] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const current = extractions[currentIndex];
  const total = extractions.length;

  const resetChecks = () => {
    setAccuracyChecks({ exists: null, evidence: null, accurate: null });
    setVerifiedEpistemics(new Set());
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
      await submitDecision(current.extraction_id, "accept", {
        decision_reason: "Mobile quick review - approved",
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
      await submitDecision(current.extraction_id, "reject", {
        decision_reason: reason,
        rejection_category: "other",
      });
      goNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAccuracyPassed = Object.values(accuracyChecks).every(v => v === true);
  const anyAccuracyFailed = Object.values(accuracyChecks).some(v => v === false);
  const allChecked = Object.values(accuracyChecks).every(v => v !== null);

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
        <div className="w-5" /> {/* Spacer */}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Entity Name */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
          <h2 className="text-lg font-semibold text-[#e2e8f0] break-words">{candidate_key}</h2>
          <p className="text-sm text-[#64748b] mt-1">{candidate_type}</p>
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

        {/* Quick Accuracy Checks - Large Touch Targets */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
          <span className="text-xs text-[#64748b] uppercase tracking-wider block mb-3">Is this accurate?</span>
          <div className="space-y-3">
            {[
              { id: "exists", q: "Does this exist?", sub: "Not hallucinated?" },
              { id: "evidence", q: "Evidence matches?", sub: "Quote supports claim?" },
              { id: "accurate", q: "Details correct?", sub: "Names, values, behavior?" },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <button
                  onClick={() => setAccuracyChecks(prev => ({ ...prev, [item.id]: true }))}
                  className={`p-3 rounded-lg transition-all ${
                    accuracyChecks[item.id] === true
                      ? "bg-green-500/30 text-green-400 ring-2 ring-green-500/50"
                      : "bg-[#334155] text-[#64748b]"
                  }`}
                >
                  <ThumbsUp className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setAccuracyChecks(prev => ({ ...prev, [item.id]: false }))}
                  className={`p-3 rounded-lg transition-all ${
                    accuracyChecks[item.id] === false
                      ? "bg-red-500/30 text-red-400 ring-2 ring-red-500/50"
                      : "bg-[#334155] text-[#64748b]"
                  }`}
                >
                  <ThumbsDown className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#e2e8f0]">{item.q}</p>
                  <p className="text-xs text-[#64748b]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
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
        {!allChecked ? (
          <p className="text-center text-sm text-[#64748b]">
            Answer accuracy checks to unlock decisions
          </p>
        ) : anyAccuracyFailed ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleReject("Accuracy check failed")}
              disabled={isSubmitting}
              className="h-14 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </Button>
            <Button
              onClick={goNext}
              disabled={isSubmitting}
              variant="outline"
              className="h-14 border-[#334155] text-[#94a3b8]"
            >
              Skip
            </Button>
          </div>
        ) : allAccuracyPassed ? (
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
        ) : null}
      </div>
    </div>
  );
}
