import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { extractPdfText, chunkText } from '../services/pdf';
import type { DocContextType } from '../types';

export const DocContext = createContext<DocContextType | undefined>(undefined);

export const DocProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [fullText, setFullText] = useState<string | null>(null);
    const [chunks, setChunks] = useState<{ text: string, pageStart: number, pageEnd: number }[] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const setDoc = useCallback(async (file: File) => {
        setIsProcessing(true);
        try {
            const pages = await extractPdfText(file);
            const textChunks = chunkText(pages);
            const fullTextContent = pages.map(p => p.content).join('\n\n');
            setFileName(file.name);
            setFullText(fullTextContent);
            setChunks(textChunks);
        } catch (error) {
            console.error("Failed to process PDF:", error);
            // Optionally, set an error state to show in the UI
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const clearDoc = useCallback(() => {
        setFileName(null);
        setFullText(null);
        setChunks(null);
    }, []);

    const value = { fileName, fullText, chunks, isProcessing, setDoc, clearDoc };

    return <DocContext.Provider value={value}>{children}</DocContext.Provider>;
};
