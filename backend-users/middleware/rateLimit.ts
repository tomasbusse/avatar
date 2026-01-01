/**
 * Rate limiting middleware for user API endpoints
 * @param options Rate limiting options
 * @returns Middleware function
 */
export function rateLimit(options: { windowMs: number; max: number }) {
  const store = new Map<string, { count: number; resetTime: number }>();

  return (key: string) => {
    const now = Date.now();
    const entry = store.get(key);

    if (entry) {
      if (now > entry.resetTime) {
        entry.count = 1;
        entry.resetTime = now + options.windowMs;
        store.set(key, entry);
        return true;
      }

      if (entry.count >= options.max) {
        return false;
      }

      entry.count++;
      store.set(key, entry);
      return true;
    }

    store.set(key, { count: 1, resetTime: now + options.windowMs });
    return true;
  };
}