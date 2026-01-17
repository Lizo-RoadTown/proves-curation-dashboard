import { useState } from "react";
import { Send, Paperclip, ChevronDown, Check } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: {
    collective: number;
    notebook: number;
    confidence: "high" | "medium" | "low";
    freshnessLabel: string;
  };
}

export function AskView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I can help you find information from the collective library and your attached files. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [scopeCollective, setScopeCollective] = useState(true);
  const [scopeNotebook, setScopeNotebook] = useState(true);
  const [missionFilter, setMissionFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [notebookTab, setNotebookTab] = useState<"my" | "collective">("my");
  const [attachments, setAttachments] = useState<string[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    // Mock response - will be replaced with MCP integration
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `I found relevant information about "${input}". This is a placeholder response that will be connected to the MCP server.`,
      evidence: {
        collective: 5,
        notebook: attachments.length > 0 ? 2 : 0,
        confidence: "high",
        freshnessLabel: "2 days ago",
      },
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Scope Chips */}
      <div className="w-56 border-r bg-gray-50 p-4 flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Search Scope
        </h3>

        {/* Scope toggles */}
        <div className="space-y-2 mb-6">
          <button
            onClick={() => setScopeCollective(!scopeCollective)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scopeCollective
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center ${
                scopeCollective ? "bg-blue-600" : "bg-white border border-gray-300"
              }`}
            >
              {scopeCollective && <Check className="w-3 h-3 text-white" />}
            </div>
            Collective
          </button>

          <button
            onClick={() => setScopeNotebook(!scopeNotebook)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scopeNotebook
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center ${
                scopeNotebook ? "bg-green-600" : "bg-white border border-gray-300"
              }`}
            >
              {scopeNotebook && <Check className="w-3 h-3 text-white" />}
            </div>
            My Notebook
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Mission
            </label>
            <select
              value={missionFilter}
              onChange={(e) => setMissionFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
            >
              <option value="all">All</option>
              <option value="proves1">PROVES-1</option>
              <option value="proves2">PROVES-2</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Domain
            </label>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
            >
              <option value="all">All</option>
              <option value="ops">Ops</option>
              <option value="software">Software</option>
              <option value="hardware">Hardware</option>
              <option value="process">Process</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Time
            </label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
            >
              <option value="latest">Latest</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <p className="text-sm">{message.content}</p>

                {/* Evidence Strip */}
                {message.evidence && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="font-medium text-gray-700">Used for this answer:</div>
                      <div className="flex gap-4">
                        <span>Collective: {message.evidence.collective} items</span>
                        <span>Notebook: {message.evidence.notebook} files</span>
                      </div>
                      <div className="flex gap-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            message.evidence.confidence === "high"
                              ? "bg-green-100 text-green-700"
                              : message.evidence.confidence === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {message.evidence.confidence} confidence
                        </span>
                        <span>{message.evidence.freshnessLabel}</span>
                      </div>
                      <button className="text-blue-600 hover:underline mt-1">
                        Show sources
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about PROVES, F', components, procedures..."
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>Searching:</span>
              {scopeCollective && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                  Collective
                </span>
              )}
              {scopeNotebook && (
                <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded">
                  Notebook ({attachments.length} attached)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Notebook Panel */}
      <div className="w-72 border-l bg-gray-50 flex flex-col flex-shrink-0">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setNotebookTab("my")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              notebookTab === "my"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Notebook
          </button>
          <button
            onClick={() => setNotebookTab("collective")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              notebookTab === "collective"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Collective
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {notebookTab === "my" ? (
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Paperclip className="w-4 h-4" />
                Attach repo, folder, or doc
              </button>

              {attachments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    No files attached to this conversation
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Attach files to include them in your search
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">
                    This Conversation
                  </h4>
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    >
                      {att}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Recent Attachments
                </h4>
                <p className="text-xs text-gray-400">
                  Your recently used files will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search collective..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Top Sources Used Recently
                </h4>
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                    F' Component Model
                  </div>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                    PROVES Kit Docs
                  </div>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                    I2C Bus Architecture
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Coverage
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="px-2 py-1 bg-green-50 text-green-700 rounded">
                    Ops: 85%
                  </div>
                  <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                    Software: 72%
                  </div>
                  <div className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                    Hardware: 45%
                  </div>
                  <div className="px-2 py-1 bg-gray-50 text-gray-700 rounded">
                    Process: 60%
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  What's New
                </h4>
                <p className="text-xs text-gray-500">
                  12 new items added this week
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
