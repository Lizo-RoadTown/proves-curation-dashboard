/**
 * Model Configuration Types
 *
 * Users provide their own API keys for AI models.
 * Keys are stored locally (localStorage) - never sent to our backend.
 */

// =============================================================================
// SUPPORTED PROVIDERS
// =============================================================================

export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'local';

export interface ModelProviderInfo {
  id: ModelProvider;
  name: string;
  description: string;
  apiKeyUrl: string;
  apiKeyPlaceholder: string;
  defaultModel: string;
  availableModels: ModelInfo[];
  supportsStreaming: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  description?: string;
}

// =============================================================================
// PROVIDER DEFINITIONS
// =============================================================================

export const MODEL_PROVIDERS: Record<ModelProvider, ModelProviderInfo> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models - excellent at reasoning and following instructions',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    apiKeyPlaceholder: 'sk-ant-api03-...',
    defaultModel: 'claude-sonnet-4-20250514',
    supportsStreaming: true,
    availableModels: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        contextWindow: 200000,
        maxOutput: 8192,
        description: 'Best balance of intelligence and speed',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        maxOutput: 8192,
        description: 'Fastest model, great for quick tasks',
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        contextWindow: 200000,
        maxOutput: 8192,
        description: 'Most capable, best for complex reasoning',
      },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models - widely used with extensive capabilities',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyPlaceholder: 'sk-proj-...',
    defaultModel: 'gpt-4o',
    supportsStreaming: true,
    availableModels: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        contextWindow: 128000,
        maxOutput: 16384,
        description: 'Most capable GPT model',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        contextWindow: 128000,
        maxOutput: 16384,
        description: 'Faster and cheaper, still capable',
      },
      {
        id: 'o1',
        name: 'o1',
        contextWindow: 200000,
        maxOutput: 100000,
        description: 'Best for complex reasoning tasks',
      },
    ],
  },
  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini models - multimodal with long context',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    apiKeyPlaceholder: 'AIza...',
    defaultModel: 'gemini-2.0-flash',
    supportsStreaming: true,
    availableModels: [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        contextWindow: 1000000,
        maxOutput: 8192,
        description: 'Fast with very long context',
      },
      {
        id: 'gemini-2.0-pro',
        name: 'Gemini 2.0 Pro',
        contextWindow: 1000000,
        maxOutput: 8192,
        description: 'Most capable Gemini model',
      },
    ],
  },
  local: {
    id: 'local',
    name: 'Local Model',
    description: 'Connect to a locally running model (Ollama, LM Studio)',
    apiKeyUrl: '',
    apiKeyPlaceholder: 'http://localhost:11434',
    defaultModel: 'llama3.2',
    supportsStreaming: true,
    availableModels: [
      {
        id: 'llama3.2',
        name: 'Llama 3.2',
        contextWindow: 128000,
        maxOutput: 4096,
        description: 'Local open-source model',
      },
      {
        id: 'mistral',
        name: 'Mistral',
        contextWindow: 32000,
        maxOutput: 4096,
        description: 'Efficient local model',
      },
      {
        id: 'custom',
        name: 'Custom Model',
        contextWindow: 8000,
        maxOutput: 2048,
        description: 'Specify your own model name',
      },
    ],
  },
};

// =============================================================================
// USER CONFIGURATION
// =============================================================================

/**
 * User's saved model configuration
 * Stored in localStorage, never sent to backend
 */
export interface UserModelConfig {
  provider: ModelProvider;
  apiKey: string;
  modelId: string;
  customEndpoint?: string; // For local models
  customModelName?: string; // For custom local models
  temperature?: number;
  maxTokens?: number;
}

/**
 * Validated configuration with masked key
 */
export interface ModelConfigDisplay {
  provider: ModelProvider;
  providerName: string;
  modelName: string;
  isConfigured: boolean;
  keyMasked: string; // "sk-...xyz"
}

// =============================================================================
// LOCAL STORAGE HELPERS
// =============================================================================

const STORAGE_KEY = 'proves_model_config';

export function loadModelConfig(): UserModelConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserModelConfig;
  } catch {
    return null;
  }
}

export function saveModelConfig(config: UserModelConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearModelConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export function getConfigDisplay(config: UserModelConfig | null): ModelConfigDisplay {
  if (!config || !config.apiKey) {
    return {
      provider: 'anthropic',
      providerName: 'Not configured',
      modelName: 'No model selected',
      isConfigured: false,
      keyMasked: '',
    };
  }

  const providerInfo = MODEL_PROVIDERS[config.provider];
  const modelInfo = providerInfo.availableModels.find((m) => m.id === config.modelId);

  return {
    provider: config.provider,
    providerName: providerInfo.name,
    modelName: modelInfo?.name || config.modelId,
    isConfigured: true,
    keyMasked: maskApiKey(config.apiKey),
  };
}
