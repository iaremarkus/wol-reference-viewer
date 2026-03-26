import { requestUrl } from "obsidian";
import { ReferenceData } from "./types";

const WORKER_BASE = "https://wol-worker.iaremark.us";

interface CacheEntry {
  data: ReferenceData;
  ts: number;
}
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const referenceCache = new Map<string, CacheEntry>();

function slugify(ref: string): string {
  return ref
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/, "");
}

function isFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.ts < CACHE_TTL_MS;
}

export function clearReferenceCache() {
  referenceCache.clear();
}

export function isCached(ref: string): boolean {
  const key = slugify(ref);
  const entry = referenceCache.get(key);
  return !!entry && isFresh(entry);
}

export async function fetchReference(
  ref: string,
  signal?: AbortSignal,
): Promise<ReferenceData | null> {
  const key = slugify(ref);
  const cached = referenceCache.get(key);
  if (cached && isFresh(cached)) return cached.data;

  if (signal?.aborted) return null;

  try {
    const response = await requestUrl(`${WORKER_BASE}/${encodeURIComponent(ref)}`);
    if (signal?.aborted) return null;
    if (response.status !== 200) return null;
    const raw = response.json as { results: string[] };
    const data: ReferenceData = {
      type: "reference",
      ref,
      results: raw.results ?? [],
    };
    referenceCache.set(key, { data, ts: Date.now() });
    return data;
  } catch (e) {
    if (signal?.aborted) return null;
    console.error(`Error fetching reference "${ref}":`, e);
    return null;
  }
}
