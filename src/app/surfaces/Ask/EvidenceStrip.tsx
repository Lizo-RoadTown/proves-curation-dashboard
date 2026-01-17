/**
 * EvidenceStrip - Collapsible source citations for agent answers
 *
 * Shows what sources were used to generate an answer, with expandable details.
 * Follows the "evidence strip" pattern from the plan.
 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  FileText,
  Database,
  Clock,
  Shield,
} from "lucide-react";

export interface EvidenceSource {
  id: string;
  type: "collective" | "notebook";
  title: string;
  sourceUrl?: string;
  sourceType?: string;
  excerpt?: string;
  capturedAt?: string;
}

export interface EvidenceData {
  collectiveCount: number;
  notebookCount: number;
  confidence: "high" | "medium" | "low";
  freshnessLabel: string;
  sources: EvidenceSource[];
}

interface EvidenceStripProps {
  evidence: EvidenceData;
  variant?: "inline" | "card";
}

export function EvidenceStrip({ evidence, variant = "inline" }: EvidenceStripProps) {
  const [expanded, setExpanded] = useState(false);

  const confidenceColors = {
    high: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-red-100 text-red-700",
  };

  const confidenceLabels = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  if (variant === "card") {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <EvidenceContent
          evidence={evidence}
          expanded={expanded}
          setExpanded={setExpanded}
          confidenceColors={confidenceColors}
          confidenceLabels={confidenceLabels}
        />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <EvidenceContent
        evidence={evidence}
        expanded={expanded}
        setExpanded={setExpanded}
        confidenceColors={confidenceColors}
        confidenceLabels={confidenceLabels}
      />
    </div>
  );
}

interface EvidenceContentProps {
  evidence: EvidenceData;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  confidenceColors: Record<string, string>;
  confidenceLabels: Record<string, string>;
}

function EvidenceContent({
  evidence,
  expanded,
  setExpanded,
  confidenceColors,
  confidenceLabels,
}: EvidenceContentProps) {
  const collectiveSources = evidence.sources.filter((s) => s.type === "collective");
  const notebookSources = evidence.sources.filter((s) => s.type === "notebook");

  return (
    <div className="text-xs">
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-600">
          <span className="font-medium text-gray-700">Used for this answer:</span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            Collective: {evidence.collectiveCount}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Notebook: {evidence.notebookCount}
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
        >
          {expanded ? (
            <>
              Hide sources <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Show sources <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      {/* Confidence and freshness badges */}
      <div className="flex items-center gap-3 mt-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
            confidenceColors[evidence.confidence]
          }`}
        >
          <Shield className="w-3 h-3" />
          {confidenceLabels[evidence.confidence]} confidence
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <Clock className="w-3 h-3" />
          {evidence.freshnessLabel}
        </span>
      </div>

      {/* Expanded source list */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Collective sources */}
          {collectiveSources.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                From Collective Library ({collectiveSources.length})
              </h4>
              <div className="space-y-2">
                {collectiveSources.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            </div>
          )}

          {/* Notebook sources */}
          {notebookSources.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-green-500" />
                From Your Notebook ({notebookSources.length})
              </h4>
              <div className="space-y-2">
                {notebookSources.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            </div>
          )}

          {evidence.sources.length === 0 && (
            <p className="text-gray-500 italic">No specific sources available</p>
          )}
        </div>
      )}
    </div>
  );
}

interface SourceCardProps {
  source: EvidenceSource;
}

function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="p-2 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 truncate">{source.title}</h5>
          {source.sourceType && (
            <span className="text-gray-500">{source.sourceType}</span>
          )}
        </div>
        {source.sourceUrl && (
          <a
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 p-1 text-gray-400 hover:text-blue-600 flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {source.excerpt && (
        <p className="mt-1 text-gray-600 line-clamp-2">{source.excerpt}</p>
      )}
      {source.capturedAt && (
        <p className="mt-1 text-gray-400">Captured: {source.capturedAt}</p>
      )}
    </div>
  );
}
