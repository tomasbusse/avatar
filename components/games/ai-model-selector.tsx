"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Star, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useOpenRouterModels,
  sortProviders,
  RECOMMENDED_MODELS,
} from "@/hooks/use-openrouter-models";
import {
  OpenRouterModel,
  formatModelPricing,
} from "@/lib/game-generation/types";

interface AIModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AIModelSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a model...",
}: AIModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    models,
    groupedModels,
    isLoading,
    error,
    recentModels,
    setLastUsedModel,
    refetch,
  } = useOpenRouterModels();

  // Find the selected model
  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === value);
  }, [models, value]);

  // Get recommended models from the full list
  const recommendedModels = useMemo(() => {
    return RECOMMENDED_MODELS.map((id) => models.find((m) => m.id === id)).filter(
      (m): m is OpenRouterModel => m !== undefined
    );
  }, [models]);

  // Filter models based on search
  const filteredGroupedModels = useMemo(() => {
    if (!search.trim()) return groupedModels;

    const searchLower = search.toLowerCase();
    const filtered: typeof groupedModels = {};

    Object.entries(groupedModels).forEach(([provider, providerModels]) => {
      const matchingModels = providerModels.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.id.toLowerCase().includes(searchLower)
      );
      if (matchingModels.length > 0) {
        filtered[provider] = matchingModels;
      }
    });

    return filtered;
  }, [groupedModels, search]);

  // Sort providers
  const sortedProviders = useMemo(() => {
    return sortProviders(Object.keys(filteredGroupedModels));
  }, [filteredGroupedModels]);

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setLastUsedModel(modelId);
    setOpen(false);
  };

  const formatModelDisplay = (model: OpenRouterModel) => {
    const pricing = formatModelPricing(model.pricing);
    return (
      <div className="flex items-center justify-between w-full">
        <span className="truncate">{model.name}</span>
        <span className="text-xs text-muted-foreground ml-2 shrink-0">
          {pricing.formatted}
        </span>
      </div>
    );
  };

  if (error) {
    return (
      <Button variant="outline" disabled className="w-full justify-between">
        <span className="text-destructive">Failed to load models</span>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading models...
            </span>
          ) : selectedModel ? (
            <span className="truncate">{selectedModel.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3 py-2">
            <CommandInput
              placeholder="Search models..."
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Clear cache and refetch
                if (typeof window !== "undefined") {
                  localStorage.removeItem("beethoven_openrouter_models_cache_v2");
                  localStorage.removeItem("beethoven_openrouter_models_cache_time_v2");
                }
                refetch();
              }}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              title="Refresh models list"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No models found.</CommandEmpty>

            {/* Recent Models */}
            {!search && recentModels.length > 0 && (
              <>
                <CommandGroup heading="Recently Used">
                  {recentModels.map((model) => (
                    <CommandItem
                      key={`recent-${model.id}`}
                      value={model.id}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === model.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {formatModelDisplay(model)}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Recommended Models */}
            {!search && recommendedModels.length > 0 && (
              <>
                <CommandGroup heading="Recommended for Game Generation">
                  {recommendedModels.map((model) => (
                    <CommandItem
                      key={`rec-${model.id}`}
                      value={model.id}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === model.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Star className="mr-2 h-3 w-3 text-yellow-500" />
                      {formatModelDisplay(model)}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* All Models by Provider */}
            {sortedProviders.map((provider) => (
              <CommandGroup key={provider} heading={provider}>
                {filteredGroupedModels[provider].map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === model.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {formatModelDisplay(model)}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Compact version for inline use
export function AIModelSelectorCompact({
  value,
  onChange,
  disabled = false,
}: AIModelSelectorProps) {
  const { models, isLoading } = useOpenRouterModels();

  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === value);
  }, [models, value]);

  if (isLoading) {
    return <span className="text-sm text-muted-foreground">Loading...</span>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Model:</span>
      <span className="font-medium">{selectedModel?.name || value}</span>
    </div>
  );
}
