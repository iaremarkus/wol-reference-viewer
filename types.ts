export interface VerseData {
    type: 'verse';
    text: string;
    reference: string;
    translation?: string;
}

export interface WolData {
    type: 'wol';
    results: string[]; // outerHTML of each article.scalableui element
}

export type ReferenceData = VerseData | WolData;
