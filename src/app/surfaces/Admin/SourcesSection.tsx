/**
 * SourcesSection - Manage connected extraction sources
 *
 * Supports: Discord, Notion, Google Drive, GitHub
 */

import { useState } from 'react';
import {
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Trash2,
  Play,
  Pause,
  Settings,
} from 'lucide-react';
import type { TeamSource, TeamSourceType } from '@/types/sources';
import { getSourceTypeLabel, getStatusColor } from '@/types/sources';
import { AddSourceDialog } from './AddSourceDialog';

// =============================================================================
// ICONS BY SOURCE TYPE
// =============================================================================

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.763 7.278v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM2.83 1.634l13.168-.933c1.635-.14 2.055-.047 3.082.7l4.25 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.046-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.974c0-.833.373-1.513 1.588-1.34z" />
    </svg>
  );
}

function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.71 3.5L1.15 15l4.58 7.5L12 15H4.87L8.16 9 7.71 3.5zM9.31 3.5l-.68 5.5L16 3.5H9.31zm7.84 0l-7.84 9.75L12 20.5h10.85l-5.7-9.75V3.5zm-1.43 12l-2.47-4H20l-2.47 4h-1.81z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function getSourceIcon(type: TeamSourceType) {
  switch (type) {
    case 'github_org':
    case 'github_repo':
      return GitHubIcon;
    case 'notion_workspace':
    case 'notion_database':
      return NotionIcon;
    case 'gdrive_folder':
    case 'gdrive_shared_drive':
      return GoogleDriveIcon;
    case 'discord_server':
    case 'discord_channel':
      return DiscordIcon;
    default:
      return null;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

interface SourcesSectionProps {
  sources: TeamSource[];
  loading: boolean;
  error: string | null;
  onCreateSource: (source: any) => Promise<TeamSource | null>;
  onUpdateSource: (id: string, updates: Partial<TeamSource>) => Promise<boolean>;
  onDeleteSource: (id: string) => Promise<boolean>;
  onTriggerCrawl: (sourceId: string) => Promise<string | null>;
  onToggleActive: (sourceId: string, isActive: boolean) => Promise<boolean>;
  onRefresh: () => void;
}

export function SourcesSection({
  sources,
  loading,
  error,
  onCreateSource,
  onUpdateSource,
  onDeleteSource,
  onTriggerCrawl,
  onToggleActive,
  onRefresh,
}: SourcesSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source? This will also delete all crawled items.')) {
      return;
    }
    setDeletingId(id);
    await onDeleteSource(id);
    setDeletingId(null);
  };

  const getStatusIcon = (source: TeamSource) => {
    if (source.last_crawl_status === 'crawling') {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    if (source.last_crawl_status === 'failed') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (!source.is_active) {
      return <Pause className="w-4 h-4 text-gray-400" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Connected Sources</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Source
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && sources.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading sources...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && sources.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="flex justify-center gap-4 mb-4">
            <GitHubIcon className="w-8 h-8 text-gray-400" />
            <NotionIcon className="w-8 h-8 text-gray-400" />
            <GoogleDriveIcon className="w-8 h-8 text-gray-400" />
            <DiscordIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No sources connected</h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect your team's knowledge sources to start building the collective library.
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Your First Source
          </button>
        </div>
      )}

      {/* Sources List */}
      {sources.length > 0 && (
        <div className="space-y-3">
          {sources.map((source) => {
            const SourceIcon = getSourceIcon(source.source_type);
            return (
              <div
                key={source.id}
                className={`flex items-center justify-between p-4 bg-white border rounded-lg transition-colors ${
                  source.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(source)}
                  <div className="flex items-center gap-3">
                    {SourceIcon && <SourceIcon className="w-5 h-5 text-gray-600" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${source.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {source.name}
                        </h3>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {getSourceTypeLabel(source.source_type)}
                        </span>
                        {!source.is_active && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {source.item_count.toLocaleString()} items
                        {source.last_crawl_at && (
                          <> · Last crawl: {formatRelativeTime(source.last_crawl_at)}</>
                        )}
                        {source.last_crawl_status === 'failed' && source.last_crawl_error && (
                          <span className="text-red-500"> · Error: {source.last_crawl_error}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Crawl button */}
                  <button
                    onClick={() => onTriggerCrawl(source.id)}
                    disabled={source.last_crawl_status === 'crawling' || !source.is_active}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    title="Trigger crawl"
                  >
                    <Play className="w-4 h-4" />
                  </button>

                  {/* Toggle active */}
                  <button
                    onClick={() => onToggleActive(source.id, !source.is_active)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title={source.is_active ? 'Pause source' : 'Activate source'}
                  >
                    {source.is_active ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>

                  {/* Settings */}
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* External link */}
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Open in provider"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(source.id)}
                    disabled={deletingId === source.id}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    title="Delete source"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Source Dialog */}
      <AddSourceDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={async (form) => {
          const result = await onCreateSource(form);
          if (result) {
            setShowAddDialog(false);
          }
          return result;
        }}
      />
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

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
