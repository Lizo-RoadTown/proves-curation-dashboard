/**
 * ActivityFeed - Real-time view of AI extraction activity
 *
 * Shows engineers what the AI is doing:
 * - Which sources are being crawled
 * - What entities are being extracted
 * - Confidence levels and reasoning
 * - Errors and retries
 */

import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  FileSearch,
  Link2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Pause,
  Play,
  Filter,
  Download,
  X,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type ActivityType =
  | 'crawl_started'
  | 'crawl_progress'
  | 'crawl_completed'
  | 'crawl_failed'
  | 'extraction_found'
  | 'extraction_stored'
  | 'extraction_skipped'
  | 'duplicate_detected'
  | 'error';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  timestamp: string;
  source_id?: string;
  source_name?: string;
  message: string;
  details?: {
    candidate_type?: string;
    candidate_key?: string;
    confidence?: number;
    reason?: string;
    url?: string;
    items_found?: number;
    items_processed?: number;
    error?: string;
  };
}

// =============================================================================
// MOCK DATA GENERATOR (replace with real-time subscription)
// =============================================================================

function generateMockEvents(): ActivityEvent[] {
  const now = new Date();
  const events: ActivityEvent[] = [];

  // Simulate recent activity
  const templates = [
    {
      type: 'crawl_started' as ActivityType,
      message: 'Started crawling PROVES GitHub organization',
      source_name: 'PROVES GitHub',
    },
    {
      type: 'extraction_found' as ActivityType,
      message: 'Found component: I2CDriver',
      details: {
        candidate_type: 'component',
        candidate_key: 'I2CDriver',
        confidence: 0.92,
        url: 'https://github.com/PROVES/PROVESKit/blob/main/src/drivers/i2c.py',
      },
    },
    {
      type: 'extraction_stored' as ActivityType,
      message: 'Stored coupling: I2CDriver → BatteryMonitor',
      details: {
        candidate_type: 'connection',
        candidate_key: 'I2CDriver→BatteryMonitor',
        confidence: 0.85,
        reason: 'Direct import dependency',
      },
    },
    {
      type: 'duplicate_detected' as ActivityType,
      message: 'Skipped duplicate: PowerManager (already exists)',
      details: {
        candidate_type: 'component',
        candidate_key: 'PowerManager',
        reason: 'Exact match in core_entities',
      },
    },
    {
      type: 'extraction_found' as ActivityType,
      message: 'Found interface: cmd/POWER_ON',
      details: {
        candidate_type: 'command',
        candidate_key: 'cmd/POWER_ON',
        confidence: 0.88,
      },
    },
    {
      type: 'crawl_progress' as ActivityType,
      message: 'Processing: docs/architecture.md',
      source_name: 'PROVES Docs',
      details: {
        items_found: 45,
        items_processed: 23,
      },
    },
    {
      type: 'error' as ActivityType,
      message: 'Rate limit reached for GitHub API',
      source_name: 'PROVES GitHub',
      details: {
        error: 'HTTP 429: Too Many Requests. Retrying in 60s.',
      },
    },
    {
      type: 'extraction_found' as ActivityType,
      message: 'Found system: Communication Subsystem',
      details: {
        candidate_type: 'system',
        candidate_key: 'Communication Subsystem',
        confidence: 0.78,
        reason: 'Inferred from documentation structure',
      },
    },
    {
      type: 'crawl_completed' as ActivityType,
      message: 'Completed crawl of PROVES Discord #engineering',
      source_name: 'PROVES Discord',
      details: {
        items_found: 156,
        items_processed: 142,
      },
    },
  ];

  // Generate events with staggered timestamps
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const timestamp = new Date(now.getTime() - (templates.length - i) * 30000); // 30s apart
    events.push({
      id: `evt-${i}`,
      type: template.type,
      timestamp: timestamp.toISOString(),
      source_name: template.source_name || 'Unknown Source',
      message: template.message,
      details: template.details,
    });
  }

  return events.reverse(); // Newest first
}

// =============================================================================
// COMPONENT
// =============================================================================

interface ActivityFeedProps {
  maxEvents?: number;
  autoScroll?: boolean;
  onEventClick?: (event: ActivityEvent) => void;
}

