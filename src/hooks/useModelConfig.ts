/**
 * useModelConfig - Hook for managing user's AI model configuration
 *
 * Features:
 * - Load/save configuration from localStorage
 * - Validate API keys by making a test request
 * - Generate chat completions using user's API key
 * - Streaming support for real-time responses
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  UserModelConfig,
  ModelConfigDisplay,
  ModelProvider,
} from '@/types/modelConfig';
import {
  loadModelConfig,
  saveModelConfig,
  clearModelConfig,
  getConfigDisplay,
  MODEL_PROVIDERS,
} from '@/types/modelConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  onStream?: (chunk: string) => void;
}

export interface UseModelConfigResult {
  // Configuration state
  config: UserModelConfig | null;
  configDisplay: ModelConfigDisplay;
  isConfigured: boolean;

  // Actions
  setConfig: (config: UserModelConfig) => void;
  clearConfig: () => void;
  validateApiKey: (provider: ModelProvider, apiKey: string) => Promise<{
    valid: boolean;
    error?: string;
  }>;

  // Chat completion
  generateCompletion: (options: ChatCompletionOptions) => Promise<string>;
  isGenerating: boolean;
  abortGeneration: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useModelConfig(): UseModelConfigResult {
  const [config, setConfigState] = useState<UserModelConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Load config on mount
  useEffect(() => {
    const loaded = loadModelConfig();
    setConfigState(loaded);
  }, []);

  const configDisplay = getConfigDisplay(config);
  const isConfigured = configDisplay.isConfigured;

  // ==========================================================================
  // CONFIGURATION ACTIONS
  // ==========================================================================

  const setConfig = useCallback((newConfig: UserModelConfig) => {
    saveModelConfig(newConfig);
    setConfigState(newConfig);
  }, []);

  const clearConfig = useCallback(() => {
    clearModelConfig();
    setConfigState(null);
  }, []);

  const abortGeneration = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setIsGenerating(false);
  }, [abortController]);

  // ==========================================================================
  // API KEY VALIDATION
  // ==========================================================================

  const validateApiKey = useCallback(
    async (
      provider: ModelProvider,
      apiKey: string
    ): Promise<{ valid: boolean; error?: string }> => {
      if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'API key is required' };
      }

      try {
        switch (provider) {
          case 'anthropic': {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
              },
              body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }],
              }),
            });

            if (response.status === 401) {
              return { valid: false, error: 'Invalid API key' };
            }
            if (response.status === 400) {
              // Key is valid but request might have issues - that's ok
              return { valid: true };
            }
            if (!response.ok) {
              const error = await response.text();
              return { valid: false, error: `API error: ${error}` };
            }
            return { valid: true };
          }

          case 'openai': {
            const response = await fetch('https://api.openai.com/v1/models', {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.status === 401) {
              return { valid: false, error: 'Invalid API key' };
            }
            if (!response.ok) {
              return { valid: false, error: 'API validation failed' };
            }
            return { valid: true };
          }

          case 'google': {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
              { method: 'GET' }
            );

            if (response.status === 400 || response.status === 401) {
              return { valid: false, error: 'Invalid API key' };
            }
            if (!response.ok) {
              return { valid: false, error: 'API validation failed' };
            }
            return { valid: true };
          }

          case 'local': {
            // For local models, try to connect to the endpoint
            const endpoint = apiKey; // apiKey field holds the endpoint for local
            try {
              const response = await fetch(`${endpoint}/api/tags`, {
                method: 'GET',
              });
              if (!response.ok) {
                return { valid: false, error: 'Cannot connect to local server' };
              }
              return { valid: true };
            } catch {
              return { valid: false, error: 'Cannot connect to local server' };
            }
          }

          default:
            return { valid: false, error: 'Unknown provider' };
        }
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        };
      }
    },
    []
  );

  // ==========================================================================
  // CHAT COMPLETION
  // ==========================================================================

  const generateCompletion = useCallback(
    async (options: ChatCompletionOptions): Promise<string> => {
      if (!config || !config.apiKey) {
        throw new Error('Model not configured. Please set up your API key in settings.');
      }

      const controller = new AbortController();
      setAbortController(controller);
      setIsGenerating(true);

      const { messages, systemPrompt, onStream } = options;
      const temperature = options.temperature ?? config.temperature ?? 0.7;
      const maxTokens = options.maxTokens ?? config.maxTokens ?? 4096;

      try {
        let fullResponse = '';

        switch (config.provider) {
          case 'anthropic': {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
              },
              body: JSON.stringify({
                model: config.modelId,
                max_tokens: maxTokens,
                temperature,
                system: systemPrompt,
                messages: messages.filter((m) => m.role !== 'system'),
                stream: !!onStream,
              }),
              signal: controller.signal,
            });

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Anthropic API error: ${error}`);
            }

            if (onStream && response.body) {
              // Handle streaming response
              const reader = response.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6));
                      if (data.type === 'content_block_delta' && data.delta?.text) {
                        fullResponse += data.delta.text;
                        onStream(data.delta.text);
                      }
                    } catch {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            } else {
              const data = await response.json();
              fullResponse = data.content?.[0]?.text || '';
            }
            break;
          }

          case 'openai': {
            const openaiMessages = systemPrompt
              ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
              : messages;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
              },
              body: JSON.stringify({
                model: config.modelId,
                messages: openaiMessages,
                max_tokens: maxTokens,
                temperature,
                stream: !!onStream,
              }),
              signal: controller.signal,
            });

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`OpenAI API error: ${error}`);
            }

            if (onStream && response.body) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                      const data = JSON.parse(line.slice(6));
                      const content = data.choices?.[0]?.delta?.content;
                      if (content) {
                        fullResponse += content;
                        onStream(content);
                      }
                    } catch {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            } else {
              const data = await response.json();
              fullResponse = data.choices?.[0]?.message?.content || '';
            }
            break;
          }

          case 'google': {
            const geminiMessages = messages.map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            }));

            if (systemPrompt) {
              geminiMessages.unshift({
                role: 'user',
                parts: [{ text: `System: ${systemPrompt}` }],
              });
            }

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${config.modelId}:generateContent?key=${config.apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: geminiMessages,
                  generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature,
                  },
                }),
                signal: controller.signal,
              }
            );

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Google AI error: ${error}`);
            }

            const data = await response.json();
            fullResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (onStream) {
              onStream(fullResponse);
            }
            break;
          }

          case 'local': {
            const endpoint = config.customEndpoint || config.apiKey;
            const modelName = config.customModelName || config.modelId;

            const response = await fetch(`${endpoint}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: modelName,
                messages: systemPrompt
                  ? [{ role: 'system', content: systemPrompt }, ...messages]
                  : messages,
                stream: !!onStream,
                options: { temperature },
              }),
              signal: controller.signal,
            });

            if (!response.ok) {
              throw new Error('Local model request failed');
            }

            if (onStream && response.body) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.trim()) {
                    try {
                      const data = JSON.parse(line);
                      if (data.message?.content) {
                        fullResponse += data.message.content;
                        onStream(data.message.content);
                      }
                    } catch {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            } else {
              const data = await response.json();
              fullResponse = data.message?.content || '';
            }
            break;
          }
        }

        return fullResponse;
      } finally {
        setIsGenerating(false);
        setAbortController(null);
      }
    },
    [config]
  );

  return {
    config,
    configDisplay,
    isConfigured,
    setConfig,
    clearConfig,
    validateApiKey,
    generateCompletion,
    isGenerating,
    abortGeneration,
  };
}
