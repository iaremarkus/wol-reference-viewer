import { VerseData } from './types';

const cache = new Map<string, VerseData>();

export function clearVerseCache() {
    cache.clear();
}

export async function fetchVerse(verseRef: string): Promise<VerseData | null> {
    const key = verseRef.trim().toLowerCase();

    if (cache.has(key)) return cache.get(key)!;

    try {
        const response = await fetch(
            `https://verse-api-worker.mark-11f.workers.dev/${encodeURIComponent(verseRef)}`
        );
        if (!response.ok) return null;
        const data: VerseData = await response.json();
        cache.set(key, data);
        return data;
    } catch (error) {
        console.error(`Error fetching verse "${verseRef}":`, error);
        return null;
    }
}
