/**
 * Rate Limiter Utility for Video Generator API Routes
 *
 * Provides exponential backoff retry logic for external API calls.
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  // Check if error is retryable (default: rate limits, timeouts, server errors)
  isRetryable?: (error: Error) => boolean;
  // Called before each retry
  onRetry?: (attempt: number, delay: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  isRetryable: (error: Error) => {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("rate") ||
      msg.includes("limit") ||
      msg.includes("throttl") ||
      msg.includes("timeout") ||
      msg.includes("econnreset") ||
      msg.includes("503") ||
      msg.includes("502") ||
      msg.includes("429") ||
      msg.includes("too many")
    );
  },
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, baseMs: number, maxMs: number): number {
  // Exponential backoff: baseMs * 2^attempt
  const exponentialDelay = baseMs * Math.pow(2, attempt);
  // Add jitter (0-25% of delay)
  const jitter = Math.random() * 0.25 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxMs);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.isRetryable(lastError)) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
      opts.onRetry(attempt + 1, delay, lastError);

      console.log(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries}, ` +
        `waiting ${Math.round(delay)}ms: ${lastError.message.slice(0, 100)}`
      );

      await sleep(delay);
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Fetch with automatic retry on rate limits
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, init);

    // Treat certain status codes as retryable errors
    if (response.status === 429 || response.status === 503 || response.status === 502) {
      const retryAfter = response.headers.get("retry-after");
      const errorText = await response.text();
      throw new Error(
        `Rate limit (${response.status}): ${errorText.slice(0, 200)}` +
        (retryAfter ? ` Retry-After: ${retryAfter}s` : "")
      );
    }

    return response;
  }, {
    ...options,
    isRetryable: (error) => {
      // Check both custom function and default
      const defaultCheck = DEFAULT_OPTIONS.isRetryable(error);
      const customCheck = options?.isRetryable?.(error) ?? true;
      return defaultCheck || customCheck;
    },
  });
}

/**
 * Simple in-memory rate limiter for request spacing
 * Ensures minimum time between requests to same endpoint
 */
class RequestSpacer {
  private lastRequestTime: Map<string, number> = new Map();

  /**
   * Wait if needed to ensure minimum time since last request
   */
  async space(key: string, minIntervalMs: number): Promise<void> {
    const lastTime = this.lastRequestTime.get(key) || 0;
    const elapsed = Date.now() - lastTime;

    if (elapsed < minIntervalMs) {
      await sleep(minIntervalMs - elapsed);
    }

    this.lastRequestTime.set(key, Date.now());
  }
}

// Global request spacer
export const requestSpacer = new RequestSpacer();
