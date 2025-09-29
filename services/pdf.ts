
<<<<<<< HEAD
export async function extractPdfText(file: File): Promise<string> {
=======

export async function extractPdfText(file: File): Promise<{ pageNumber: number, content: string }[]> {
>>>>>>> 85593d0 (Initial commit - AI Studio export)
    if (!window.pdfjsLib) {
        throw new Error("PDF.js library is not loaded.");
    }
    const pdf = await window.pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    const numPages = pdf.numPages;
<<<<<<< HEAD
    let fullText = '';
=======
    const pages: { pageNumber: number, content: string }[] = [];
>>>>>>> 85593d0 (Initial commit - AI Studio export)

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
<<<<<<< HEAD
        fullText += pageText + '\n\n';
    }

    return fullText.trim();
}

export function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
    const chunks: string[] = [];
    if (!text) return chunks;

    let startIndex = 0;
    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length);
        chunks.push(text.slice(startIndex, endIndex).trim());
        startIndex += chunkSize - overlap;
        if (startIndex >= text.length) break;
    }

    return chunks.filter(chunk => chunk.length > 0);
=======
        pages.push({ pageNumber: i, content: pageText.trim() });
    }

    return pages;
}

export function chunkText(pages: { pageNumber: number, content: string }[], chunkSize = 1500, overlap = 200): { text: string, pageStart: number, pageEnd: number }[] {
    const chunks: { text: string, pageStart: number, pageEnd: number }[] = [];
    if (!pages || pages.length === 0) return chunks;

    for (const page of pages) {
        const text = page.content;
        if (!text || text.trim().length === 0) continue;

        let startIndex = 0;
        while (startIndex < text.length) {
            const endIndex = Math.min(startIndex + chunkSize, text.length);
            const chunkText = text.slice(startIndex, endIndex).trim();
            if (chunkText.length > 0) {
                chunks.push({ text: chunkText, pageStart: page.pageNumber, pageEnd: page.pageNumber });
            }
            
            startIndex += chunkSize - overlap;
            if (startIndex >= text.length) break;
        }
    }

    return chunks;
>>>>>>> 85593d0 (Initial commit - AI Studio export)
}
