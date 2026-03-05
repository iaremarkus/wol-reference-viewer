import { VerseData, WolData, ReferenceData } from './types';
import { isBibleVerse } from './bibleBooks';

const WORKER_BASE = 'https://verse-api-worker.mark-11f.workers.dev';

const verseCache = new Map<string, VerseData>();
const wolCache   = new Map<string, WolData>();

export function clearVerseCache() {
    verseCache.clear();
    wolCache.clear();
}

export async function fetchVerse(verseRef: string): Promise<VerseData | null> {
    const key = verseRef.trim().toLowerCase();
    if (verseCache.has(key)) return verseCache.get(key)!;

    try {
        const response = await fetch(`${WORKER_BASE}/${encodeURIComponent(verseRef)}`);
        if (!response.ok) return null;
        const raw = await response.json();
        const data: VerseData = { type: 'verse', ...raw };
        verseCache.set(key, data);
        return data;
    } catch (e) {
        console.error(`Error fetching verse "${verseRef}":`, e);
        return null;
    }
}

export async function fetchWol(ref: string): Promise<WolData | null> {
    const key = ref.trim().toLowerCase();
    if (wolCache.has(key)) return wolCache.get(key)!;

    try {
        const response = await fetch(`${WORKER_BASE}/wol/${encodeURIComponent(ref)}`);
        if (!response.ok) return null;
        const raw = await response.json() as { results: string[] };
        const data: WolData = { type: 'wol', results: raw.results ?? [] };
        wolCache.set(key, data);
        return data;
    } catch (e) {
        console.error(`Error fetching WOL "${ref}":`, e);
        return null;
    }
}

export async function fetchReference(ref: string): Promise<ReferenceData | null> {
    return isBibleVerse(ref) ? fetchVerse(ref) : fetchWol(ref);
}
