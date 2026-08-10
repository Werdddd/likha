const MIN_RATIO = 0.58;
const MAX_RATIO = 1.65;

/** Deterministic width/height ratio derived from an id — stable across re-renders. */
export function pseudoRatioForId(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash >>>= 0;

  // FNV-1a barely mixes near-identical short strings (e.g. "p1", "p2", …),
  // so run the result through a Murmur3-style finalizer to spread bits fully.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;

  const normalized = (hash >>> 0) / 0xffffffff;
  return MIN_RATIO + normalized * (MAX_RATIO - MIN_RATIO);
}

/** Greedily splits items into two columns, balancing estimated total height. */
export function splitIntoBalancedColumns<T>(
  items: T[],
  getRatio: (item: T) => number,
  captionHeight = 0,
): [T[], T[]] {
  const columns: [T[], T[]] = [[], []];
  const heights = [0, 0];

  for (const item of items) {
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push(item);
    heights[target] += 1 / getRatio(item) + captionHeight;
  }

  return columns;
}
