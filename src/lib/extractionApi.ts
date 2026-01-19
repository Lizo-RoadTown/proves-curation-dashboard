/**
 * Extraction API Client
 *
 * Calls the PROVES extraction API to trigger extraction jobs.
 */

const EXTRACTION_API_URL = import.meta.env.VITE_EXTRACTION_API_URL || 'http://localhost:8080';

// =============================================================================
// TYPES
// =============================================================================

export interface ExtractRequest {
  urls: string[];
  source_id?: string;
}

export interface ExtractJobRequest {
  job_id: string;
}

export interface ExtractResponse {
  task_id: string;
  status: string;
  message: string;
  urls_queued: number;
}

export interface TaskStatus {
  task_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  urls_total: number;
  processed: number;
  failed: number;
  results: Array<{
    url: string;
    status: string;
    error?: string;
  }>;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
}

export interface DiscoverRequest {
  starting_url: string;
  max_pages?: number;
  instructions?: string;
}

export interface DiscoverResponse {
  task_id: string;
  status: string;
  starting_url: string;
  max_pages: number;
}

export interface DiscoveredUrl {
  url: string;
  quality_score: number;
  quality_reason: string;
  components: string[];
  interfaces: string[];
  keywords: string[];
  summary: string;
}

export interface PendingUrlsResponse {
  count: number;
  urls: DiscoveredUrl[];
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Check if the extraction API is available
 */
export async function checkApiHealth(): Promise<HealthStatus | null> {
  try {
    const response = await fetch(`${EXTRACTION_API_URL}/health`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Extraction API health check failed:', error);
    return null;
  }
}

/**
 * Trigger extraction for a list of URLs
 */
export async function triggerExtraction(urls: string[], sourceId?: string): Promise<ExtractResponse> {
  const response = await fetch(`${EXTRACTION_API_URL}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      urls,
      source_id: sourceId,
    } as ExtractRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Process a crawl job (from dashboard trigger)
 */
export async function processJob(jobId: string): Promise<ExtractResponse> {
  const response = await fetch(`${EXTRACTION_API_URL}/extract/job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_id: jobId,
    } as ExtractJobRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get the status of an extraction task
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await fetch(`${EXTRACTION_API_URL}/tasks/${taskId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Poll for task completion
 */
export async function waitForTask(
  taskId: string,
  onProgress?: (status: TaskStatus) => void,
  pollInterval = 2000,
  maxWait = 300000 // 5 minutes
): Promise<TaskStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const status = await getTaskStatus(taskId);

    if (onProgress) {
      onProgress(status);
    }

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Task timed out');
}

/**
 * Start URL discovery from a website
 */
export async function discoverUrls(
  startingUrl: string,
  maxPages = 50,
  instructions?: string
): Promise<DiscoverResponse> {
  const response = await fetch(`${EXTRACTION_API_URL}/discover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      starting_url: startingUrl,
      max_pages: maxPages,
      instructions,
    } as DiscoverRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get pending discovered URLs
 */
export async function getPendingUrls(): Promise<PendingUrlsResponse> {
  const response = await fetch(`${EXTRACTION_API_URL}/discover/pending`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
