/**
 * AttachmentPicker - Simple dialog for connecting and attaching resources
 *
 * Week 3 scope (keep it simple):
 * - "Connect GitHub" → list repos → attach
 * - "Connect Drive" → pick file/folder → attach
 * - "Disconnect" + "Remove from chat"
 *
 * Avoid: deep browsing UI, multi-step share settings, bulk ingestion controls
 */

import { useState } from "react";
import {
  X,
  Github,
  HardDrive,
  ExternalLink,
  Check,
  Loader2,
  FolderGit2,
  FileText,
  Folder,
  Link2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import type {
  AttachmentProvider,
  AttachResourceParams,
  GitHubRepo,
  GoogleDriveItem,
  ProviderConnection,
} from "@/types/attachments";

// =============================================================================
// TYPES
// =============================================================================

interface AttachmentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (params: AttachResourceParams) => Promise<string | null>;
  conversationId: string;
  connections: ProviderConnection[];
  onConnect: (provider: AttachmentProvider) => void;
  onDisconnect: (provider: AttachmentProvider) => void;
}

type PickerStep = "providers" | "github" | "drive";

// =============================================================================
// MOCK DATA (Replace with actual API calls)
// =============================================================================

const MOCK_GITHUB_REPOS: GitHubRepo[] = [
  {
    id: 1,
    full_name: "PROVES/proveskit",
    name: "proveskit",
    owner: "PROVES",
    description: "PROVES satellite kit software and documentation",
    private: false,
    default_branch: "main",
    pushed_at: "2026-01-15T10:30:00Z",
    stargazers_count: 42,
  },
  {
    id: 2,
    full_name: "PROVES/flight-software",
    name: "flight-software",
    owner: "PROVES",
    description: "F' based flight software for PROVES missions",
    private: true,
    default_branch: "develop",
    pushed_at: "2026-01-14T16:45:00Z",
    stargazers_count: 12,
  },
  {
    id: 3,
    full_name: "PROVES/ground-station",
    name: "ground-station",
    owner: "PROVES",
    description: "Ground station software and protocols",
    private: true,
    default_branch: "main",
    pushed_at: "2026-01-10T09:00:00Z",
    stargazers_count: 8,
  },
];

