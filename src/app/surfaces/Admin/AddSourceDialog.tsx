/**
 * AddSourceDialog - Dialog for adding new extraction sources
 *
 * Supports: Discord, Notion, Google Drive, GitHub
 */

import { useState } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import type { TeamSourceType, CreateSourceForm } from '@/types/sources';

// =============================================================================
// ICONS
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

function WebsiteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// =============================================================================
// SOURCE TYPE OPTIONS
// =============================================================================

interface SourceTypeOption {
  type: TeamSourceType;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

const SOURCE_TYPES: SourceTypeOption[] = [
  {
    type: 'github_org',
    label: 'GitHub Organization',
    description: 'Import repos from a GitHub organization',
    icon: GitHubIcon,
    color: 'bg-gray-900',
  },
  {
    type: 'github_repo',
    label: 'GitHub Repository',
    description: 'Import a single GitHub repository',
    icon: GitHubIcon,
    color: 'bg-gray-900',
  },
  {
    type: 'discord_server',
    label: 'Discord Server',
    description: 'Import messages from Discord channels',
    icon: DiscordIcon,
    color: 'bg-indigo-600',
  },
  {
    type: 'notion_workspace',
    label: 'Notion Workspace',
    description: 'Import pages from a Notion workspace',
    icon: NotionIcon,
    color: 'bg-gray-800',
  },
  {
    type: 'gdrive_folder',
    label: 'Google Drive Folder',
    description: 'Import files from a Google Drive folder',
    icon: GoogleDriveIcon,
    color: 'bg-yellow-500',
  },
  {
    type: 'url_list',
    label: 'Website',
    description: 'Crawl documentation from a website',
    icon: WebsiteIcon,
    color: 'bg-blue-600',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

interface AddSourceDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: CreateSourceForm) => Promise<any>;
}

export function AddSourceDialog({ open, onClose, onSubmit }: AddSourceDialogProps) {
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<TeamSourceType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // GitHub
    githubOrg: '',
    githubRepo: '',
    // Discord
    discordServerId: '',
    discordChannels: '',
    // Notion
    notionWorkspaceId: '',
    notionRootPageId: '',
    // Google Drive
    gdriveLink: '',
    // Website
    websiteUrl: '',
    websiteMaxPages: '50',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectType = (type: TeamSourceType) => {
    setSelectedType(type);
    setStep('config');
    // Pre-fill name based on type
    setFormData((prev) => ({
      ...prev,
      name: '',
    }));
  };

  const handleBack = () => {
    setStep('type');
    setSelectedType(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setError(null);
    setSubmitting(true);

    try {
      // Build source config based on type
      let source_config: Record<string, any> = {};

      switch (selectedType) {
        case 'github_org':
          if (!formData.githubOrg) throw new Error('Organization name is required');
          source_config = { org: formData.githubOrg };
          break;
        case 'github_repo':
          if (!formData.githubRepo) throw new Error('Repository is required');
          source_config = { repo: formData.githubRepo };
          break;
        case 'discord_server':
          if (!formData.discordServerId) throw new Error('Server ID is required');
          source_config = {
            server_id: formData.discordServerId,
            channel_ids: formData.discordChannels
              ? formData.discordChannels.split(',').map((c) => c.trim())
              : [],
          };
          break;
        case 'notion_workspace':
          if (!formData.notionWorkspaceId) throw new Error('Workspace ID is required');
          source_config = {
            workspace_id: formData.notionWorkspaceId,
            root_page_id: formData.notionRootPageId || undefined,
          };
          break;
        case 'gdrive_folder':
          if (!formData.gdriveLink) throw new Error('Google Drive link is required');
          // Extract folder ID from link
          const folderId = extractGDriveFolderId(formData.gdriveLink);
          if (!folderId) throw new Error('Could not extract folder ID from link');
          source_config = { folder_id: folderId };
          break;
        case 'url_list':
          if (!formData.websiteUrl) throw new Error('Website URL is required');
          // Normalize URL
          let url = formData.websiteUrl.trim();
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          source_config = {
            urls: [url],
            recursive: true,
            max_depth: parseInt(formData.websiteMaxPages) || 50,
          };
          break;
      }

      const form: CreateSourceForm = {
        name: formData.name || getDefaultName(selectedType, formData),
        source_type: selectedType,
        description: formData.description || undefined,
        source_config,
      };

      const result = await onSubmit(form);
      if (result) {
        // Reset and close
        setStep('type');
        setSelectedType(null);
        setFormData({
          name: '',
          description: '',
          githubOrg: '',
          githubRepo: '',
          discordServerId: '',
          discordChannels: '',
          notionWorkspaceId: '',
          notionRootPageId: '',
          gdriveLink: '',
          websiteUrl: '',
          websiteMaxPages: '50',
        });
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create source');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'type' ? 'Add Source' : 'Configure Source'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 'type' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Choose the type of source you want to connect:
              </p>
              {SOURCE_TYPES.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    onClick={() => handleSelectType(option.type)}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className={`p-2 rounded-lg ${option.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{option.label}</h3>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 'config' && selectedType && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={handleBack}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Change source type
              </button>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Name field (always shown) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Team Wiki, Main Repo"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type-specific fields */}
              {(selectedType === 'github_org') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.githubOrg}
                    onChange={(e) => setFormData({ ...formData, githubOrg: e.target.value })}
                    placeholder="e.g., PROVES"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    All public repos from this org will be crawled
                  </p>
                </div>
              )}

              {(selectedType === 'github_repo') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository *
                  </label>
                  <input
                    type="text"
                    value={formData.githubRepo}
                    onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                    placeholder="e.g., PROVES/PROVESKit or https://github.com/PROVES/PROVESKit"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {(selectedType === 'discord_server') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Server ID *
                    </label>
                    <input
                      type="text"
                      value={formData.discordServerId}
                      onChange={(e) => setFormData({ ...formData, discordServerId: e.target.value })}
                      placeholder="e.g., 1234567890123456789"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enable Developer Mode in Discord to copy IDs
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Channel IDs (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.discordChannels}
                      onChange={(e) => setFormData({ ...formData, discordChannels: e.target.value })}
                      placeholder="e.g., 123456789, 987654321"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma-separated. Leave empty to crawl all text channels.
                    </p>
                  </div>
                </>
              )}

              {(selectedType === 'notion_workspace') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workspace ID *
                    </label>
                    <input
                      type="text"
                      value={formData.notionWorkspaceId}
                      onChange={(e) => setFormData({ ...formData, notionWorkspaceId: e.target.value })}
                      placeholder="e.g., abc123..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Root Page ID (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.notionRootPageId}
                      onChange={(e) => setFormData({ ...formData, notionRootPageId: e.target.value })}
                      placeholder="e.g., xyz789..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Limit crawl to pages under this root
                    </p>
                  </div>
                </>
              )}

              {(selectedType === 'gdrive_folder') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Drive Link or Folder ID *
                  </label>
                  <input
                    type="text"
                    value={formData.gdriveLink}
                    onChange={(e) => setFormData({ ...formData, gdriveLink: e.target.value })}
                    placeholder="e.g., https://drive.google.com/drive/folders/..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste a folder link or enter the folder ID directly
                  </p>
                </div>
              )}

              {(selectedType === 'url_list') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website URL *
                    </label>
                    <input
                      type="text"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="e.g., https://docs.example.com or fprime.jpl.nasa.gov"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The smart crawler will discover documentation pages
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Pages to Crawl
                    </label>
                    <input
                      type="number"
                      value={formData.websiteMaxPages}
                      onChange={(e) => setFormData({ ...formData, websiteMaxPages: e.target.value })}
                      min="1"
                      max="500"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Limit crawl depth (default: 50 pages)
                    </p>
                  </div>
                </>
              )}

              {/* Description (always shown) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this source contain?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'config' && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Add Source
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function extractGDriveFolderId(input: string): string | null {
  // If it's already just an ID (no slashes)
  if (!input.includes('/') && !input.includes('drive.google.com')) {
    return input.trim();
  }

  // Try to extract from URL
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function getDefaultName(type: TeamSourceType, formData: any): string {
  switch (type) {
    case 'github_org':
      return formData.githubOrg || 'GitHub Organization';
    case 'github_repo':
      return formData.githubRepo?.split('/').pop() || 'GitHub Repository';
    case 'discord_server':
      return 'Discord Server';
    case 'notion_workspace':
      return 'Notion Workspace';
    case 'gdrive_folder':
      return 'Google Drive Folder';
    case 'url_list':
      // Extract domain from URL for default name
      try {
        const url = formData.websiteUrl?.trim();
        if (url) {
          const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
          return urlObj.hostname.replace('www.', '');
        }
      } catch {
        // ignore
      }
      return 'Website';
    default:
      return 'New Source';
  }
}
