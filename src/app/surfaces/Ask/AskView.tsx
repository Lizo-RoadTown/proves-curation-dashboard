/**
 * AskView - Main Ask surface with 3-region layout
 *
 * Layout:
 * - Left: ScopeChips (search scope toggles and filters)
 * - Center: ChatPane (agent conversation)
 * - Right: NotebookPanel (attachments and collective overview)
 *
 * Integrations:
 * - MCP Server: Searches collective knowledge and external sources
 * - User's AI Model: Uses user's API key for chat completions
 */

import { useState, useCallback, useMemo } from "react";
import { Settings } from "lucide-react";
import { ScopeChips } from "./ScopeChips";
import { ChatPane, type ChatMessage } from "./ChatPane";
import { NotebookPanel } from "./NotebookPanel";
import { ModelConfigDialog } from "./ModelConfigDialog";
import type { EvidenceData } from "./EvidenceStrip";
import { useAttachments } from "@/hooks/useAttachments";
import { useMCP } from "@/hooks/useMCP";
import { useModelConfig } from "@/hooks/useModelConfig";
import type { AttachmentProvider } from "@/types/attachments";

export function AskView() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help you find information from the collective library and your attached files. Ask me about PROVES, F' components, procedures, or any technical topic.\n\n**Tip:** Click the ⚙️ button in the top right to configure your AI model.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModelConfig, setShowModelConfig] = useState(false);

  // Scope state
  const [scopeCollective, setScopeCollective] = useState(true);
  const [scopeNotebook, setScopeNotebook] = useState(true);
  const [missionFilter, setMissionFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("latest");

  // Conversation ID (in a real app, this would come from router/state)
  const conversationId = useMemo(() => crypto.randomUUID(), []);

  // Mock user ID (in a real app, this would come from auth context)
  // For now, use a stable mock ID so attachments work locally
  const mockUserId = "00000000-0000-0000-0000-000000000001";

  // MCP Server connection for knowledge search
  const {
    connection: mcpConnection,
    askWithContext,
  } = useMCP({ autoConnect: true });

  // User's model configuration (stored locally)
  const {
    config: modelConfig,
    configDisplay,
    isConfigured: modelConfigured,
    setConfig: setModelConfig,
    validateApiKey,
    generateCompletion,
    isGenerating,
    abortGeneration,
  } = useModelConfig();

  // Attachments from database via hook
  const {
    attachments,
    recentAttachments,
    connections,
    loading: attachmentsLoading,
    error: attachmentsError,
    attachResource,
    detachResource,
  } = useAttachments({
    conversationId,
    userId: mockUserId,
  });

  /**
   * Handle connecting to a provider (OAuth flow)
   * TODO: Implement actual OAuth flow
   */
  const handleConnect = useCallback((provider: AttachmentProvider) => {
    console.log("Connect to provider:", provider);
    // For now, just log - will implement OAuth in future
    alert(`OAuth flow for ${provider} not yet implemented.\nIn production, this would open ${provider === 'github' ? 'GitHub' : 'Google'} authorization.`);
  }, []);

  /**
   * Handle disconnecting from a provider
   * TODO: Implement actual disconnect
   */
  const handleDisconnect = useCallback((provider: AttachmentProvider) => {
    console.log("Disconnect from provider:", provider);
    // For now, just log
    alert(`Disconnect ${provider} not yet implemented.`);
  }, []);

  /**
   * Handle sending a message
   * Uses MCP server for knowledge search + user's AI model for completion
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

      try {
        // Step 1: Search knowledge via MCP server
        let mcpResults: { answer: string; evidence: any; toolsUsed: string[] } | null = null;

        if (mcpConnection.connected) {
          try {
            mcpResults = await askWithContext({
              query: content,
              scope: {
                includeCollective: scopeCollective,
                includeNotebook: scopeNotebook,
                includeExternal: true,
                attachmentIds: attachments.map((a) => a.id),
              },
              conversationId,
              userId: mockUserId,
            });
          } catch (error) {
            console.error("MCP search failed:", error);
          }
        }

        // Step 2: Generate response using user's AI model (if configured)
        let responseContent: string;

        if (modelConfigured && modelConfig) {
          // Build context from MCP results
          const contextSummary = mcpResults
            ? `\n\n[Search Results from PROVES Library]\n${mcpResults.answer}\n\nTools used: ${mcpResults.toolsUsed.join(", ")}`
            : "";

          const systemPrompt = `You are a helpful assistant for the PROVES Library - a knowledge base for CubeSat/SmallSat development using F' framework and PROVES Kit.

When answering questions:
1. Use the search results provided to give accurate, specific answers
2. Reference specific components, interfaces, or documentation when relevant
3. For hardware questions, mention relevant specifications and potential conflicts
4. For external searches (manufacturers, papers, standards), provide the links returned

${contextSummary}`;

          // Add streaming placeholder
          const streamingMessageId = `assistant-${Date.now()}`;
          setMessages((prev) => [
            ...prev,
            {
              id: streamingMessageId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
              isStreaming: true,
            },
          ]);

          responseContent = await generateCompletion({
            messages: [{ role: "user", content }],
            systemPrompt,
            onStream: (chunk) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingMessageId
                    ? { ...m, content: m.content + chunk }
                    : m
                )
              );
            },
          });

          // Finalize the streaming message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMessageId
                ? {
                    ...m,
                    content: responseContent,
                    isStreaming: false,
                    evidence: mcpResults
                      ? {
                          collectiveCount: mcpResults.evidence.collectiveCount,
                          notebookCount: mcpResults.evidence.notebookCount,
                          confidence: mcpResults.evidence.confidence,
                          freshnessLabel: mcpResults.evidence.freshnessLabel,
                          sources: mcpResults.evidence.sources.map((s: any) => ({
                            id: s.id,
                            type: s.type,
                            title: s.title,
                            sourceUrl: s.sourceUrl,
                            sourceType: s.sourceType,
                            excerpt: s.excerpt,
                            capturedAt: s.capturedAt,
                          })),
                        }
                      : undefined,
                  }
                : m
            )
          );
        } else {
          // No model configured - use MCP results directly or show config prompt
          if (mcpResults) {
            responseContent = mcpResults.answer;
          } else {
            responseContent = `I found some information, but I need an AI model to help synthesize the answer.

**To get full responses:**
1. Click the ⚙️ settings button in the top right
2. Add your API key from Anthropic, OpenAI, or Google
3. Your key stays in your browser - it's never sent to our servers

For now, here's what I can tell you based on the knowledge library search.`;
          }

          // Create evidence from MCP results
          const evidence: EvidenceData = mcpResults
            ? {
                collectiveCount: mcpResults.evidence.collectiveCount,
                notebookCount: mcpResults.evidence.notebookCount,
                confidence: mcpResults.evidence.confidence,
                freshnessLabel: mcpResults.evidence.freshnessLabel,
                sources: mcpResults.evidence.sources.map((s: any) => ({
                  id: s.id,
                  type: s.type,
                  title: s.title,
                  sourceUrl: s.sourceUrl,
                  sourceType: s.sourceType,
                  excerpt: s.excerpt,
                  capturedAt: s.capturedAt,
                })),
              }
            : {
                collectiveCount: 0,
                notebookCount: 0,
                confidence: "low",
                freshnessLabel: "now",
                sources: [],
              };

          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: responseContent,
            timestamp: new Date(),
            evidence,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error("Message handling failed:", error);

        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      scopeCollective,
      scopeNotebook,
      attachments,
      mcpConnection.connected,
      askWithContext,
      conversationId,
      mockUserId,
      modelConfigured,
      modelConfig,
      generateCompletion,
    ]
  );


  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* Model Config Button - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              mcpConnection.connected ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className="text-gray-600">
            {mcpConnection.connected ? "Library connected" : "Offline"}
          </span>
        </div>

        {/* Model Status */}
        {modelConfigured && (
          <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
            {configDisplay.providerName} • {configDisplay.modelName}
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={() => setShowModelConfig(true)}
          className={`p-2 rounded-lg transition-colors ${
            modelConfigured
              ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          title="Configure AI Model"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

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
        isLoading={isLoading || isGenerating}
        scopeCollective={scopeCollective}
        scopeNotebook={scopeNotebook}
        attachmentCount={attachments.length}
      />

      {/* Right: Notebook Panel */}
      <NotebookPanel
        attachments={attachments}
        recentAttachments={recentAttachments}
        connections={connections}
        loading={attachmentsLoading}
        error={attachmentsError}
        conversationId={conversationId}
        onAttach={attachResource}
        onDetach={detachResource}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Model Configuration Dialog */}
      <ModelConfigDialog
        isOpen={showModelConfig}
        onClose={() => setShowModelConfig(false)}
        currentConfig={modelConfig}
        onSave={setModelConfig}
        onValidate={validateApiKey}
      />
    </div>
  );
}

