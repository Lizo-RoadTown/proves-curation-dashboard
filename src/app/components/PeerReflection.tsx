/**
 * Peer Reflection Dashboard
 *
 * Read-only analyzer dashboard for monitoring agent extraction quality.
 * This component ONLY displays metrics - it never writes to any tables.
 *
 * Features:
 * - Confidence calibration chart (claimed vs actual)
 * - Rejection trends by entity type
 * - Lineage failure tracking
 * - Extraction volume over time
 * - Entity type performance table
 * - Drift alerts
 * - Evidence drill-down drawer
 */

import { useState } from "react"
import { Card } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Loader2,
  BarChart3,
  Target,
  Link2Off,
  Users,
} from "lucide-react"
import {
  usePeerReflectionMetrics,
  getExtractionEvidence,
  getRelatedExtractions,
  type ConfidenceCalibration,
  type LineageFailure,
} from "../../hooks/usePeerReflectionMetrics"

// =============================================================================
// Chart Config
// =============================================================================

const calibrationChartConfig: ChartConfig = {
  avg_claimed_confidence: {
    label: "Claimed Confidence",
    color: "#3b82f6", // blue
  },
  actual_acceptance_rate: {
    label: "Actual Acceptance",
    color: "#22c55e", // green
  },
  calibration_error: {
    label: "Calibration Error",
    color: "#f59e0b", // amber
  },
}

const volumeChartConfig: ChartConfig = {
  accepted_count: {
    label: "Accepted",
    color: "#22c55e",
  },
  rejected_count: {
    label: "Rejected",
    color: "#ef4444",
  },
  pending_count: {
    label: "Pending",
    color: "#f59e0b",
  },
}

// =============================================================================
// Metric Card Component
// =============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  alert?: boolean
}

function MetricCard({ title, value, subtitle, icon, trend, trendValue, alert }: MetricCardProps) {
  return (
    <Card className={`p-4 ${alert ? "border-red-300 bg-red-50" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
              <span className={`text-xs ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${alert ? "bg-red-100" : "bg-gray-100"}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// Alert Badge Component
// =============================================================================

function AlertBadge({ level }: { level: "critical" | "warning" | "ok" }) {
  const config = {
    critical: { color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3 w-3" /> },
    warning: { color: "bg-yellow-100 text-yellow-800", icon: <AlertTriangle className="h-3 w-3" /> },
    ok: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  }
  const { color, icon } = config[level]
  return (
    <Badge className={`${color} flex items-center gap-1`}>
      {icon}
      {level}
    </Badge>
  )
}

// =============================================================================
// Confidence Calibration Chart
// =============================================================================

function ConfidenceCalibrationChart({ data }: { data: ConfidenceCalibration[] }) {
  // Prepare data for chart (most recent first, but display oldest to newest)
  const chartData = [...data]
    .slice(0, 12)
    .reverse()
    .map(d => ({
      week: d.week,
      "Claimed Confidence": (d.avg_claimed_confidence * 100).toFixed(1),
      "Actual Acceptance": (d.actual_acceptance_rate * 100).toFixed(1),
      "Calibration Error": (d.calibration_error * 100).toFixed(1),
      count: d.extraction_count,
    }))

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-medium mb-4">Confidence Calibration</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No calibration data available yet
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">Confidence Calibration</h3>
          <p className="text-xs text-gray-500">Claimed confidence vs actual acceptance rate</p>
        </div>
        <Target className="h-5 w-5 text-gray-400" />
      </div>
      <ChartContainer config={calibrationChartConfig} className="h-64 w-full">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            tickFormatter={(v) => v.slice(5)} // Show MM-DD
            fontSize={10}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            fontSize={10}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="Claimed Confidence"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="Actual Acceptance"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  )
}

// =============================================================================
// Extraction Volume Chart
// =============================================================================

function ExtractionVolumeChart({ data }: { data: { day: string; accepted_count: number; rejected_count: number; pending_count: number }[] }) {
  // Aggregate by week for cleaner display
  const weeklyData = new Map<string, { accepted: number; rejected: number; pending: number }>()

  for (const d of data) {
    const date = new Date(d.day)
    date.setDate(date.getDate() - date.getDay()) // Get week start
    const weekKey = date.toISOString().split("T")[0]

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { accepted: 0, rejected: 0, pending: 0 })
    }
    const entry = weeklyData.get(weekKey)!
    entry.accepted += d.accepted_count
    entry.rejected += d.rejected_count
    entry.pending += d.pending_count
  }

  const chartData = Array.from(weeklyData.entries())
    .map(([week, counts]) => ({
      week,
      Accepted: counts.accepted,
      Rejected: counts.rejected,
      Pending: counts.pending,
    }))
    .slice(-12)

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-medium mb-4">Extraction Volume</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No volume data available yet
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">Extraction Volume</h3>
          <p className="text-xs text-gray-500">Weekly extraction counts by status</p>
        </div>
        <BarChart3 className="h-5 w-5 text-gray-400" />
      </div>
      <ChartContainer config={volumeChartConfig} className="h-64 w-full">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            tickFormatter={(v) => v.slice(5)}
            fontSize={10}
          />
          <YAxis fontSize={10} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="Accepted" fill="#22c55e" stackId="stack" />
          <Bar dataKey="Rejected" fill="#ef4444" stackId="stack" />
          <Bar dataKey="Pending" fill="#f59e0b" stackId="stack" />
        </BarChart>
      </ChartContainer>
    </Card>
  )
}

