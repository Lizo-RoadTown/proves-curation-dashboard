/**
 * Types for Team Sources (Admin extraction pipelines)
 */

// Source types supported
export type TeamSourceType =
  | 'github_org'
  | 'github_repo'
  | 'notion_workspace'
  | 'notion_database'
  | 'gdrive_folder'
  | 'gdrive_shared_drive'
  | 'discord_server'
  | 'discord_channel'
  | 'url_list';

// Crawl status
export type CrawlStatus = 'pending' | 'crawling' | 'completed' | 'failed' | 'paused';

// Auth method for source
export type AuthMethod = 'oauth' | 'api_key' | 'service_account';

// =============================================================================
// SOURCE CONFIG TYPES (Provider-specific)
// =============================================================================

export interface GitHubSourceConfig {
  org?: string;
  repo?: string;  // For single repo sources
  include_repos?: string[];
  exclude_repos?: string[];
  include_branches?: string[];
}

export interface NotionSourceConfig {
  workspace_id: string;
  root_page_id?: string;
  database_id?: string;
}

export interface GoogleDriveSourceConfig {
  folder_id?: string;
  shared_drive_id?: string;
}

export interface DiscordSourceConfig {
  server_id: string;
  channel_ids?: string[];
  include_threads?: boolean;
}

export interface UrlListSourceConfig {
  urls: string[];
  recursive?: boolean;
  max_depth?: number;
}

export type SourceConfig =
  | GitHubSourceConfig
  | NotionSourceConfig
  | GoogleDriveSourceConfig
  | DiscordSourceConfig
  | UrlListSourceConfig;

// =============================================================================
// MAIN TYPES
// =============================================================================

export interface TeamSource {
  id: string;
  team_id?: string;
  created_by?: string;

  // Source identification
  source_type: TeamSourceType;
  name: string;
  description?: string;

  // Configuration
  source_config: SourceConfig;
  auth_method?: AuthMethod;

  // Crawl settings
  crawl_schedule?: string;
  crawl_depth?: number;
  include_patterns?: string[];
  exclude_patterns?: string[];
  file_types?: string[];
  max_file_size_mb?: number;

  // State
  is_active: boolean;

  // Last crawl info
  last_crawl_at?: string;
  last_crawl_status?: CrawlStatus;
  last_crawl_error?: string;
  last_crawl_stats?: {
    items_found: number;
    items_processed: number;
    items_failed: number;
  };

  // Metadata
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface CrawlJob {
  id: string;
  source_id: string;
  status: CrawlStatus;
  priority: number;

  // Execution tracking
  started_at?: string;
  completed_at?: string;

  // Progress
  items_found: number;
  items_processed: number;
  items_failed: number;
  current_item?: string;

  // Error handling
  error_message?: string;
  retry_count: number;
  max_retries: number;

  // Metadata
  triggered_by: 'schedule' | 'manual' | 'webhook';
  created_at: string;
}

export interface CrawlItem {
  id: string;
  source_id: string;
  job_id?: string;

  // Item identification
  external_id: string;
  external_url?: string;
  item_path?: string;
  item_type?: string;

  // Content info
  title?: string;
  content_hash?: string;
  content_size_bytes?: number;

  // Processing state
  processed_at?: string;
  extraction_id?: string;

  // Change tracking
  first_seen_at: string;
  last_seen_at: string;
  last_modified_at?: string;
  is_deleted: boolean;
}

export interface IngestionStats {
  pending_jobs: number;
  running_jobs: number;
  completed_today: number;
  failed_today: number;
  total_sources: number;
  active_sources: number;
  total_items: number;
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface CreateSourceForm {
  name: string;
  source_type: TeamSourceType;
  description?: string;
  source_config: SourceConfig;
  crawl_schedule?: string;
  include_patterns?: string[];
  exclude_patterns?: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

export function getSourceTypeLabel(type: TeamSourceType): string {
  const labels: Record<TeamSourceType, string> = {
    github_org: 'GitHub Organization',
    github_repo: 'GitHub Repository',
    notion_workspace: 'Notion Workspace',
    notion_database: 'Notion Database',
    gdrive_folder: 'Google Drive Folder',
    gdrive_shared_drive: 'Google Shared Drive',
    discord_server: 'Discord Server',
    discord_channel: 'Discord Channel',
    url_list: 'URL List',
  };
  return labels[type] || type;
}

export function getSourceTypeIcon(type: TeamSourceType): string {
  const icons: Record<TeamSourceType, string> = {
    github_org: 'github',
    github_repo: 'github',
    notion_workspace: 'notion',
    notion_database: 'notion',
    gdrive_folder: 'google',
    gdrive_shared_drive: 'google',
    discord_server: 'discord',
    discord_channel: 'discord',
    url_list: 'link',
  };
  return icons[type] || 'database';
}

export function getStatusColor(status: CrawlStatus): string {
  const colors: Record<CrawlStatus, string> = {
    pending: 'text-gray-600 bg-gray-100',
    crawling: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    paused: 'text-yellow-600 bg-yellow-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}
