
export async function extractPdfText(file: File): Promise<string> {
    if (!window.pdfjsLib) {
        throw new Error("PDF.js library is not loaded.");
    }
    const pdf = await window.pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
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
}
