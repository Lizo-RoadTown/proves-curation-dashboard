/**
 * ModelConfigDialog - Configure AI model API keys
 *
 * Users can either:
 * 1. Enter their own API key (stored locally, never sent to backend)
 * 2. Sign in with OAuth (for providers that support it)
 *
 * Keys never leave the browser - all API calls happen client-side.
 */

import { useState, useEffect } from 'react';
import {
  X,
  Key,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  ChevronDown,
  Cpu,
  Zap,
  Shield,
} from 'lucide-react';
import type { ModelProvider, UserModelConfig, ModelInfo } from '@/types/modelConfig';
import { MODEL_PROVIDERS, maskApiKey } from '@/types/modelConfig';

// =============================================================================
// COMPONENT
// =============================================================================

interface ModelConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: UserModelConfig | null;
  onSave: (config: UserModelConfig) => void;
  onValidate: (
    provider: ModelProvider,
    apiKey: string
  ) => Promise<{ valid: boolean; error?: string }>;
}

export function ModelConfigDialog({
  isOpen,
  onClose,
  currentConfig,
  onSave,
  onValidate,
}: ModelConfigDialogProps) {
  // Form state
  const [provider, setProvider] = useState<ModelProvider>(
    currentConfig?.provider || 'anthropic'
  );
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [selectedModel, setSelectedModel] = useState(
    currentConfig?.modelId || MODEL_PROVIDERS.anthropic.defaultModel
  );
  const [customEndpoint, setCustomEndpoint] = useState(
    currentConfig?.customEndpoint || 'http://localhost:11434'
  );

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);

  // UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset form when provider changes
  useEffect(() => {
    const providerInfo = MODEL_PROVIDERS[provider];
    setSelectedModel(providerInfo.defaultModel);
    setValidationResult(null);

    // For local provider, use endpoint instead of API key
    if (provider === 'local' && !apiKey.startsWith('http')) {
      setApiKey('');
    }
  }, [provider]);

  // Update form when current config changes
  useEffect(() => {
    if (currentConfig) {
      setProvider(currentConfig.provider);
      setApiKey(currentConfig.apiKey);
      setSelectedModel(currentConfig.modelId);
      if (currentConfig.customEndpoint) {
        setCustomEndpoint(currentConfig.customEndpoint);
      }
    }
  }, [currentConfig]);

  if (!isOpen) return null;

  const providerInfo = MODEL_PROVIDERS[provider];

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);

    const keyToValidate = provider === 'local' ? customEndpoint : apiKey;
    const result = await onValidate(provider, keyToValidate);

    setValidationResult(result);
    setIsValidating(false);
  };

  const handleSave = () => {
    const config: UserModelConfig = {
      provider,
      apiKey: provider === 'local' ? customEndpoint : apiKey,
      modelId: selectedModel,
      customEndpoint: provider === 'local' ? customEndpoint : undefined,
    };
    onSave(config);
    onClose();
  };

  const canSave = provider === 'local'
    ? customEndpoint.trim() !== ''
    : apiKey.trim() !== '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Model Settings</h2>
            <p className="text-sm text-gray-500">
              Your API key stays in your browser
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Security Note */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Your key is private</p>
              <p className="text-blue-700 mt-1">
                Your API key is stored only in your browser's local storage.
                It never touches our servers. All AI requests go directly
                from your browser to the provider.
              </p>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(MODEL_PROVIDERS) as ModelProvider[]).map((p) => {
                const info = MODEL_PROVIDERS[p];
                const isSelected = provider === p;

                return (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ProviderIcon provider={p} />
                    <div>
                      <div className="font-medium text-gray-900">{info.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {info.availableModels[0].name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          {provider !== 'local' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <a
                  href={providerInfo.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Get API key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder={providerInfo.apiKeyPlaceholder}
                  className="w-full pl-10 pr-20 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              {currentConfig?.apiKey && (
                <p className="text-xs text-gray-500 mt-1">
                  Current: {maskApiKey(currentConfig.apiKey)}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Server URL
              </label>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => {
                  setCustomEndpoint(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ollama default: http://localhost:11434
              </p>
            </div>
          )}

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <div className="space-y-2">
              {providerInfo.availableModels.map((model) => (
                <ModelOption
                  key={model.id}
                  model={model}
                  isSelected={selectedModel === model.id}
                  onSelect={() => setSelectedModel(model.id)}
                />
              ))}
            </div>
          </div>

          {/* Validation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleValidate}
              disabled={isValidating || !canSave}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Test Connection
            </button>

            {validationResult && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  validationResult.valid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {validationResult.valid ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Connected successfully
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    {validationResult.error || 'Connection failed'}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
              />
              Advanced settings
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4">
                <p className="text-xs text-gray-500">
                  Advanced settings like temperature and max tokens can be
                  configured here. These affect how the model generates responses.
                </p>
                {/* Add temperature/maxTokens sliders here if needed */}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ProviderIcon({ provider }: { provider: ModelProvider }) {
  const iconClass = 'w-6 h-6';

  switch (provider) {
    case 'anthropic':
      return (
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <span className="text-orange-600 font-bold text-sm">A</span>
        </div>
      );
    case 'openai':
      return (
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <span className="text-green-600 font-bold text-sm">O</span>
        </div>
      );
    case 'google':
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-bold text-sm">G</span>
        </div>
      );
    case 'local':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-purple-600" />
        </div>
      );
    default:
      return null;
  }
}

function ModelOption({
  model,
  isSelected,
  onSelect,
}: {
  model: ModelInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div>
        <div className="font-medium text-gray-900">{model.name}</div>
        {model.description && (
          <div className="text-xs text-gray-500">{model.description}</div>
        )}
      </div>
      <div className="text-xs text-gray-400">
        {(model.contextWindow / 1000).toFixed(0)}k context
      </div>
    </button>
  );
}
