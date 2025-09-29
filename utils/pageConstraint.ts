
export type PageConstraint = { type: 'none' | 'set'; pages?: number[] };

export function parsePageConstraint(query: string): PageConstraint {
  if (!query) return { type: 'none' };
  const q = query.toLowerCase().replace(/\s+/g, ' ').trim();

  // Quick gate: only act if user mentions page(s)
  if (!/\b(pages?|pp\.)\b|\bfrom page\b/.test(q)) return { type: 'none' };

  // Normalize punctuation: convert en dash to hyphen
  const norm = q.replace(/\u2013|\u2014/g, '-');

  // Collect tokens after any of these cues
  // e.g. "only page 4,5-7", "pages 3-4, 6", "pp. 10–12", "from page 4 to 6"
  const m = norm.match(/\b(?:only\s+)?(?:pages?|pp\.|from page)\s+([0-9,\-\s]+(?:\s+to\s+[0-9]+)?)/);
  const raw = m ? m[1] : '';

  // Also capture formats like "pages 4, 5, 6" anywhere in the string
  const extras = Array.from(norm.matchAll(/\b(\d+\s*(?:-\s*\d+)?)(?=(?:\s*,|\s|$))/g)).map(x => x[1]);

  // Merge & normalize
  const tokens = (raw ? raw.split(/,/) : []).concat(extras);
  const pages = new Set<number>();

  for (let t of tokens) {
    t = t.trim();
    if (!t) continue;

    // "from page 4 to 6" → "4-6"
    const toMatch = t.match(/^(\d+)\s*to\s*(\d+)$/);
    if (toMatch) {
      const a = parseInt(toMatch[1], 10), b = parseInt(toMatch[2], 10);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        const [start, end] = a <= b ? [a, b] : [b, a];
        for (let p = start; p <= end; p++) pages.add(p);
      }
      continue;
    }

    // Range "4-6"
    const range = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const a = parseInt(range[1], 10), b = parseInt(range[2], 10);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        const [start, end] = a <= b ? [a, b] : [b, a];
        for (let p = start; p <= end; p++) pages.add(p);
      }
      continue;
    }

    // Single "4"
    const single = t.match(/^(\d+)$/);
    if (single) {
      const p = parseInt(single[1], 10);
      if (Number.isFinite(p)) pages.add(p);
      continue;
    }
  }

  if (pages.size === 0) return { type: 'none' };
  return { type: 'set', pages: Array.from(pages).sort((a,b) => a - b) };
}

export const stripPageQuery = (query: string): string => {
    // This regex removes various page-related commands to isolate the user's actual topic query.
    return query.replace(/\b(on|from|in|only|pages?|pp\.)\s+[0-9,\-\s]+(to\s+[0-9]+)?/gi, '')
                .replace(/[.,]$/g, '') // remove trailing punctuation that might be left
                .trim();
};

export function isGenericPageSummary(query: string): boolean {
    const stripped = stripPageQuery(query.toLowerCase());
    if (stripped.trim().length <= 5) return true; // Catches empty, "is", "a", etc.
    const genericVerbs = /^(explain|summarize|overview|give me an explanation|what is on|what's on|describe|brief|in short|show me)/i;
    return genericVerbs.test(stripped.trim());
}
