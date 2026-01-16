import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Search, Filter, Clock, ExternalLink, Loader2 } from "lucide-react";
import { useExtractions } from "../../hooks/useExtractions";

interface PendingExtractionsProps {
  onViewDetail: (id: string) => void;
}

export function PendingExtractions({ onViewDetail }: PendingExtractionsProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Use real Supabase data
  const { extractions: rawExtractions, loading, error } = useExtractions();

  // Transform database format to UI format
  const extractions = rawExtractions.map(ext => ({
    id: ext.extraction_id,
    name: ext.candidate_key,
    type: ext.candidate_type,
    source: ext.snapshot_id || 'Unknown source',
    sourceUrl: '#', // TODO: Get from raw_snapshots table
    confidence: ext.confidence_score || 0,
    status: ext.status === 'pending' ? 'unclaimed' : ext.status,
    timestamp: ext.created_at,
    claimedBy: ext.assigned_to,
    claimExpiry: null, // TODO: Calculate from batch_claims
  }));

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const unclaimedIds = extractions
      .filter((e) => e.status === "unclaimed")
      .map((e) => e.id);
    setSelectedItems(
      selectedItems.length === unclaimedIds.length ? [] : unclaimedIds
    );
  };

  const handleClaimBatch = () => {
    // Mock claiming
    alert(`Claiming ${selectedItems.length} items for review`);
    setSelectedItems([]);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review Work</h2>
        <p className="text-gray-600">
          Pending extractions need human review and validation
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or key..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="component">Component</SelectItem>
                <SelectItem value="parameter">Parameter</SelectItem>
                <SelectItem value="telemetry">Telemetry</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Batch Actions */}
      {selectedItems.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedItems([])}>
                Clear Selection
              </Button>
              <Button size="sm" onClick={handleClaimBatch}>
                Claim for Review
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Loading extractions from Supabase...</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-12 text-center border-red-200 bg-red-50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-900">Connection Error</h3>
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                Make sure Supabase is configured and accessible
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Extractions Table */}
      {!loading && !error && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-sm">
                  <Checkbox
                    checked={selectedItems.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left p-4 font-medium text-sm">Entity Name</th>
                <th className="text-left p-4 font-medium text-sm">Type</th>
                <th className="text-left p-4 font-medium text-sm">Source</th>
                <th className="text-left p-4 font-medium text-sm">Confidence</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {extractions.map((extraction) => (
                <tr key={extraction.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedItems.includes(extraction.id)}
                      onCheckedChange={() => handleSelectItem(extraction.id)}
                      disabled={extraction.status !== "unclaimed"}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{extraction.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(extraction.timestamp).toLocaleDateString()} at{" "}
                        {new Date(extraction.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{extraction.type}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <span className="text-sm truncate">{extraction.source}</span>
                      <a
                        href={extraction.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            extraction.confidence >= 0.9
                              ? "bg-green-500"
                              : extraction.confidence >= 0.8
                              ? "bg-blue-500"
                              : "bg-orange-500"
                          }`}
                          style={{ width: `${extraction.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(extraction.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {extraction.status === "unclaimed" && (
                      <Badge variant="secondary">Unclaimed</Badge>
                    )}
                    {extraction.status === "claimed" && (
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Claimed
                        </Badge>
                        <span className="text-xs text-gray-500">
                          by {extraction.claimedBy}
                        </span>
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {extraction.claimExpiry}
                        </span>
                      </div>
                    )}
                    {extraction.status === "under_review" && (
                      <div className="flex flex-col gap-1">
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          Under Review
                        </Badge>
                        <span className="text-xs text-gray-500">by {extraction.claimedBy}</span>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {extraction.claimExpiry}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetail(extraction.id)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {/* Empty State (shown when no results) */}
      {!loading && !error && extractions.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Pending Extractions</h3>
              <p className="text-sm text-gray-600">
                All extractions have been reviewed or there are no new items to review.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
