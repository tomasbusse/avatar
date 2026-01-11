"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  OpenRouterModel,
  GroupedModels,
  groupModelsByProvider,
  STORAGE_KEYS,
  MODELS_CACHE_DURATION,
} from "@/lib/game-generation/types";

interface UseOpenRouterModelsResult {
  models: OpenRouterModel[];
  groupedModels: GroupedModels;
  isLoading: boolean;
  error: string | null;
  recentModels: OpenRouterModel[];
  lastUsedModel: string | null;
  setLastUsedModel: (modelId: string) => void;
  refetch: () => Promise<void>;
}

export function useOpenRouterModels(): UseOpenRouterModelsResult {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentModelIds, setRecentModelIds] = useState<string[]>([]);
  const [lastUsedModel, setLastUsedModelState] = useState<string | null>(null);

  // Load recent models and last used from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRecent = localStorage.getItem(STORAGE_KEYS.RECENT_MODELS);
    if (storedRecent) {
      try {
        setRecentModelIds(JSON.parse(storedRecent));
      } catch {
        // Invalid JSON, ignore
      }
    }

    const storedLastModel = localStorage.getItem(STORAGE_KEYS.LAST_MODEL);
    if (storedLastModel) {
      setLastUsedModelState(storedLastModel);
    }
  }, []);

  // Fetch models from API
  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Check cache first
    if (typeof window !== "undefined") {
      const cachedModels = localStorage.getItem(STORAGE_KEYS.MODELS_CACHE);
      const cacheTime = localStorage.getItem(STORAGE_KEYS.MODELS_CACHE_TIME);

      if (cachedModels && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime, 10);
        if (cacheAge < MODELS_CACHE_DURATION) {
          try {
            const parsed = JSON.parse(cachedModels);
            setModels(parsed);
            setIsLoading(false);
            return;
          } catch {
            // Invalid cache, continue to fetch
          }
        }
      }
    }

    try {
      const response = await fetch("/api/llm/models");
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const modelList: OpenRouterModel[] = data.data || [];

      // Sort models by name within each provider
      modelList.sort((a, b) => a.name.localeCompare(b.name));

      setModels(modelList);

      // Cache the results
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.MODELS_CACHE, JSON.stringify(modelList));
        localStorage.setItem(STORAGE_KEYS.MODELS_CACHE_TIME, Date.now().toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Set last used model and update recent models
  const setLastUsedModel = useCallback((modelId: string) => {
    if (typeof window === "undefined") return;

    // Update last used
    localStorage.setItem(STORAGE_KEYS.LAST_MODEL, modelId);
    setLastUsedModelState(modelId);

    // Update recent models (keep last 5, no duplicates)
    setRecentModelIds((prev) => {
      const filtered = prev.filter((id) => id !== modelId);
      const updated = [modelId, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_KEYS.RECENT_MODELS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Group models by provider
  const groupedModels = useMemo(() => {
    return groupModelsByProvider(models);
  }, [models]);

  // Get recent models as full objects
  const recentModels = useMemo(() => {
    return recentModelIds
      .map((id) => models.find((m) => m.id === id))
      .filter((m): m is OpenRouterModel => m !== undefined);
  }, [recentModelIds, models]);

  return {
    models,
    groupedModels,
    isLoading,
    error,
    recentModels,
    lastUsedModel,
    setLastUsedModel,
    refetch: fetchModels,
  };
}

// Recommended models for game generation (curated list - 2025)
export const RECOMMENDED_MODELS = [
  // Anthropic - Latest
  "anthropic/claude-opus-4",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-haiku-4",
  "anthropic/claude-3.5-sonnet",
  // OpenAI - Latest
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/o1",
  "openai/o1-mini",
  // Google - Latest
  "google/gemini-2.5-flash-preview",
  "google/gemini-2.0-flash-001",
  "google/gemini-flash-1.5",
  "google/gemini-pro-1.5",
  // DeepSeek - Great value
  "deepseek/deepseek-chat",
  "deepseek/deepseek-r1",
  // Others
  "meta-llama/llama-3.3-70b-instruct",
  "mistralai/mistral-large-2411",
  "qwen/qwen-2.5-72b-instruct",
  "x-ai/grok-2-1212",
];

// Provider display order (most common first)
export const PROVIDER_ORDER = [
  "Anthropic",
  "Openai",
  "Google",
  "Deepseek",
  "Meta-llama",
  "Mistralai",
  "Qwen",
  "X-ai",
  "Cohere",
  "Perplexity",
  "01-ai",
  "Nvidia",
  "Microsoft",
  "Amazon",
];

export function sortProviders(providers: string[]): string[] {
  return providers.sort((a, b) => {
    const aIndex = PROVIDER_ORDER.indexOf(a);
    const bIndex = PROVIDER_ORDER.indexOf(b);

    // Known providers come first, in order
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // Alphabetical for unknown providers
    return a.localeCompare(b);
  });
}
