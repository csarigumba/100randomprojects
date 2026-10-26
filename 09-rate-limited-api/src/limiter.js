// Token bucket. Levels are stored in token*ms units (1 token = windowMs) so integer clocks stay exact.
export function createLimiter({ limit, windowMs, now = Date.now }) {
  const buckets = new Map(); // ponytail: never evicted, add a sweep if client count grows unbounded
  const max = limit * windowMs;
  return (key) => {
    const t = now();
    const b = buckets.get(key) ?? { level: max, at: t };
    b.level = Math.min(max, b.level + (t - b.at) * limit);
    b.at = t;
    buckets.set(key, b);
    const allowed = b.level >= windowMs;
    if (allowed) b.level -= windowMs;
    return {
      allowed,
      limit,
      remaining: Math.floor(b.level / windowMs),
      retryAfterMs: allowed ? 0 : Math.ceil((windowMs - b.level) / limit),
    };
  };
}
