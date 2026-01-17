/**
 * ChatPane - Main chat interface for the Ask surface
 *
 * Handles message display, input, and integrates with MCP server.
 */

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { EvidenceStrip, type EvidenceData } from "./EvidenceStrip";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  evidence?: EvidenceData;
  isStreaming?: boolean;
}

interface ChatPaneProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  scopeCollective: boolean;
  scopeNotebook: boolean;
  attachmentCount: number;
}

export function ChatPane({
  messages,
  onSendMessage,
  isLoading = false,
  scopeCollective,
  scopeNotebook,
  attachmentCount,
}: ChatPaneProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Searching and thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about PROVES, F', components, procedures..."
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Scope indicators */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>Searching:</span>
            {scopeCollective && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                Collective
              </span>
            )}
            {scopeNotebook && (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded">
                Notebook ({attachmentCount} attached)
              </span>
            )}
            {!scopeCollective && !scopeNotebook && (
              <span className="text-yellow-600">No sources selected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-2xl rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-200"
        }`}
      >
        {/* Message content */}
        <div className={`text-sm whitespace-pre-wrap ${isUser ? "text-white" : "text-gray-900"}`}>
          {message.content}
        </div>

        {/* Streaming indicator */}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
        )}

        {/* Evidence strip for assistant messages */}
        {!isUser && message.evidence && (
          <EvidenceStrip evidence={message.evidence} />
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-2 ${isUser ? "text-blue-200" : "text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