const MOCK_DRIVE_ITEMS: GoogleDriveItem[] = [
  {
    id: "folder-1",
    name: "PROVES Documentation",
    mimeType: "application/vnd.google-apps.folder",
    kind: "folder",
    modifiedTime: "2026-01-12T14:00:00Z",
    webViewLink: "https://drive.google.com/drive/folders/...",
  },
  {
    id: "doc-1",
    name: "Mission Requirements v2.3",
    mimeType: "application/vnd.google-apps.document",
    kind: "doc",
    modifiedTime: "2026-01-15T11:30:00Z",
    webViewLink: "https://docs.google.com/document/d/...",
  },
  {
    id: "sheet-1",
    name: "Component Inventory",
    mimeType: "application/vnd.google-apps.spreadsheet",
    kind: "sheet",
    modifiedTime: "2026-01-14T09:15:00Z",
    webViewLink: "https://docs.google.com/spreadsheets/d/...",
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function AttachmentPicker({
  isOpen,
  onClose,
  onAttach,
  conversationId,
  connections,
  onConnect,
  onDisconnect,
}: AttachmentPickerProps) {
  const [step, setStep] = useState<PickerStep>("providers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const githubConnected = connections.find((c) => c.provider === "github")?.connected ?? false;
  const driveConnected = connections.find((c) => c.provider === "google_drive")?.connected ?? false;

  if (!isOpen) return null;

  const handleAttachSelected = async (provider: AttachmentProvider, items: GitHubRepo[] | GoogleDriveItem[]) => {
    setLoading(true);
    setError(null);

    try {
      for (const item of items) {
        if (provider === "github") {
          const repo = item as GitHubRepo;
          await onAttach({
            conversation_id: conversationId,
            provider: "github",
            resource_type: "repo",
            resource_id: repo.full_name,
            resource_path: repo.full_name,
            display_name: repo.name,
            ref: repo.default_branch,
            provider_metadata: {
              description: repo.description,
              private: repo.private,
              stargazers_count: repo.stargazers_count,
            },
          });
        } else if (provider === "google_drive") {
          const driveItem = item as GoogleDriveItem;
          await onAttach({
            conversation_id: conversationId,
            provider: "google_drive",
            resource_type: driveItem.kind === "folder" ? "folder" : "doc",
            resource_id: driveItem.id,
            resource_path: driveItem.name,
            display_name: driveItem.name,
            provider_metadata: {
              mimeType: driveItem.mimeType,
              webViewLink: driveItem.webViewLink,
            },
          });
        }
      }

      setSelectedItems(new Set());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === "providers" && "Attach Resources"}
            {step === "github" && "Select GitHub Repos"}
            {step === "drive" && "Select from Drive"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "providers" && (
            <ProviderList
              githubConnected={githubConnected}
              driveConnected={driveConnected}
              onSelectGitHub={() => {
                if (githubConnected) {
                  setStep("github");
                } else {
                  onConnect("github");
                }
              }}
              onSelectDrive={() => {
                if (driveConnected) {
                  setStep("drive");
                } else {
                  onConnect("google_drive");
                }
              }}
              onDisconnectGitHub={() => onDisconnect("github")}
              onDisconnectDrive={() => onDisconnect("google_drive")}
            />
          )}

          {step === "github" && (
            <GitHubRepoList
              repos={MOCK_GITHUB_REPOS}
              selectedIds={selectedItems}
              onToggle={toggleSelection}
              onBack={() => {
                setStep("providers");
                setSelectedItems(new Set());
              }}
            />
          )}

          {step === "drive" && (
            <DriveItemList
              items={MOCK_DRIVE_ITEMS}
              selectedIds={selectedItems}
              onToggle={toggleSelection}
              onBack={() => {
                setStep("providers");
                setSelectedItems(new Set());
              }}
            />
          )}
        </div>

        {/* Footer */}
        {(step === "github" || step === "drive") && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedItems.size} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("providers");
                  setSelectedItems(new Set());
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const items =
                    step === "github"
                      ? MOCK_GITHUB_REPOS.filter((r) => selectedItems.has(r.full_name))
                      : MOCK_DRIVE_ITEMS.filter((i) => selectedItems.has(i.id));
                  handleAttachSelected(step === "github" ? "github" : "google_drive", items);
                }}
                disabled={selectedItems.size === 0 || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Attaching...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Attach Selected
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ProviderListProps {
  githubConnected: boolean;
  driveConnected: boolean;
  onSelectGitHub: () => void;
  onSelectDrive: () => void;
  onDisconnectGitHub: () => void;
  onDisconnectDrive: () => void;
}

function ProviderList({
  githubConnected,
  driveConnected,
  onSelectGitHub,
  onSelectDrive,
  onDisconnectGitHub,
  onDisconnectDrive,
}: ProviderListProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">
        Connect your accounts to attach repositories and documents to this conversation.
      </p>

      {/* GitHub */}
      <ProviderCard
        icon={<Github className="w-6 h-6" />}
        name="GitHub"
        description={githubConnected ? "Connected - Click to browse repos" : "Connect to attach repositories"}
        connected={githubConnected}
        onSelect={onSelectGitHub}
        onDisconnect={onDisconnectGitHub}
      />

      {/* Google Drive */}
      <ProviderCard
        icon={<HardDrive className="w-6 h-6" />}
        name="Google Drive"
        description={driveConnected ? "Connected - Click to browse files" : "Connect to attach documents"}
        connected={driveConnected}
        onSelect={onSelectDrive}
        onDisconnect={onDisconnectDrive}
      />

      {/* Coming soon */}
      <div className="pt-4 border-t mt-4">
        <p className="text-xs text-gray-400 mb-2">Coming soon</p>
        <div className="flex gap-2 text-gray-300">
          <span className="px-3 py-1 bg-gray-100 rounded text-xs">Notion</span>
          <span className="px-3 py-1 bg-gray-100 rounded text-xs">Discord</span>
          <span className="px-3 py-1 bg-gray-100 rounded text-xs">URL</span>
        </div>
      </div>
    </div>
  );
}

interface ProviderCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  onSelect: () => void;
  onDisconnect: () => void;
}

function ProviderCard({
  icon,
  name,
  description,
  connected,
  onSelect,
  onDisconnect,
}: ProviderCardProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
        connected
          ? "border-green-200 bg-green-50 hover:bg-green-100"
          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      <button onClick={onSelect} className="flex items-center gap-4 flex-1 text-left">
        <div className={`p-2 rounded-lg ${connected ? "bg-green-100" : "bg-gray-100"}`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{name}</h3>
            {connected && (
              <span className="px-2 py-0.5 text-xs bg-green-200 text-green-800 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </button>

      <div className="flex items-center gap-2">
        {connected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDisconnect();
            }}
            className="text-xs text-gray-500 hover:text-red-600"
          >
            Disconnect
          </button>
        )}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}

interface GitHubRepoListProps {
  repos: GitHubRepo[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onBack: () => void;
}

function GitHubRepoList({ repos, selectedIds, onToggle, onBack }: GitHubRepoListProps) {
  return (
    <div className="space-y-2">
      {repos.map((repo) => (
        <button
          key={repo.full_name}
          onClick={() => onToggle(repo.full_name)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
            selectedIds.has(repo.full_name)
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <div
            className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
              selectedIds.has(repo.full_name)
                ? "bg-blue-600 border-blue-600"
                : "border-gray-300"
            }`}
          >
            {selectedIds.has(repo.full_name) && <Check className="w-3 h-3 text-white" />}
          </div>

          <FolderGit2 className="w-5 h-5 text-gray-400 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{repo.name}</span>
              {repo.private && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                  Private
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{repo.description}</p>
          </div>

          <span className="text-xs text-gray-400 flex-shrink-0">{repo.owner}</span>
        </button>
      ))}
    </div>
  );
}

interface DriveItemListProps {
  items: GoogleDriveItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onBack: () => void;
}

function DriveItemList({ items, selectedIds, onToggle, onBack }: DriveItemListProps) {
  const getIcon = (item: GoogleDriveItem) => {
    switch (item.kind) {
      case "folder":
        return <Folder className="w-5 h-5 text-yellow-500" />;
      case "doc":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "sheet":
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onToggle(item.id)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
            selectedIds.has(item.id)
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <div
            className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
              selectedIds.has(item.id)
                ? "bg-blue-600 border-blue-600"
                : "border-gray-300"
            }`}
          >
            {selectedIds.has(item.id) && <Check className="w-3 h-3 text-white" />}
          </div>

          {getIcon(item)}

          <div className="flex-1 min-w-0">
            <span className="font-medium text-gray-900 truncate block">{item.name}</span>
            <span className="text-xs text-gray-500">
              Modified {new Date(item.modifiedTime).toLocaleDateString()}
            </span>
          </div>

          <a
            href={item.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-blue-600"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </button>
      ))}
    </div>
  );
}
