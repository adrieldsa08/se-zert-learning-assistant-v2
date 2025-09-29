import ReactDOMServer from 'react-dom/server';
import type { ProgressData } from '../types';
import type { ReactNode } from 'react';

// Helper function to wrap text
const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
};

// Helper function to load an SVG component as an image
const loadSvgImage = (svgComponent: ReactNode): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const svgString = ReactDOMServer.renderToStaticMarkup(svgComponent);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        image.src = url;
    });
};

export const generateCertificateImage = async (progress: ProgressData, logoComponent: ReactNode): Promise<string> => {
    await document.fonts.ready; // Ensure custom fonts are loaded

    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 800;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error("Could not get canvas context");
    }

    const logoImage = await loadSvgImage(logoComponent);

    // --- Colors & Fonts ---
    const bgColor = '#FDFBF5';
    const primaryColor = '#0A2342'; // Dark Navy Blue
    const accentColor = '#B48811'; // Gold
    const textColor = '#333333';
    
    // --- Draw Background ---
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // --- Draw Borders ---
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 15;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // --- Draw Title ---
    ctx.textAlign = 'center';
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 60px "Merriweather", serif';
    ctx.fillText('Certificate of Completion', width / 2, 140);
    
    // --- Sub-headers ---
    ctx.fillStyle = textColor;
    ctx.font = '30px "Lato", sans-serif';
    ctx.fillText('This is to certify that', width / 2, 220);

    // --- Recipient Name ---
    ctx.fillStyle = accentColor;
    ctx.font = 'italic bold 80px "Great Vibes", cursive';
    ctx.fillText("Max", width / 2, 320);

    // --- Accomplishment Text ---
    ctx.fillStyle = textColor;
    ctx.font = '24px "Lato", sans-serif';
    const accomplishmentText = 'has successfully demonstrated proficiency in the core principles of Systems Engineering through the SE-ZERT Learning Program.';
    wrapText(ctx, accomplishmentText, width / 2, 380, 800, 35);
    
    // --- Accomplishments Section ---
    const { flashcardDecksCreated, summariesAccessed, podcastSessions } = progress;
    const topicsReviewed = flashcardDecksCreated + summariesAccessed + podcastSessions;

    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 22px "Merriweather", serif';
    ctx.fillText('Key Accomplishments', width / 2, 480);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 100, 490);
    ctx.lineTo(width / 2 + 100, 490);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = '18px "Lato", sans-serif';
    ctx.fillText(`- ${topicsReviewed} Core Topics Reviewed -`, width / 2, 525);
    ctx.fillText(`- ${flashcardDecksCreated} Flashcard Decks Generated -`, width / 2, 555);
    ctx.fillText(`- ${summariesAccessed} Summaries and ${podcastSessions} Podcasts Accessed -`, width / 2, 585);


    // --- Draw Seal ---
    const sealX = 180;
    const sealY = 650;
    const sealRadius = 70;

    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.fillStyle = primaryColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw logo inside seal
    ctx.drawImage(logoImage, sealX - 35, sealY - 35, 70, 70);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 14px "Lato", sans-serif';
    ctx.fillText('SE-ZERT', sealX, sealY + sealRadius + 20);
    ctx.fillText('CERTIFIED', sealX, sealY + sealRadius + 40);

    // --- Signatures ---
    ctx.fillStyle = textColor;
    ctx.font = '20px "Lato", sans-serif';

    // Date
    ctx.textAlign = 'center';
    ctx.fillText(new Date().toLocaleDateString(), width / 4 + 100, 680);
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 4, 660);
    ctx.lineTo(width / 4 + 200, 660);
    ctx.stroke();
    ctx.fillText('Date', width / 4 + 100, 710);
    
    // Signature
    ctx.textAlign = 'center';
    ctx.fillText('AI Tutor', (width / 4) * 3 - 100, 680);
    ctx.beginPath();
    ctx.moveTo((width / 4) * 3 - 200, 660);
    ctx.lineTo((width / 4) * 3, 660);
    ctx.stroke();
    ctx.fillText('Tutor Signature', (width / 4) * 3 - 100, 710);

    return canvas.toDataURL('image/png');
};
