
<<<<<<< HEAD
export function searchChunks(query: string, chunks: string[], k = 4): string[] {
=======
export function searchChunks(query: string, chunks: { text: string, pageStart: number, pageEnd: number }[], k = 4): { text: string, pageStart: number, pageEnd: number }[] {
>>>>>>> 85593d0 (Initial commit - AI Studio export)
    if (!query || chunks.length === 0) {
        return [];
    }

    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (queryTerms.length === 0) {
        return [];
    }

    const scoredChunks = chunks.map((chunk, index) => {
<<<<<<< HEAD
        const chunkTextLower = chunk.toLowerCase();
=======
        const chunkTextLower = chunk.text.toLowerCase();
>>>>>>> 85593d0 (Initial commit - AI Studio export)
        let score = 0;
        queryTerms.forEach(term => {
            if (chunkTextLower.includes(term)) {
                score++;
            }
        });
        return { chunk, score, index };
    });

    // Filter out chunks with no score and sort by score, then by original position
    const sortedChunks = scoredChunks
        .filter(item => item.score > 0)
        .sort((a, b) => {
            if (b.score === a.score) {
                return a.index - b.index; // Prefer earlier chunks if scores are equal
            }
            return b.score - a.score;
        });

    return sortedChunks.slice(0, k).map(item => item.chunk);
}
<<<<<<< HEAD
=======

export function searchChunksWithCoverage(
    query: string,
    chunks: { text: string; pageStart: number; pageEnd: number }[],
    requiredPages: number[],
    k = 5
): { text: string; pageStart: number; pageEnd: number }[] {
    if (!query || chunks.length === 0) {
        return [];
    }

    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (queryTerms.length === 0) {
        return [];
    }
    
    const scoreChunk = (chunk: { text: string; pageStart: number; pageEnd: number }) => {
        const chunkTextLower = chunk.text.toLowerCase();
        let score = 0;
        queryTerms.forEach(term => {
            if (chunkTextLower.includes(term)) score++;
        });
        return score;
    };

    const coveredChunks = new Set<{ text: string; pageStart: number; pageEnd: number }>();

    // 1. Guarantee at least one chunk per requested page if it's relevant
    for (const pageNum of requiredPages) {
        const chunksForPage = chunks.filter(c => c.pageStart === pageNum || (c.pageStart <= pageNum && c.pageEnd >= pageNum));
        if (chunksForPage.length > 0) {
            const bestChunkForPage = chunksForPage
                .map(chunk => ({ chunk, score: scoreChunk(chunk) }))
                .sort((a, b) => b.score - a.score)[0];
            
            // Only add if it's relevant to the query topic
            if (bestChunkForPage && bestChunkForPage.score > 0) {
                coveredChunks.add(bestChunkForPage.chunk);
            }
        }
    }
    
    const results = Array.from(coveredChunks);
    if (results.length >= k) {
        return results.slice(0, k).sort((a, b) => a.pageStart - b.pageStart);
    }

    // 2. Fill remaining slots with globally best chunks that haven't been picked
    const remainingChunks = chunks.filter(c => !coveredChunks.has(c));
    const scoredRemaining = remainingChunks
        .map(chunk => ({ chunk, score: scoreChunk(chunk) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    const needed = k - results.length;
    if (needed > 0) {
        results.push(...scoredRemaining.slice(0, needed).map(item => item.chunk));
    }

    // 3. Sort final list by page number and return
    return results.sort((a, b) => a.pageStart - b.pageStart);
}
>>>>>>> 85593d0 (Initial commit - AI Studio export)
