export interface ReferenceData {
    type: 'reference';
    ref: string;           // the original query string
    results: string[];     // HTML strings from each result
}
