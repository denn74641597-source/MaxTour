/**
 * Lightweight in-memory TTL cache with request deduplication.
 *
 * Works in any runtime (Node.js, Cloudflare Workers).
 * On Cloudflare Workers the module-level Map persists across requests
 * handled by the same isolate, so repeated homepage loads within the
 * TTL window skip the database entirely.
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Return cached data when available; otherwise execute `fn`, cache the
 * result for `ttlSeconds`, and deduplicate concurrent in-flight calls
 * for the same key.
 */
export async function withTTLCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  const now = Date.now();

  // Serve from cache if still fresh
  const cached = store.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expires > now) {
    return cached.data;
  }

  // Deduplicate concurrent requests for the same key
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn()
    .then((data) => {
      store.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}