export function ActivityFeed({
  maxEvents = 50,
  autoScroll = true,
  onEventClick,
}: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load initial events
  useEffect(() => {
    setEvents(generateMockEvents());

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (!isPaused) {
        // Add a new random event
        const newEvent: ActivityEvent = {
          id: `evt-${Date.now()}`,
          type: 'extraction_found',
          timestamp: new Date().toISOString(),
          source_name: 'PROVES GitHub',
          message: `Found entity: Component_${Math.floor(Math.random() * 1000)}`,
          details: {
            candidate_type: 'component',
            candidate_key: `Component_${Math.floor(Math.random() * 1000)}`,
            confidence: 0.7 + Math.random() * 0.3,
          },
        };
        setEvents((prev) => [newEvent, ...prev].slice(0, maxEvents));
      }
    }, 5000); // New event every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused, maxEvents]);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (autoScroll && feedRef.current && !isPaused) {
      feedRef.current.scrollTop = 0;
    }
  }, [events, autoScroll, isPaused]);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.type === filter);

  const getEventIcon = (type: ActivityType) => {
    switch (type) {
      case 'crawl_started':
      case 'crawl_progress':
        return <FileSearch className="w-4 h-4 text-blue-500" />;
      case 'crawl_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'crawl_failed':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'extraction_found':
      case 'extraction_stored':
        return <Bot className="w-4 h-4 text-purple-500" />;
      case 'extraction_skipped':
      case 'duplicate_detected':
        return <Link2 className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventColor = (type: ActivityType) => {
    switch (type) {
      case 'crawl_started':
      case 'crawl_progress':
        return 'border-l-blue-500 bg-blue-50/50';
      case 'crawl_completed':
        return 'border-l-green-500 bg-green-50/50';
      case 'crawl_failed':
      case 'error':
        return 'border-l-red-500 bg-red-50/50';
      case 'extraction_found':
      case 'extraction_stored':
        return 'border-l-purple-500 bg-purple-50/50';
      case 'duplicate_detected':
        return 'border-l-yellow-500 bg-yellow-50/50';
      default:
        return 'border-l-gray-300 bg-gray-50/50';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Activity Feed</h3>
          {!isPaused && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ActivityType | 'all')}
            className="text-xs border border-gray-200 rounded px-2 py-1"
          >
            <option value="all">All Events</option>
            <option value="extraction_found">Extractions</option>
            <option value="crawl_progress">Crawls</option>
            <option value="error">Errors</option>
            <option value="duplicate_detected">Duplicates</option>
          </select>

          {/* Pause/Play */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded ${isPaused ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Events List */}
      <div ref={feedRef} className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Bot className="w-8 h-8 mb-2 text-gray-300" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`px-4 py-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${getEventColor(event.type)}`}
                onClick={() => {
                  setSelectedEvent(event);
                  onEventClick?.(event);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{event.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
                      {event.source_name && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-500">{event.source_name}</span>
                        </>
                      )}
                      {event.details?.confidence !== undefined && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className={`text-xs ${event.details.confidence >= 0.8 ? 'text-green-600' : event.details.confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {Math.round(event.details.confidence * 100)}% conf
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                {getEventIcon(selectedEvent.type)}
                <h4 className="font-medium text-gray-900">Event Details</h4>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Message</p>
                <p className="text-sm text-gray-900">{selectedEvent.message}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                <p className="text-sm text-gray-900">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
              </div>
              {selectedEvent.source_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Source</p>
                  <p className="text-sm text-gray-900">{selectedEvent.source_name}</p>
                </div>
              )}
              {selectedEvent.details && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Details</p>
                  <pre className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT VERSION (for sidebar/widget)
// =============================================================================

export function ActivityFeedCompact({ maxEvents = 5 }: { maxEvents?: number }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setEvents(generateMockEvents().slice(0, maxEvents));
  }, [maxEvents]);

  const getEventIcon = (type: ActivityType) => {
    switch (type) {
      case 'extraction_found':
      case 'extraction_stored':
        return <Bot className="w-3.5 h-3.5 text-purple-500" />;
      case 'crawl_completed':
        return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="flex items-center gap-2 text-xs text-gray-600">
          {getEventIcon(event.type)}
          <span className="truncate flex-1">{event.message}</span>
        </div>
      ))}
    </div>
  );
}
