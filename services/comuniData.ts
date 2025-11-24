export interface Comune {
    nome: string;
    codice: string;
    zona: {
        nome: string;
        codice: string;
    };
    regione: {
        nome: string;
        codice: string;
    };
    provincia: {
        nome: string;
        codice: string;
    };
    sigla: string;
    codiceCatastale: string;
    cap: string[];
}

let comuniCache: Comune[] | null = null;

/**
 * Load comuni data (lazy loaded)
 */
async function loadComuni(): Promise<Comune[]> {
    if (comuniCache) {
        return comuniCache;
    }

    try {
        const response = await fetch('/comuni.json');
        if (!response.ok) {
            throw new Error('Failed to load comuni data');
        }
        comuniCache = await response.json();
        return comuniCache || [];
    } catch (error) {
        console.error('Error loading comuni:', error);
        return [];
    }
}

/**
 * Search comuni by name (fuzzy search)
 */
export async function searchComuni(query: string, limit: number = 10): Promise<Comune[]> {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const comuni = await loadComuni();
    // Normalize query to lowercase to handle uppercase input from form
    const normalizedQuery = query.toLowerCase().trim();

    // Prioritize: exact matches > starts-with > word boundary > contains
    const exactMatches: Comune[] = [];
    const startsWithMatches: Comune[] = [];
    const wordBoundaryMatches: Comune[] = [];
    const containsMatches: Comune[] = [];

    for (const comune of comuni) {
        const normalizedName = comune.nome.toLowerCase();

        if (normalizedName === normalizedQuery) {
            exactMatches.push(comune);
        } else if (normalizedName.startsWith(normalizedQuery)) {
            startsWithMatches.push(comune);
        } else if (normalizedName.includes(' ' + normalizedQuery)) {
            // Word boundary match (e.g., "San Roma" matches "roma")
            wordBoundaryMatches.push(comune);
        } else if (normalizedName.includes(normalizedQuery)) {
            containsMatches.push(comune);
        }

        // Early exit if we have enough high-quality results
        if (exactMatches.length + startsWithMatches.length >= limit) {
            break;
        }
    }

    return [...exactMatches, ...startsWithMatches, ...wordBoundaryMatches, ...containsMatches].slice(0, limit);
}

/**
 * Get comune by exact name
 */
export async function getComuneByName(name: string): Promise<Comune | null> {
    const comuni = await loadComuni();
    const normalizedName = name.toLowerCase().trim();

    return comuni.find(c => c.nome.toLowerCase() === normalizedName) || null;
}

/**
 * Get CAP for a comune (returns first CAP if multiple)
 */
export async function getCapByComune(name: string): Promise<string> {
    const comune = await getComuneByName(name);
    return comune?.cap[0] || '';
}

/**
 * Get provincia sigla for a comune
 */
export async function getProvinciaByComune(name: string): Promise<string> {
    const comune = await getComuneByName(name);
    return comune?.sigla || '';
}
