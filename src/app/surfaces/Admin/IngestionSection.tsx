/**
 * IngestionSection - Monitor crawl jobs and ingestion queue
 */

import { RefreshCw, CheckCircle, AlertCircle, Clock, Play } from 'lucide-react';
import type { CrawlJob, IngestionStats, TeamSource } from '@/types/sources';
import { getStatusColor } from '@/types/sources';

// =============================================================================
// COMPONENT
// =============================================================================

interface IngestionSectionProps {
  jobs: CrawlJob[];
  stats: IngestionStats | null;
  sources: TeamSource[];
  loading: boolean;
  onRefresh: () => void;
}

export function IngestionSection({
  jobs,
  stats,
  sources,
  loading,
  onRefresh,
}: IngestionSectionProps) {
  // Get source name for a job
  const getSourceName = (sourceId: string) => {
    const source = sources.find((s) => s.id === sourceId);
    return source?.name || 'Unknown Source';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Ingestion Queue</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Pending"
            value={stats.pending_jobs}
            icon={Clock}
            color="text-gray-600"
          />
          <StatCard
            label="Processing"
            value={stats.running_jobs}
            icon={RefreshCw}
            color="text-blue-600"
            animate={stats.running_jobs > 0}
          />
          <StatCard
            label="Completed Today"
            value={stats.completed_today}
            icon={CheckCircle}
            color="text-green-600"
          />
          <StatCard
            label="Failed Today"
            value={stats.failed_today}
            icon={AlertCircle}
            color="text-red-600"
          />
        </div>
      )}

      {/* Jobs List */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Jobs</h3>

      {loading && jobs.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">Loading jobs...</span>
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Play className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No crawl jobs yet</p>
          <p className="text-sm text-gray-500">
            Trigger a crawl from the Sources tab to start ingesting
          </p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              sourceName={getSourceName(job.source_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  animate?: boolean;
}

function StatCard({ label, value, icon: Icon, color, animate }: StatCardProps) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon className={`w-4 h-4 ${color} ${animate ? 'animate-spin' : ''}`} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

interface JobCardProps {
  job: CrawlJob;
  sourceName: string;
}

function JobCard({ job, sourceName }: JobCardProps) {
  const statusColors = getStatusColor(job.status);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Status indicator */}
        <div className="flex-shrink-0">
          {job.status === 'crawling' ? (
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          ) : job.status === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : job.status === 'failed' ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <Clock className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Source name and current item */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{sourceName}</span>
            <span className={`px-2 py-0.5 text-xs rounded ${statusColors}`}>
              {job.status}
            </span>
          </div>
          {job.current_item && job.status === 'crawling' && (
            <p className="text-sm text-gray-500 truncate font-mono">
              {job.current_item}
            </p>
          )}
          {job.error_message && job.status === 'failed' && (
            <p className="text-sm text-red-600 truncate">
              {job.error_message}
            </p>
          )}
        </div>
      </div>

      {/* Progress / Stats */}
      <div className="flex items-center gap-6 flex-shrink-0 text-sm text-gray-500">
        {(job.status === 'crawling' || job.status === 'completed') && (
          <div className="flex items-center gap-4">
            <span>{job.items_processed} / {job.items_found} items</span>
            {job.items_failed > 0 && (
              <span className="text-red-500">{job.items_failed} failed</span>
            )}
          </div>
        )}
        <span className="whitespace-nowrap">{formatJobTime(job)}</span>
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatJobTime(job: CrawlJob): string {
  if (job.status === 'crawling' && job.started_at) {
    return `Started ${formatRelativeTime(job.started_at)}`;
  }
  if (job.completed_at) {
    return formatRelativeTime(job.completed_at);
  }
  return formatRelativeTime(job.created_at);
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
