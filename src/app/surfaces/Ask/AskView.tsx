/**
 * AskView - Main Ask surface with 3-region layout
 *
 * Layout:
 * - Left: ScopeChips (search scope toggles and filters)
 * - Center: ChatPane (agent conversation)
 * - Right: NotebookPanel (attachments and collective overview)
 */

import { useState, useCallback } from "react";
import { ScopeChips } from "./ScopeChips";
import { ChatPane, type ChatMessage } from "./ChatPane";
import { NotebookPanel, type Attachment } from "./NotebookPanel";
import type { EvidenceData } from "./EvidenceStrip";

export function AskView() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help you find information from the collective library and your attached files. Ask me about PROVES, F' components, procedures, or any technical topic.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Scope state
  const [scopeCollective, setScopeCollective] = useState(true);
  const [scopeNotebook, setScopeNotebook] = useState(true);
  const [missionFilter, setMissionFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("latest");

  // Notebook state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recentAttachments] = useState<Attachment[]>([
    // Mock recent attachments - will come from user_attachments table
    { id: "recent-1", name: "PROVES-2 Software", type: "repo", addedAt: new Date() },
    { id: "recent-2", name: "Flight Procedures", type: "folder", addedAt: new Date() },
  ]);

  /**
   * Handle sending a message
   * TODO: Integrate with MCP server for actual agent responses
   */
  const handleSendMessage = useCallback(
    async (content: string) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create mock evidence based on scope
      const evidence: EvidenceData = {
        collectiveCount: scopeCollective ? Math.floor(Math.random() * 8) + 2 : 0,
        notebookCount: scopeNotebook && attachments.length > 0 ? Math.floor(Math.random() * 3) + 1 : 0,
        confidence: Math.random() > 0.3 ? "high" : Math.random() > 0.5 ? "medium" : "low",
        freshnessLabel: "2 days ago",
        sources: [
          // Mock sources - will come from actual search results
          ...(scopeCollective
            ? [
                {
                  id: "src-1",
                  type: "collective" as const,
                  title: "F' Component Model Documentation",
                  sourceUrl: "https://nasa.github.io/fprime/",
                  sourceType: "documentation",
                  excerpt: `Relevant section about ${content.slice(0, 30)}...`,
                  capturedAt: "Jan 15, 2026",
                },
                {
                  id: "src-2",
                  type: "collective" as const,
                  title: "PROVES Kit Integration Guide",
                  sourceType: "guide",
                  excerpt: "Hardware integration patterns and best practices...",
                  capturedAt: "Jan 10, 2026",
                },
              ]
            : []),
          ...(scopeNotebook && attachments.length > 0
            ? [
                {
                  id: "src-3",
                  type: "notebook" as const,
                  title: attachments[0]?.name || "Attached file",
                  sourceType: "local file",
                  excerpt: "Found in your attached files...",
                },
              ]
            : []),
        ],
      };

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: generateMockResponse(content, scopeCollective, scopeNotebook),
        timestamp: new Date(),
        evidence,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    },
    [scopeCollective, scopeNotebook, attachments]
  );

  /**
   * Handle adding an attachment
   * TODO: Open attachment picker dialog
   */
  const handleAddAttachment = useCallback(() => {
    // For now, add a mock attachment
    const mockAttachment: Attachment = {
      id: `att-${Date.now()}`,
      name: `Project Folder ${attachments.length + 1}`,
      type: "folder",
      path: "/path/to/folder",
      addedAt: new Date(),
    };
    setAttachments((prev) => [...prev, mockAttachment]);
  }, [attachments.length]);

  /**
   * Handle removing an attachment
   */
  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Scope Chips */}
      <ScopeChips
        scopeCollective={scopeCollective}
        setScopeCollective={setScopeCollective}
        scopeNotebook={scopeNotebook}
        setScopeNotebook={setScopeNotebook}
        missionFilter={missionFilter}
        setMissionFilter={setMissionFilter}
        domainFilter={domainFilter}
        setDomainFilter={setDomainFilter}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
      />

      {/* Center: Chat */}
      <ChatPane
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        scopeCollective={scopeCollective}
        scopeNotebook={scopeNotebook}
        attachmentCount={attachments.length}
      />

      {/* Right: Notebook Panel */}
      <NotebookPanel
        attachments={attachments}
        onAddAttachment={handleAddAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        recentAttachments={recentAttachments}
      />
    </div>
  );
}

/**
 * Generate a mock response based on the query
 * This will be replaced with actual MCP server integration
 */
function generateMockResponse(
  query: string,
  includeCollective: boolean,
  includeNotebook: boolean
): string {
  const queryLower = query.toLowerCase();

  // Context-aware mock responses
  if (queryLower.includes("gps") || queryLower.includes("component")) {
    return `Based on the F' Component Model documentation, GPS components in PROVES follow a standard pattern:

1. **Component Definition**: GPS components inherit from PassiveComponentBase
2. **Ports**: Typically include SerialRead, SerialWrite, and TimeGet ports
3. **Commands**: Standard commands include GPS_CONFIG and GPS_STATUS

${includeCollective ? "I found 5 relevant items in the collective library covering GPS integration patterns." : ""}
${includeNotebook ? "\nI also checked your attached files for project-specific GPS configurations." : ""}

Would you like more details about any specific aspect?`;
  }

  if (queryLower.includes("procedure") || queryLower.includes("deploy")) {
    return `Here's what I found about deployment procedures:

**Pre-deployment Checklist:**
- Verify flight software version
- Confirm ground station connectivity
- Run power system diagnostics

**Deployment Sequence:**
1. Initialize communication links
2. Deploy solar panels (T+30s)
3. Activate attitude control (T+60s)

${includeCollective ? "These procedures are documented in the Ops runbook collection." : ""}`;
  }

  if (queryLower.includes("i2c") || queryLower.includes("bus")) {
    return `The I2C bus architecture in PROVES uses:

- **Main Bus**: 400kHz for sensor communication
- **Secondary Bus**: 100kHz for legacy devices
- **Address Space**: 0x10-0x7E reserved for flight hardware

Key components on the bus include GPS, IMU, and power management ICs.`;
  }

  // Default response
  return `I searched ${includeCollective ? "the collective library" : ""}${includeCollective && includeNotebook ? " and " : ""}${includeNotebook ? "your attached files" : ""} for information about "${query}".

Here's what I found:

This is a placeholder response. When connected to the MCP server, I'll provide actual search results from your knowledge base.

You can:
- Refine your question for more specific results
- Adjust the scope filters on the left
- Attach relevant files for project-specific context`;
}
