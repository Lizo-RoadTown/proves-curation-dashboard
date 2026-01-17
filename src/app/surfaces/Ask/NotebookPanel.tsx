/**
 * NotebookPanel - Right panel for managing attachments and viewing collective
 *
 * Two tabs:
 * - My Notebook: Attachments for this conversation
 * - Collective: Search and overview of the collective library
 */

import { useState } from "react";
import {
  Paperclip,
  Search,
  FolderGit2,
  FileText,
  Link,
  Trash2,
  Clock,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

export interface Attachment {
  id: string;
  name: string;
  type: "repo" | "folder" | "file" | "notion" | "gdrive";
  path?: string;
  addedAt: Date;
}

interface NotebookPanelProps {
  attachments: Attachment[];
  onAddAttachment: () => void;
  onRemoveAttachment: (id: string) => void;
  recentAttachments?: Attachment[];
}

export function NotebookPanel({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  recentAttachments = [],
}: NotebookPanelProps) {
  const [activeTab, setActiveTab] = useState<"my" | "collective">("my");
  const [collectiveSearch, setCollectiveSearch] = useState("");

  return (
    <div className="w-72 border-l bg-gray-50 flex flex-col flex-shrink-0">
      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "my"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          My Notebook
        </button>
        <button
          onClick={() => setActiveTab("collective")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "collective"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Collective
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "my" ? (
          <MyNotebookTab
            attachments={attachments}
            onAddAttachment={onAddAttachment}
            onRemoveAttachment={onRemoveAttachment}
            recentAttachments={recentAttachments}
          />
        ) : (
          <CollectiveTab
            searchQuery={collectiveSearch}
            onSearchChange={setCollectiveSearch}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MY NOTEBOOK TAB
// =============================================================================

interface MyNotebookTabProps {
  attachments: Attachment[];
  onAddAttachment: () => void;
  onRemoveAttachment: (id: string) => void;
  recentAttachments: Attachment[];
}

function MyNotebookTab({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  recentAttachments,
}: MyNotebookTabProps) {
  return (
    <div className="space-y-4">
      {/* Add Attachment Button */}
      <button
        onClick={onAddAttachment}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Paperclip className="w-4 h-4" />
        Attach repo, folder, or doc
      </button>

      {/* Current Conversation Attachments */}
      {attachments.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            This Conversation ({attachments.length})
          </h4>
          <div className="space-y-2">
            {attachments.map((att) => (
              <AttachmentCard
                key={att.id}
                attachment={att}
                onRemove={() => onRemoveAttachment(att.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 font-medium">No files attached</p>
          <p className="text-xs text-gray-400 mt-1">
            Attach files to include them in your search
          </p>
        </div>
      )}

      {/* Recent Attachments */}
      {recentAttachments.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recent Attachments
          </h4>
          <div className="space-y-2">
            {recentAttachments.slice(0, 3).map((att) => (
              <button
                key={att.id}
                className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AttachmentIcon type={att.type} />
                  <span className="truncate">{att.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COLLECTIVE TAB
// =============================================================================

interface CollectiveTabProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function CollectiveTab({ searchQuery, onSearchChange }: CollectiveTabProps) {
  // Mock data - will be replaced with actual data from Supabase
  const topSources = [
    { name: "F' Component Model", type: "docs", count: 156 },
    { name: "PROVES Kit Docs", type: "docs", count: 89 },
    { name: "I2C Bus Architecture", type: "interface", count: 45 },
    { name: "GPS Integration Guide", type: "procedure", count: 34 },
  ];

  const coverage = [
    { domain: "Ops", percent: 85, color: "bg-green-500" },
    { domain: "Software", percent: 72, color: "bg-blue-500" },
    { domain: "Hardware", percent: 45, color: "bg-yellow-500" },
    { domain: "Process", percent: 60, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search collective..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Top Sources */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Top Sources Used Recently
        </h4>
        <div className="space-y-2">
          {topSources.map((source, i) => (
            <div
              key={i}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-blue-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{source.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {source.type}
                </span>
                <span className="text-xs text-gray-500">
                  {source.count} references
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Coverage by Domain
        </h4>
        <div className="space-y-2">
          {coverage.map((item) => (
            <div key={item.domain}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-700">{item.domain}</span>
                <span className="text-gray-500">{item.percent}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's New */}
      <div className="pt-4 border-t">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
          What's New
        </h4>
        <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">12 new items</p>
          <p className="text-xs text-blue-600 mt-0.5">Added this week</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface AttachmentCardProps {
  attachment: Attachment;
  onRemove: () => void;
}

function AttachmentCard({ attachment, onRemove }: AttachmentCardProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg group">
      <div className="flex items-center gap-2 min-w-0">
        <AttachmentIcon type={attachment.type} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.name}
          </p>
          {attachment.path && (
            <p className="text-xs text-gray-500 truncate">{attachment.path}</p>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function AttachmentIcon({ type }: { type: Attachment["type"] }) {
  const icons = {
    repo: <FolderGit2 className="w-4 h-4 text-purple-500" />,
    folder: <FolderGit2 className="w-4 h-4 text-blue-500" />,
    file: <FileText className="w-4 h-4 text-gray-500" />,
    notion: <FileText className="w-4 h-4 text-orange-500" />,
    gdrive: <Link className="w-4 h-4 text-green-500" />,
  };

  return icons[type] || icons.file;
}
