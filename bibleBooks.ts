export const BIBLE_BOOKS: Record<string, string[]> = {
    'Genesis':          ['Ge', 'Gen', 'Gene'],
    'Exodus':           ['Ex', 'Exo', 'Exod'],
    'Leviticus':        ['Le', 'Lev', 'Levi'],
    'Numbers':          ['Nu', 'Num', 'Numb'],
    'Deuteronomy':      ['De', 'Deu', 'Deut'],
    'Joshua':           ['Jo', 'Jos', 'Josh'],
    'Judges':           ['Jg', 'Jud', 'Judg'],
    'Ruth':             ['Ru', 'Rut'],
    '1 Samuel':         ['1Sa', '1Sam', '1 Sam'],
    '2 Samuel':         ['2Sa', '2Sam', '2 Sam'],
    '1 Kings':          ['1Ki', '1Kin', '1 Ki'],
    '2 Kings':          ['2Ki', '2Kin', '2 Ki'],
    '1 Chronicles':     ['1Ch', '1Chr', '1 Chr'],
    '2 Chronicles':     ['2Ch', '2Chr', '2 Chr'],
    'Ezra':             ['Ezr'],
    'Nehemiah':         ['Ne', 'Neh'],
    'Esther':           ['Es', 'Est', 'Esth'],
    'Job':              ['Job'],
    'Psalms':           ['Ps', 'Psa', 'Psalm'],
    'Proverbs':         ['Pr', 'Pro', 'Prov'],
    'Ecclesiastes':     ['Ec', 'Ecc', 'Eccl'],
    'Song of Solomon':  ['So', 'Song', 'Ca', 'SS'],
    'Isaiah':           ['Is', 'Isa'],
    'Jeremiah':         ['Je', 'Jer'],
    'Lamentations':     ['La', 'Lam'],
    'Ezekiel':          ['Eze', 'Ezek'],
    'Daniel':           ['Da', 'Dan'],
    'Hosea':            ['Ho', 'Hos'],
    'Joel':             ['Joe', 'Joel'],
    'Amos':             ['Am', 'Amo'],
    'Obadiah':          ['Ob', 'Oba'],
    'Jonah':            ['Jon'],
    'Micah':            ['Mi', 'Mic'],
    'Nahum':            ['Na', 'Nah'],
    'Habakkuk':         ['Hab'],
    'Zephaniah':        ['Ze', 'Zep', 'Zeph'],
    'Haggai':           ['Hag'],
    'Zechariah':        ['Zec', 'Zech'],
    'Malachi':          ['Mal'],
    'Matthew':          ['Mt', 'Mat', 'Matt'],
    'Mark':             ['Mr', 'Mar', 'Mrk'],
    'Luke':             ['Lu', 'Luk'],
    'John':             ['Joh', 'Jn'],
    'Acts':             ['Ac', 'Act'],
    'Romans':           ['Ro', 'Rom'],
    '1 Corinthians':    ['1Co', '1Cor', '1 Cor'],
    '2 Corinthians':    ['2Co', '2Cor', '2 Cor'],
    'Galatians':        ['Ga', 'Gal'],
    'Ephesians':        ['Ep', 'Eph'],
    'Philippians':      ['Php', 'Phil'],
    'Colossians':       ['Col'],
    '1 Thessalonians':  ['1Th', '1Thes', '1Thess', '1 Thes'],
    '2 Thessalonians':  ['2Th', '2Thes', '2Thess', '2 Thes'],
    '1 Timothy':        ['1Ti', '1Tim', '1 Tim'],
    '2 Timothy':        ['2Ti', '2Tim', '2 Tim'],
    'Titus':            ['Tit'],
    'Philemon':         ['Phm', 'Phile'],
    'Hebrews':          ['Heb'],
    'James':            ['Jas'],
    '1 Peter':          ['1Pe', '1Pet', '1 Pet'],
    '2 Peter':          ['2Pe', '2Pet', '2 Pet'],
    '1 John':           ['1Jo', '1Jn', '1 Jn'],
    '2 John':           ['2Jo', '2Jn', '2 Jn'],
    '3 John':           ['3Jo', '3Jn', '3 Jn'],
    'Jude':             ['Jude'],
    'Revelation':       ['Re', 'Rev'],
};

// Flat token list built once at module load for fast matching
const ALL_TOKENS: string[] = [];
for (const [name, abbrevs] of Object.entries(BIBLE_BOOKS)) {
    ALL_TOKENS.push(name.toLowerCase());
    for (const a of abbrevs) ALL_TOKENS.push(a.toLowerCase());
}

export function isBibleVerse(ref: string): boolean {
    const normalized = ref.trim().toLowerCase();
    for (const token of ALL_TOKENS) {
        if (!normalized.startsWith(token)) continue;
        const next = normalized[token.length];
        // Token must be followed by a space, a digit, or end-of-string to avoid
        // false matches (e.g. "Jo" matching "John")
        if (next === undefined || next === ' ' || (next >= '0' && next <= '9')) {
            return true;
        }
    }
    return false;
}
