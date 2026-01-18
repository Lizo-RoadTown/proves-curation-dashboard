/**
 * Type definitions for User Attachments (Student Notebook)
 *
 * Attachments are pointers, not copies. Private by default.
 * Scoped to: user + team + conversation
 */

// =============================================================================
// ENUMS (matching database)
// =============================================================================

export type AttachmentProvider =
  | 'github'
  | 'google_drive'
  | 'discord'
  | 'notion'
  | 'url'
  | 'local_file';

export type AttachmentResourceType =
  | 'repo'
  | 'folder'
  | 'file'
  | 'channel'
  | 'thread'
  | 'issue'
  | 'doc'
  | 'page'
  | 'url';

// =============================================================================
// DATABASE TYPES
// =============================================================================

/**
 * User attachment record from database
 */
export interface UserAttachment {
  id: string;
  user_id: string;
  team_id: string | null;
  conversation_id: string;
  provider: AttachmentProvider;
  resource_type: AttachmentResourceType;
  resource_id: string;
  resource_path: string | null;
  display_name: string;
  ref: string | null;
  permissions_snapshot: Record<string, unknown> | null;
  provider_metadata: Record<string, unknown> | null;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

/**
 * OAuth token record (sensitive - only used server-side)
 */
export interface UserOAuthToken {
  id: string;
  user_id: string;
  provider: AttachmentProvider;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Parameters for attaching a resource
 */
export interface AttachResourceParams {
  conversation_id: string;
  provider: AttachmentProvider;
  resource_type: AttachmentResourceType;
  resource_id: string;
  resource_path?: string;
  display_name: string;
  ref?: string;
  provider_metadata?: Record<string, unknown>;
}

/**
 * Recent attachment (for "quick attach" UI)
 */
export interface RecentAttachment {
  id: string;
  provider: AttachmentProvider;
  resource_type: AttachmentResourceType;
  resource_id: string;
  resource_path: string | null;
  display_name: string;
  ref: string | null;
  last_used_at: string | null;
}

// =============================================================================
// UI TYPES
// =============================================================================

/**
 * Connection status for a provider
 */
export interface ProviderConnection {
  provider: AttachmentProvider;
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  expiresAt?: string;
}

/**
 * GitHub repo for picker
 */
export interface GitHubRepo {
  id: number;
  full_name: string;  // "owner/repo"
  name: string;
  owner: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  pushed_at: string;
  stargazers_count: number;
}

/**
 * Google Drive item for picker
 */
export interface GoogleDriveItem {
  id: string;
  name: string;
  mimeType: string;
  kind: 'folder' | 'file' | 'doc' | 'sheet' | 'slide';
  modifiedTime: string;
  webViewLink: string;
  iconLink?: string;
  parents?: string[];
}

/**
 * Picker state
 */
export type PickerStep = 'select-provider' | 'github-repos' | 'google-drive' | 'confirm';

// =============================================================================
// HELPER CONSTANTS
// =============================================================================

export const PROVIDER_LABELS: Record<AttachmentProvider, string> = {
  github: 'GitHub',
  google_drive: 'Google Drive',
  discord: 'Discord',
  notion: 'Notion',
  url: 'URL',
  local_file: 'Local File',
};

export const RESOURCE_TYPE_LABELS: Record<AttachmentResourceType, string> = {
  repo: 'Repository',
  folder: 'Folder',
  file: 'File',
  channel: 'Channel',
  thread: 'Thread',
  issue: 'Issue',
  doc: 'Document',
  page: 'Page',
  url: 'URL',
};

/**
 * Provider OAuth config (client IDs would come from env)
 */
export const PROVIDER_CONFIG = {
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'repo read:user',
    icon: 'github',
  },
  google_drive: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    icon: 'google',
  },
} as const;
