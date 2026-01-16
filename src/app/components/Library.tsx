import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Search, ExternalLink, CheckCircle2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";

export function Library() {
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  const verifiedEntities = [
    {
      id: "entity-001",
      name: "TCS Command Handler",
      canonicalKey: "tcs.command_handler",
      type: "Component",
      ecosystem: "CubeSat / Flight Software",
      verifiedBy: "Sarah Chen",
      verifiedAt: "2026-01-16T11:30:00",
      aliases: ["Telecommand Handler", "Command Processor"],
      frames: {
        function: "Command Processing",
        requirement: "CCSDS Compliant",
        architecture: "Software Component",
        materialization: "C++ Class",
        environment: "Flight Software",
        scale: "Subsystem Level",
      },
      sourceDocument: "CCSDS Blue Book 133.0-B-2",
      relatedEntities: ["Command Queue", "Packet Validator"],
    },
    {
      id: "entity-002",
      name: "Attitude Control Gain",
      canonicalKey: "adcs.control_gain",
      type: "Parameter",
      ecosystem: "CubeSat / ADCS",
      verifiedBy: "Marcus Rodriguez",
      verifiedAt: "2026-01-16T09:45:00",
      aliases: ["PID Gain", "Control Loop Gain"],
      frames: {
        function: "Stability Control",
        requirement: "Pointing Accuracy",
        architecture: "Configuration Parameter",
        materialization: "Float Value",
        environment: "ADCS Subsystem",
        scale: "Component Level",
      },
      sourceDocument: "ADCS Requirements Spec v2.3",
      relatedEntities: ["Attitude Controller", "PID Loop"],
    },
    {
      id: "entity-003",
      name: "Battery Voltage Monitor",
      canonicalKey: "eps.battery_voltage",
      type: "Telemetry",
      ecosystem: "CubeSat / Power",
      verifiedBy: "You",
      verifiedAt: "2026-01-15T14:20:00",
      aliases: ["VBAT", "Battery V"],
      frames: {
        function: "Health Monitoring",
        requirement: "Power System Safety",
        architecture: "Sensor Output",
        materialization: "Analog Signal",
        environment: "EPS",
        scale: "Sensor Level",
      },
      sourceDocument: "EPS Design Document",
      relatedEntities: ["Battery Controller", "Power Management"],
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Library</h2>
        <p className="text-gray-600">
          Verified knowledge entities ready for use
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, key, or alias..."
                className="pl-10"
              />
            </div>
          </div>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="component">Component</SelectItem>
              <SelectItem value="parameter">Parameter</SelectItem>
              <SelectItem value="telemetry">Telemetry</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ecosystem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ecosystems</SelectItem>
              <SelectItem value="flight">Flight Software</SelectItem>
              <SelectItem value="adcs">ADCS</SelectItem>
              <SelectItem value="power">Power</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Verified Entities List */}
      <div className="space-y-4">
        {verifiedEntities.map((entity) => (
          <Card key={entity.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-lg bg-green-50">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{entity.name}</h3>
                    <Badge variant="outline">{entity.type}</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Canonical Key:</span>
                      <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                        {entity.canonicalKey}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Ecosystem:</span>
                      <span className="font-medium">{entity.ecosystem}</span>
                    </div>

                    {entity.aliases.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Also known as:</span>
                        {entity.aliases.map((alias, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {alias}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    Verified by <span className="font-medium">{entity.verifiedBy}</span>{" "}
                    on {new Date(entity.verifiedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <Collapsible
                open={expandedEntity === entity.id}
                onOpenChange={(open) =>
                  setExpandedEntity(open ? entity.id : null)
                }
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {expandedEntity === entity.id ? "Hide" : "Show"} Details
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            <Collapsible
              open={expandedEntity === entity.id}
              onOpenChange={(open) =>
                setExpandedEntity(open ? entity.id : null)
              }
            >
              <CollapsibleContent>
                <div className="pt-4 border-t space-y-4">
                  {/* FRAMES Dimensions */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      FRAMES Classification
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(entity.frames).map(([key, value]) => (
                        <div
                          key={key}
                          className="p-3 bg-gray-50 rounded border"
                        >
                          <div className="text-xs text-gray-600 capitalize mb-1">
                            {key}
                          </div>
                          <div className="text-sm font-medium">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Provenance */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Provenance</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Source:</span>
                      <span>{entity.sourceDocument}</span>
                      <button className="text-blue-600 hover:text-blue-800">
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Related Entities */}
                  {entity.relatedEntities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Related Entities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {entity.relatedEntities.map((related, idx) => (
                          <button
                            key={idx}
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                          >
                            {related}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {verifiedEntities.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Verified Entities</h3>
              <p className="text-sm text-gray-600">
                Start reviewing pending extractions to build your knowledge library.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
