import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Search, CheckCircle, XCircle, Edit } from "lucide-react";

export function ActivityHistory() {
  const [filterStatus, setFilterStatus] = useState("all");

  const reviews = [
    {
      id: "rev-001",
      entity: "TCS Command Handler",
      type: "Component",
      decision: "approved",
      reviewer: "You",
      timestamp: "2026-01-16T11:30:00",
      changes: ["Updated canonical key", "Adjusted FRAMES confidence"],
      notes: "Verified against CCSDS specification",
    },
    {
      id: "rev-002",
      entity: "Power Subsystem Telemetry",
      type: "Telemetry",
      decision: "rejected",
      reviewer: "You",
      timestamp: "2026-01-16T10:15:00",
      changes: [],
      notes: "Duplicate of existing entity PSU.voltage_monitor",
    },
    {
      id: "rev-003",
      entity: "Attitude Control Gain",
      type: "Parameter",
      decision: "approved",
      reviewer: "Sarah Chen",
      timestamp: "2026-01-16T09:45:00",
      changes: ["Modified environment dimension"],
      notes: "Confirmed with ADCS team lead",
    },
    {
      id: "rev-004",
      entity: "Battery Charge Controller",
      type: "Component",
      decision: "approved",
      reviewer: "Marcus Rodriguez",
      timestamp: "2026-01-16T08:30:00",
      changes: [],
      notes: null,
    },
    {
      id: "rev-005",
      entity: "Thermal Sensor Reading",
      type: "Telemetry",
      decision: "rejected",
      reviewer: "You",
      timestamp: "2026-01-15T16:20:00",
      changes: [],
      notes: "Insufficient evidence in source document",
    },
  ];

  const filteredReviews =
    filterStatus === "all"
      ? reviews
      : reviews.filter((r) => r.decision === filterStatus);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Activity</h2>
        <p className="text-gray-600">Review history and audit trail</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by entity name..." className="pl-10" />
            </div>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Decisions</SelectItem>
              <SelectItem value="approved">Approved Only</SelectItem>
              <SelectItem value="rejected">Rejected Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Review History List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={`p-3 rounded-lg ${
                    review.decision === "approved"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  {review.decision === "approved" ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{review.entity}</h3>
                    <Badge variant="outline">{review.type}</Badge>
                    <Badge
                      variant={
                        review.decision === "approved" ? "default" : "secondary"
                      }
                      className={
                        review.decision === "approved"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }
                    >
                      {review.decision}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    Reviewed by <span className="font-medium">{review.reviewer}</span>{" "}
                    on {new Date(review.timestamp).toLocaleDateString()} at{" "}
                    {new Date(review.timestamp).toLocaleTimeString()}
                  </div>

                  {review.changes.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Changes Made:
                      </div>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {review.changes.map((change, idx) => (
                          <li key={idx}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.notes && (
                    <div className="p-3 bg-gray-50 rounded border">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Review Notes:
                      </div>
                      <p className="text-sm text-gray-600">{review.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredReviews.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Review History</h3>
              <p className="text-sm text-gray-600">
                You haven't reviewed any extractions yet, or no results match your
                filters.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