// =============================================================================
// Entity Type Performance Table
// =============================================================================

function EntityPerformanceTable({
  data,
  onRowClick,
}: {
  data: { candidate_type: string; ecosystem: string; total_extractions: number; acceptance_rate: number | null; avg_confidence: number | null }[]
  onRowClick?: (type: string) => void
}) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-medium mb-4">Entity Type Performance</h3>
        <div className="text-center text-gray-400 py-8">
          No entity type data available yet
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">Entity Type Performance</h3>
          <p className="text-xs text-gray-500">Acceptance rates by entity type</p>
        </div>
        <Activity className="h-5 w-5 text-gray-400" />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity Type</TableHead>
              <TableHead>Ecosystem</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acceptance Rate</TableHead>
              <TableHead className="text-right">Avg Confidence</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((row) => (
              <TableRow
                key={`${row.candidate_type}-${row.ecosystem}`}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onRowClick?.(row.candidate_type)}
              >
                <TableCell className="font-medium">{row.candidate_type}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.ecosystem}</Badge>
                </TableCell>
                <TableCell className="text-right">{row.total_extractions}</TableCell>
                <TableCell className="text-right">
                  {row.acceptance_rate !== null ? (
                    <span className={row.acceptance_rate >= 70 ? "text-green-600" : row.acceptance_rate >= 50 ? "text-yellow-600" : "text-red-600"}>
                      {row.acceptance_rate.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {row.avg_confidence !== null ? (
                    `${(row.avg_confidence * 100).toFixed(0)}%`
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// =============================================================================
// Lineage Failures Table
// =============================================================================

function LineageFailuresTable({
  data,
  onRowClick,
}: {
  data: LineageFailure[]
  onRowClick?: (extractionId: string) => void
}) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">Lineage Failures</h3>
            <p className="text-xs text-gray-500">Evidence that couldn't be verified</p>
          </div>
          <Link2Off className="h-5 w-5 text-gray-400" />
        </div>
        <div className="text-center text-gray-400 py-8">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
          No lineage failures detected
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">Lineage Failures</h3>
          <p className="text-xs text-gray-500">Evidence that couldn't be verified in source</p>
        </div>
        <Badge className="bg-red-100 text-red-800">{data.length} failures</Badge>
      </div>
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Lineage</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((row) => (
              <TableRow
                key={row.extraction_id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onRowClick?.(row.extraction_id)}
              >
                <TableCell className="font-medium max-w-[200px] truncate">
                  {row.candidate_key}
                </TableCell>
                <TableCell>{row.candidate_type}</TableCell>
                <TableCell>
                  {row.confidence_score !== null ? `${(row.confidence_score * 100).toFixed(0)}%` : "-"}
                </TableCell>
                <TableCell>
                  <span className="text-red-600">
                    {row.lineage_confidence !== null
                      ? `${(row.lineage_confidence * 100).toFixed(0)}%`
                      : "Failed"}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// =============================================================================
// Drift Alerts Panel
// =============================================================================

function DriftAlertsPanel({
  alerts,
  onAlertClick,
}: {
  alerts: { ecosystem: string; week: string; calibration_error: number; alert_level: "critical" | "warning" | "ok"; drift_direction: string }[]
  onAlertClick?: (ecosystem: string, week: string) => void
}) {
  const activeAlerts = alerts.filter(a => a.alert_level !== "ok")

  if (activeAlerts.length === 0) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">No Active Drift Alerts</p>
            <p className="text-xs text-green-600">All ecosystems are well-calibrated</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 border-red-200 bg-red-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="font-medium text-red-800">Drift Alerts</span>
        </div>
        <Badge className="bg-red-100 text-red-800">{activeAlerts.length} active</Badge>
      </div>
      <div className="space-y-2">
        {activeAlerts.slice(0, 5).map((alert) => (
          <div
            key={`${alert.ecosystem}-${alert.week}`}
            className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
            onClick={() => onAlertClick?.(alert.ecosystem, alert.week)}
          >
            <div>
              <span className="font-medium">{alert.ecosystem}</span>
              <span className="text-xs text-gray-500 ml-2">{alert.week}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {alert.drift_direction === "over_confident" ? "Over-confident" : "Under-confident"}
              </span>
              <AlertBadge level={alert.alert_level} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// =============================================================================
// Evidence Drawer Component
// =============================================================================

interface EvidenceDrawerProps {
  open: boolean
  onClose: () => void
  extractionId: string | null
}

function EvidenceDrawer({ open, onClose, extractionId }: EvidenceDrawerProps) {
  const [evidence, setEvidence] = useState<{
    extraction_id: string
    candidate_key: string
    candidate_type: string
    candidate_payload: unknown
    evidence: unknown
    confidence_score: number | null
    status: string
    ecosystem: string
    created_at: string
    snapshot_id: string | null
    review_notes: string | null
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [relatedExtractions, setRelatedExtractions] = useState<unknown[]>([])

  const fetchEvidence = async (id: string) => {
    setLoading(true)
    try {
      const data = await getExtractionEvidence(id)
      setEvidence(data)

      // Fetch related extractions by same type
      if (data?.candidate_type) {
        const related = await getRelatedExtractions("candidate_type", data.candidate_type, 5)
        setRelatedExtractions(related || [])
      }
    } catch (err) {
      console.error("Failed to fetch evidence:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch when extractionId changes
  if (extractionId && open && !evidence) {
    fetchEvidence(extractionId)
  }

  // Reset when drawer closes
  const handleClose = () => {
    setEvidence(null)
    setRelatedExtractions([])
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Evidence Details</SheetTitle>
          <SheetDescription>
            {extractionId ? `Extraction ${extractionId.slice(0, 8)}...` : "Select an extraction"}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : evidence ? (
          <div className="mt-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-2">
              <h4 className="font-medium">Entity</h4>
              <p className="text-lg font-mono">{evidence.candidate_key}</p>
              <div className="flex gap-2">
                <Badge>{evidence.candidate_type}</Badge>
                <Badge variant="outline">{evidence.ecosystem}</Badge>
                <Badge
                  className={
                    evidence.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : evidence.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {evidence.status}
                </Badge>
              </div>
            </div>

            {/* Confidence */}
            <div className="space-y-2">
              <h4 className="font-medium">Confidence Score</h4>
              <p className="text-2xl font-semibold">
                {evidence.confidence_score !== null
                  ? `${(evidence.confidence_score * 100).toFixed(1)}%`
                  : "N/A"}
              </p>
            </div>

            {/* Evidence JSON */}
            <div className="space-y-2">
              <h4 className="font-medium">Evidence Data</h4>
              <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto max-h-48">
                {JSON.stringify(evidence.evidence, null, 2)}
              </pre>
            </div>

            {/* Payload */}
            <div className="space-y-2">
              <h4 className="font-medium">Candidate Payload</h4>
              <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto max-h-48">
                {JSON.stringify(evidence.candidate_payload, null, 2)}
              </pre>
            </div>

            {/* Review Notes */}
            {evidence.review_notes && (
              <div className="space-y-2">
                <h4 className="font-medium">Review Notes</h4>
                <p className="text-sm text-gray-600">{evidence.review_notes}</p>
              </div>
            )}

            {/* Related Extractions */}
            {relatedExtractions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Related Extractions (same type)</h4>
                <div className="space-y-1">
                  {relatedExtractions.map((r: { extraction_id: string; candidate_key: string; status: string }) => (
                    <div
                      key={r.extraction_id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <span className="font-mono truncate max-w-[300px]">{r.candidate_key}</span>
                      <Badge variant="outline">{r.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-2 text-xs text-gray-500 border-t pt-4">
              <p>Created: {new Date(evidence.created_at).toLocaleString()}</p>
              {evidence.snapshot_id && <p>Snapshot: {evidence.snapshot_id}</p>}
              <p>ID: {evidence.extraction_id}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            No evidence selected
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function PeerReflection() {
  const [ecosystemFilter, setEcosystemFilter] = useState<string>("all")
  const [selectedExtractionId, setSelectedExtractionId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filter = ecosystemFilter !== "all" ? { ecosystem: ecosystemFilter } : undefined

  const {
    loading,
    error,
    confidenceCalibration,
    rejectionTrends,
    lineageFailures,
    extractionVolume,
    entityPerformance,
    driftAlerts,
    summary,
    refresh,
  } = usePeerReflectionMetrics(filter)

  const handleViewEvidence = (extractionId: string) => {
    setSelectedExtractionId(extractionId)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedExtractionId(null)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-red-800 font-medium">Error loading metrics</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button onClick={refresh} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Peer Reflection
          </h2>
          <p className="text-gray-600">
            Read-only analysis of extraction quality and agent calibration
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={ecosystemFilter} onValueChange={setEcosystemFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Ecosystem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ecosystems</SelectItem>
              <SelectItem value="fprime">F Prime</SelectItem>
              <SelectItem value="proveskit">PROVES Kit</SelectItem>
              <SelectItem value="generic">Generic</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Extractions"
          value={summary?.total_extractions || 0}
          subtitle="All time"
          icon={<Activity className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          title="Acceptance Rate"
          value={summary?.overall_acceptance_rate ? `${summary.overall_acceptance_rate.toFixed(1)}%` : "0%"}
          subtitle="Accepted / (Accepted + Rejected)"
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          trend={summary?.overall_acceptance_rate && summary.overall_acceptance_rate >= 70 ? "up" : "down"}
        />
        <MetricCard
          title="Avg Calibration Error"
          value={summary?.avg_calibration_error ? `${(summary.avg_calibration_error * 100).toFixed(1)}%` : "0%"}
          subtitle="Lower is better"
          icon={<Target className="h-5 w-5 text-amber-600" />}
          alert={summary?.avg_calibration_error ? summary.avg_calibration_error > 0.15 : false}
        />
        <MetricCard
          title="Lineage Failures"
          value={lineageFailures.length}
          subtitle="Evidence verification issues"
          icon={<Link2Off className="h-5 w-5 text-red-600" />}
          alert={lineageFailures.length > 5}
        />
      </div>

      {/* Drift Alerts */}
      <DriftAlertsPanel
        alerts={driftAlerts}
        onAlertClick={(ecosystem, week) => {
          console.log("Alert clicked:", ecosystem, week)
        }}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConfidenceCalibrationChart data={confidenceCalibration} />
        <ExtractionVolumeChart data={extractionVolume} />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EntityPerformanceTable
          data={entityPerformance}
          onRowClick={(type) => {
            console.log("Entity type clicked:", type)
          }}
        />
        <LineageFailuresTable
          data={lineageFailures}
          onRowClick={handleViewEvidence}
        />
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        extractionId={selectedExtractionId}
      />
    </div>
  )
}
