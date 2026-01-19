/**
 * DiscoverySection - Smart URL Discovery UI
 *
 * Allows engineers to enter a website URL and crawl instructions,
 * then discover quality documentation pages for extraction.
 */

import { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Play,
  RefreshCw,
  FileText,
  Tag,
} from 'lucide-react';
import {
  discoverUrls,
  getPendingUrls,
  getTaskStatus,
  checkApiHealth,
  type DiscoveredUrl,
} from '@/lib/extractionApi';

// =============================================================================
// COMPONENT
// =============================================================================

export function DiscoverySection() {
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(50);
  const [instructions, setInstructions] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingUrls, setPendingUrls] = useState<DiscoveredUrl[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth().then((health) => {
      setApiAvailable(!!health);
    });
  }, []);

  // Poll for task status when discovering
  useEffect(() => {
    if (!currentTaskId || !isDiscovering) return;

    const interval = setInterval(async () => {
      try {
        const status = await getTaskStatus(currentTaskId);
        setTaskStatus(status.status);

        if (status.status === 'completed' || status.status === 'failed') {
          setIsDiscovering(false);
          if (status.status === 'completed') {
            // Refresh pending URLs list
            fetchPendingUrls();
          }
        }
      } catch (err) {
        console.error('Error polling task status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentTaskId, isDiscovering]);

  const fetchPendingUrls = async () => {
    setLoadingPending(true);
    try {
      const result = await getPendingUrls();
      setPendingUrls(result.urls);
    } catch (err) {
      console.error('Error fetching pending URLs:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Load pending URLs on mount
  useEffect(() => {
    fetchPendingUrls();
  }, []);

  const handleDiscover = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setError(null);
    setIsDiscovering(true);
    setTaskStatus('queued');

    try {
      const response = await discoverUrls(url.trim(), maxPages, instructions || undefined);
      setCurrentTaskId(response.task_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
      setIsDiscovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Smart URL Discovery</h2>
          <p className="text-sm text-gray-600">
            Crawl a documentation website and discover quality pages for extraction
          </p>
        </div>
        {apiAvailable === false && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-sm rounded-lg">
            <AlertCircle className="w-4 h-4" />
            Extraction API offline
          </div>
        )}
        {apiAvailable === true && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-lg">
            <CheckCircle className="w-4 h-4" />
            API connected
          </div>
        )}
      </div>

      {/* Discovery Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* URL Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.example.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isDiscovering}
              />
            </div>
          </div>

          {/* Max Pages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Pages to Discover
            </label>
            <input
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(Math.min(200, Math.max(1, parseInt(e.target.value) || 50)))}
              min={1}
              max={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isDiscovering}
            />
            <p className="text-xs text-gray-500 mt-1">1-200 pages</p>
          </div>

          {/* Instructions (optional) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Focus Instructions (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Focus on hardware assembly guides and component specifications"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isDiscovering}
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide context to help the crawler prioritize relevant pages
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Status */}
        {isDiscovering && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">Discovery in progress...</p>
              <p className="text-xs text-blue-700">
                Status: {taskStatus} | Task ID: {currentTaskId?.slice(0, 8)}...
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleDiscover}
          disabled={isDiscovering || !apiAvailable || !url.trim()}
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isDiscovering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Start Discovery
            </>
          )}
        </button>
      </div>

      {/* Pending URLs */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-semibold text-gray-900">
            Discovered URLs ({pendingUrls.length})
          </h3>
          <button
            onClick={fetchPendingUrls}
            disabled={loadingPending}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className={`w-4 h-4 ${loadingPending ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loadingPending && pendingUrls.length === 0 ? (
          <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        ) : pendingUrls.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No pending URLs</p>
            <p className="text-sm text-gray-500">
              Run a discovery to find documentation pages
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendingUrls.map((item, index) => (
              <div
                key={item.url}
                className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {Math.round(item.quality_score * 100)}
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 truncate"
                  >
                    {item.url}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  {item.summary && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{item.summary}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.keywords.slice(0, 5).map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
