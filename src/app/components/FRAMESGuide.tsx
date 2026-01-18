/**
 * FRAMESGuide - Teaches engineers the evaluation criteria for extractions
 *
 * Based on FRAMES (Framework for Resilience Assessment in Modular Engineering Systems)
 * by Liz Osborn
 *
 * This component explains what makes a good knowledge extraction for the graph.
 */

import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  Wrench,
  Gauge,
  Link2,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";

// =============================================================================
// FRAMES CONCEPTS
// =============================================================================

/**
 * The 4 mandatory questions from ONTOLOGY.md
 */
export const FOUR_QUESTIONS = [
  {
    id: "what_flows",
    question: "What flows through this connection?",
    icon: Zap,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    explanation: "Data, commands, power, signals - what actually moves between components?",
    lookFor: [
      "Data types (temperature readings, commands, telemetry)",
      "Signal types (I2C, SPI, UART, analog)",
      "Power levels (voltage, current)",
      "Frequency/timing (every 100ms, on-demand, at boot)",
    ],
    redFlags: [
      "Vague descriptions like 'communicates with'",
      "Missing data format or protocol",
      "No indication of timing or frequency",
    ],
  },
  {
    id: "what_breaks",
    question: "What breaks if this connection stops?",
    icon: AlertTriangle,
    color: "text-red-600 bg-red-50 border-red-200",
    explanation: "Understanding failure impact tells us how critical this coupling is.",
    lookFor: [
      "Specific failure modes (safe mode, degraded operation)",
      "Cascade effects (which other components are affected)",
      "Recovery mechanisms (does it auto-recover or need intervention?)",
    ],
    redFlags: [
      "No failure analysis documented",
      "Claims nothing breaks (very rare in real systems)",
      "Generic 'system fails' without specifics",
    ],
  },
  {
    id: "what_maintains",
    question: "What maintains this connection?",
    icon: Wrench,
    color: "text-green-600 bg-green-50 border-green-200",
    explanation: "Interface mechanisms that keep the coupling working over time.",
    lookFor: [
      "Documentation (ICDs, specs, schemas)",
      "Roles (who owns this interface?)",
      "Processes (testing, validation, reviews)",
      "Tools (drivers, middleware, adapters)",
    ],
    redFlags: [
      "No documented maintenance mechanism",
      "Single person dependency (institutional knowledge risk)",
      "Outdated or missing documentation",
    ],
  },
  {
    id: "coupling_strength",
    question: "How strong is this coupling?",
    icon: Gauge,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    explanation: "Coupling strength determines how tightly bound components are.",
    lookFor: [
      "0.9-1.0: Hard timing, safety-critical, will halt/damage if broken",
      "0.6-0.8: Explicit dependency, feature stops working if broken",
      "0.3-0.5: Soft dependency, degraded but functional without it",
      "0.0-0.2: Very weak, coexistence only",
    ],
    redFlags: [
      "No strength assessment provided",
      "Strength doesn't match described impact",
      "All couplings rated the same (no differentiation)",
    ],
  },
];

/**
 * Relationship layers from ONTOLOGY.md
 */
export const RELATIONSHIP_LAYERS = [
  {
    id: "digital",
    name: "Digital Layer",
    description: "Software ↔ Software, Software ↔ Hardware interfaces",
    examples: ["API calls", "Driver communication", "Protocol handlers", "Message passing"],
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "physical",
    name: "Physical Layer",
    description: "Hardware ↔ Hardware interfaces",
    examples: ["Electrical connections", "Mechanical mounting", "Thermal paths", "Power distribution"],
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "organizational",
    name: "Organizational Layer",
    description: "People ↔ Teams, roles, processes",
    examples: ["Documentation ownership", "Review processes", "Training requirements", "Handoff procedures"],
    color: "bg-green-100 text-green-800",
  },
];

/**
 * What makes a good GNN node vs edge
 */
