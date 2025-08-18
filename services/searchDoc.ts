
export function searchChunks(query: string, chunks: string[], k = 4): string[] {
    if (!query || chunks.length === 0) {
        return [];
    }

    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (queryTerms.length === 0) {
        return [];
    }

    const scoredChunks = chunks.map((chunk, index) => {
        const chunkTextLower = chunk.toLowerCase();
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
