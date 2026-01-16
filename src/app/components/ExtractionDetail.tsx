import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Slider } from "@/app/components/ui/slider";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";

interface ExtractionDetailProps {
  extractionId: string;
  onBack: () => void;
}

export function ExtractionDetail({ extractionId, onBack }: ExtractionDetailProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  // Expandable sections state
  const [evidenceExpanded, setEvidenceExpanded] = useState(true);
  const [framesExpanded, setFramesExpanded] = useState(true);
  const [provenanceExpanded, setProvenanceExpanded] = useState(false);

  // FRAMES metadata state
  const [frames, setFrames] = useState({
    function: { value: "Command Processing", confidence: 0.92 },
    requirement: { value: "CCSDS Compliant", confidence: 0.88 },
    architecture: { value: "Software Component", confidence: 0.95 },
    materialization: { value: "C++ Class", confidence: 0.85 },
    environment: { value: "Flight Software", confidence: 0.90 },
    scale: { value: "Subsystem Level", confidence: 0.87 },
  });

  // Mock extraction data
  const extraction = {
    id: extractionId,
    name: "TCS Command Handler",
    type: "Component",
    canonicalKey: "tcs.command_handler",
    ecosystem: "CubeSat / Flight Software",
    source: "CCSDS Blue Book 133.0-B-2",
    sourceUrl: "https://public.ccsds.org/Pubs/133x0b2e1.pdf",
    extractedAt: "2026-01-16T10:30:00",
    rawEvidence: `The Telecommand Service (TCS) provides a standardized approach to commanding spacecraft. The TCS Command Handler is responsible for receiving, validating, and routing telecommands from ground stations to the appropriate onboard subsystems. It implements CCSDS packet structure validation and CRC checking.`,
    fullContext: `Section 4.2.1 Command Processing
    
The Telecommand Service (TCS) provides a standardized approach to commanding spacecraft. The TCS Command Handler is responsible for receiving, validating, and routing telecommands from ground stations to the appropriate onboard subsystems.

Key responsibilities include:
- Reception of CCSDS telecommand packets
- Packet structure validation according to CCSDS 133.0-B-2
- CRC verification using polynomial 0x1021
- Command routing to registered subsystem handlers
- Command acknowledgment and reporting

The handler maintains a command queue with configurable depth (typically 32-64 commands) and supports priority-based execution.`,
    confidence: 0.92,
    reasoning: "High confidence due to explicit definition in authoritative CCSDS specification. Clear functional description and technical parameters provided.",
  };

  const handleApprove = () => {
    // Mock approval
    alert("Extraction approved and added to verified library");
    onBack();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    // Mock rejection
    alert(`Extraction rejected. Reason: ${rejectReason}`);
    onBack();
  };

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
            <h2 className="text-2xl font-semibold">{extraction.name}</h2>
            <p className="text-sm text-gray-600">Extraction Detail & Review</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {extraction.type}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Entity Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                Entity Information
                <button className="text-gray-400 hover:text-gray-600">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Candidate Name
                  </label>
                  <Input value={extraction.name} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Canonical Key
                  </label>
                  <Input value={extraction.canonicalKey} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Ecosystem / Domain
                </label>
                <Input value={extraction.ecosystem} className="mt-1" />
              </div>
            </div>
          </Card>

          {/* Evidence Panel */}
          <Card className="p-6">
            <Collapsible open={evidenceExpanded} onOpenChange={setEvidenceExpanded}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  Evidence & Source
                  <span className="text-xs text-gray-500 font-normal">
                    (Why we think this entity exists)
                  </span>
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {evidenceExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Source Document
                    </label>
                    <a
                      href={extraction.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Open Document
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <span className="text-sm">{extraction.source}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Extracted Evidence (Quote)
                  </label>
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm italic">{extraction.rawEvidence}</p>
                  </div>
                </div>

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      Show Full Context
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="p-4 bg-gray-50 rounded border max-h-64 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono">
                        {extraction.fullContext}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Confidence & Reasoning
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${extraction.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {Math.round(extraction.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{extraction.reasoning}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* FRAMES Metadata */}
          <Card className="p-6">
            <Collapsible open={framesExpanded} onOpenChange={setFramesExpanded}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  FRAMES Metadata
                  <span className="text-xs text-gray-500 font-normal">
                    (Dimensional classification)
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {framesExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-6">
                {Object.entries(frames).map(([key, data]) => (
                  <div key={key} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <label className="text-sm font-medium capitalize">
                          {key}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {key === "function" && "What does this entity do?"}
                          {key === "requirement" && "What standards or needs does it fulfill?"}
                          {key === "architecture" && "What structural role does it play?"}
                          {key === "materialization" && "How is it implemented?"}
                          {key === "environment" && "Where does it operate?"}
                          {key === "scale" && "What level of abstraction?"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(data.confidence * 100)}%
                      </Badge>
                    </div>
                    <Select
                      value={data.value}
                      onValueChange={(value) =>
                        setFrames({
                          ...frames,
                          [key]: { ...data, value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Sample options - in real app, these would be dynamic */}
                        <SelectItem value={data.value}>{data.value}</SelectItem>
                        <SelectItem value="Alternative 1">Alternative 1</SelectItem>
                        <SelectItem value="Alternative 2">Alternative 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-3">
                      <label className="text-xs text-gray-600 mb-2 block">
                        Adjust Confidence
                      </label>
                      <Slider
                        value={[data.confidence * 100]}
                        onValueChange={([value]) =>
                          setFrames({
                            ...frames,
                            [key]: { ...data, confidence: value / 100 },
                          })
                        }
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>

        {/* Right Column - Actions & Metadata */}
        <div className="space-y-6">
          {/* Decision Actions */}
          <Card className="p-6 sticky top-6">
            <h3 className="font-semibold mb-4">Review Decision</h3>
            <div className="space-y-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setShowApproveDialog(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <p className="text-xs text-gray-600 px-1">
                Add this entity to the verified library. Changes will be saved.
              </p>

              <Button
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <p className="text-xs text-gray-600 px-1">
                Mark as incorrect or invalid. Provide a reason for the team.
              </p>

              <Button variant="outline" className="w-full">
                Save Draft
              </Button>
              <p className="text-xs text-gray-600 px-1">
                Save your progress without making a final decision.
              </p>
            </div>
          </Card>

          {/* Provenance Info */}
          <Card className="p-6">
            <Collapsible open={provenanceExpanded} onOpenChange={setProvenanceExpanded}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Provenance</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {provenanceExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Extracted:</span>
                    <p className="font-medium">
                      {new Date(extraction.extractedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Extraction ID:</span>
                    <p className="font-mono text-xs">{extraction.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Source Hash:</span>
                    <p className="font-mono text-xs">a3f9d8e7...</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Help Panel */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold mb-1">Review Guidelines</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Verify evidence matches entity</li>
                  <li>• Check FRAMES dimensions</li>
                  <li>• Adjust confidence if needed</li>
                  <li>• Provide clear reject reasons</li>
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
              This will add "{extraction.name}" to the verified library. Other team
              members will be able to see and use this entity. You can always modify
              or remove it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve & Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject This Extraction?</AlertDialogTitle>
            <AlertDialogDescription>
              This extraction will be marked as rejected and removed from the pending
              queue. Please provide a reason to help improve future extractions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Explain why this extraction should be rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