export const GRAPH_CONCEPTS = {
  nodes: {
    title: "Nodes = Entities",
    description: "Components, subsystems, modules, teams, documents",
    goodNode: "A clearly defined thing that EXISTS in the system",
    badNode: "Abstract concepts, vague references, or processes",
  },
  edges: {
    title: "Edges = Couplings",
    description: "THE ACTUAL KNOWLEDGE - how things connect and depend on each other",
    goodEdge: "A documented connection with flow, impact, and maintenance mechanism",
    badEdge: "Vague 'relates to' without specifics on what flows or breaks",
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

interface FRAMESGuideProps {
  /** Show in compact mode (for sidebar) */
  compact?: boolean;
  /** Which question to highlight (for contextual help) */
  highlightQuestion?: string;
}

export function FRAMESGuide({ compact = false, highlightQuestion }: FRAMESGuideProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(highlightQuestion || null);

  if (compact) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">FRAMES Evaluation Guide</span>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-4 space-y-3">
            <p className="text-sm text-gray-700">
              When reviewing an extraction, ask these <strong>4 questions</strong>:
            </p>

            {FOUR_QUESTIONS.map((q) => {
              const Icon = q.icon;
              const isHighlighted = highlightQuestion === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestion(activeQuestion === q.id ? null : q.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isHighlighted || activeQuestion === q.id
                      ? q.color
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{q.question}</span>
                  </div>
                  {activeQuestion === q.id && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="mb-2">{q.explanation}</p>
                      <div className="space-y-1">
                        <p className="font-medium text-green-700">Look for:</p>
                        <ul className="list-disc list-inside text-green-600">
                          {q.lookFor.slice(0, 2).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}

            <div className="pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-600 italic">
                <strong>Remember:</strong> The coupling IS the knowledge. Components are just labels.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  // Full guide view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          FRAMES Evaluation Guide
        </h2>
        <p className="text-gray-600">
          Framework for Resilience Assessment in Modular Engineering Systems
        </p>
      </div>

      {/* Core Concept */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <Link2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900 text-lg mb-2">
              The Coupling IS the Knowledge
            </h3>
            <p className="text-gray-700">
              Components (nodes) are just labels. The real value is in the <strong>couplings</strong> (edges) -
              how things connect, what flows between them, what breaks when they disconnect,
              and what maintains them over time.
            </p>
          </div>
        </div>
      </Card>

      {/* Graph Concept */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">{GRAPH_CONCEPTS.nodes.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{GRAPH_CONCEPTS.nodes.description}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">Good:</span>
              <span className="text-gray-700">{GRAPH_CONCEPTS.nodes.goodNode}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-600">Bad:</span>
              <span className="text-gray-700">{GRAPH_CONCEPTS.nodes.badNode}</span>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-indigo-200 bg-indigo-50">
          <h4 className="font-semibold text-indigo-900 mb-2">{GRAPH_CONCEPTS.edges.title}</h4>
          <p className="text-sm text-indigo-700 mb-3">{GRAPH_CONCEPTS.edges.description}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">Good:</span>
              <span className="text-gray-700">{GRAPH_CONCEPTS.edges.goodEdge}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-600">Bad:</span>
              <span className="text-gray-700">{GRAPH_CONCEPTS.edges.badEdge}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* The 4 Questions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          The 4 Questions Every Coupling Must Answer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FOUR_QUESTIONS.map((q) => {
            const Icon = q.icon;
            return (
              <Card key={q.id} className={`p-4 border-2 ${q.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900">{q.question}</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3">{q.explanation}</p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1">Look for:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {q.lookFor.map((item, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">+</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1">Red flags:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {q.redFlags.map((item, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-red-500 mt-0.5">-</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Relationship Layers */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          3 Relationship Layers
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Couplings exist in one of three layers. Each layer has different characteristics.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {RELATIONSHIP_LAYERS.map((layer) => (
            <Card key={layer.id} className="p-4">
              <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${layer.color}`}>
                {layer.name}
              </div>
              <p className="text-sm text-gray-600 mb-2">{layer.description}</p>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Examples:</span> {layer.examples.join(", ")}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Reference */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Quick Reference: Coupling Strength Scale
        </h4>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="p-2 bg-red-100 rounded">
            <span className="font-bold">0.9-1.0</span>
            <p className="text-gray-700">Strong: Safety-critical, hard timing</p>
          </div>
          <div className="p-2 bg-orange-100 rounded">
            <span className="font-bold">0.6-0.8</span>
            <p className="text-gray-700">Medium: Feature stops if broken</p>
          </div>
          <div className="p-2 bg-yellow-100 rounded">
            <span className="font-bold">0.3-0.5</span>
            <p className="text-gray-700">Weak: Degraded but functional</p>
          </div>
          <div className="p-2 bg-green-100 rounded">
            <span className="font-bold">0.0-0.2</span>
            <p className="text-gray-700">Very weak: Coexistence only</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface QuestionBadgeProps {
  questionId: string;
  answered: boolean;
  score?: number;
}

/**
 * Small badge showing if a specific question has been answered
 */
export function QuestionBadge({ questionId, answered, score }: QuestionBadgeProps) {
  const question = FOUR_QUESTIONS.find(q => q.id === questionId);
  if (!question) return null;

  const Icon = question.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
        answered ? question.color : "bg-gray-100 text-gray-500"
      }`}
      title={question.question}
    >
      <Icon className="h-3 w-3" />
      {score !== undefined && <span>{Math.round(score * 100)}%</span>}
    </div>
  );
}

interface CouplingStrengthIndicatorProps {
  strength: number;
  showLabel?: boolean;
}

/**
 * Visual indicator for coupling strength
 */
export function CouplingStrengthIndicator({ strength, showLabel = true }: CouplingStrengthIndicatorProps) {
  let color = "bg-gray-200";
  let label = "Unknown";

  if (strength >= 0.9) {
    color = "bg-red-500";
    label = "Strong (Critical)";
  } else if (strength >= 0.6) {
    color = "bg-orange-500";
    label = "Medium";
  } else if (strength >= 0.3) {
    color = "bg-yellow-500";
    label = "Weak";
  } else if (strength > 0) {
    color = "bg-green-500";
    label = "Very Weak";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${strength * 100}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600">
          {strength.toFixed(2)} - {label}
        </span>
      )}
    </div>
  );
}

interface LayerBadgeProps {
  layer: "digital" | "physical" | "organizational";
}

/**
 * Badge showing which relationship layer
 */
export function LayerBadge({ layer }: LayerBadgeProps) {
  const layerInfo = RELATIONSHIP_LAYERS.find(l => l.id === layer);
  if (!layerInfo) return null;

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${layerInfo.color}`}>
      {layerInfo.name}
    </span>
  );
}
