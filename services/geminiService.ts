

import { GoogleGenAI, Type } from "@google/genai";
import type { Flashcard, WebSource } from '../types';
import { searchChunks, searchChunksWithCoverage } from "./searchDoc";
import { parsePageConstraint, isGenericPageSummary, stripPageQuery } from "../utils/pageConstraint";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeminiToolResponse {
    content: string;
    webSources?: WebSource[];
    pdfSource?: string | null;
    pageConstraint?: string | null;
}

type DocChunk = { text: string; pageStart: number; pageEnd: number };

const baseInstruction = `You are the SE-ZERT Learning Assistant, a friendly and helpful AI tutor for Systems Engineering. Your goal is to help students like Max learn and master SE concepts. Use a friendly, helpful, and academic tone.`;

const buildContext = (userPrompt: string, allDocChunks: DocChunk[]) => {
    const constraint = parsePageConstraint(userPrompt);
    let eligibleChunks = allDocChunks;
    let constraintText: string | null = null;

    if (constraint.type === 'set' && constraint.pages && constraint.pages.length > 0) {
        const pages = constraint.pages;
        constraintText = `page${pages.length > 1 ? 's' : ''} ${pages.join(', ')}`;

        const allowed = new Set(pages);
        
        // First pass: Filter chunks that overlap with the allowed pages.
        let candidateChunks = allDocChunks.filter(c => {
            for (let p = c.pageStart; p <= c.pageEnd; p++) {
                if (allowed.has(p)) return true;
            }
            return false;
        });

        // Fail-safe pass: If no chunks found, try a shifted range (+/- 1 page)
        if (candidateChunks.length === 0) {
            const shifted = new Set(Array.from(allowed).flatMap(p => [p - 1, p, p + 1]).filter(n => n >= 1));
            candidateChunks = allDocChunks.filter(c => {
                for (let p = c.pageStart; p <= c.pageEnd; p++) {
                    if (shifted.has(p)) return true;
                }
                return false;
            });
        }
        
        eligibleChunks = candidateChunks;

        if (eligibleChunks.length === 0) {
            return { error: `I couldn't find content on the requested page(s): ${pages.join(', ')}. Please check the numbers or try another range.` };
        }
    }

    const cleanQuery = constraint.type === 'set' ? stripPageQuery(userPrompt) : userPrompt;

    return { eligibleChunks, constraintText, cleanQuery, constraint };
};


const getNotFoundResponse = (hasDoc: boolean, topic: string) => {
    return hasDoc 
        ? `I couldn't find information about "${topic}" in the uploaded PDF. Please try another topic or a more specific query.`
        : `I couldn't find information about "${topic}" in the SE-ZERT material. Please try another topic.`;
}

export const getSearchResponse = async (
    message: string, 
    docChunks: DocChunk[] | null,
    images?: { mimeType: string; data: string }[]
): Promise<GeminiToolResponse> => {
    
    // CASE 1: No PDF, no images -> Use Web Grounding
    if (!docChunks && (!images || images.length === 0)) {
        const groundedPrompt = `Use Google-grounded retrieval and include attributions. Base your answer only on what you retrieved. Do NOT invent or guess sources. If no attributions are available, return the answer without sources.\n\nUser question: "${message}"`;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: groundedPrompt,
                config: {
                    tools: [{googleSearch: {}}],
                }
            });

            const content = response.text;
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            
            const webSources: WebSource[] = groundingChunks
                .map((chunk: any) => chunk.web)
                .filter((web: any) => web && web.uri && web.title)
                .map((web: any) => ({ title: web.title.trim(), url: web.uri }));

            const uniqueSources = Array.from(new Map(webSources.map(item => [item.url, item])).values());
            
            return { content, webSources: uniqueSources };
        } catch (error) {
             console.error("Gemini API error (Grounded Search):", error);
             return { content: "I'm sorry, I seem to be having trouble connecting to the web search. Please try again in a moment." };
        }
    }

    // CASE 2: PDF is present OR images are attached
    let finalPrompt = message;
    let pages: number[] = [];
    let constraintText: string | null = null;
    
    if (docChunks) {
        const contextResult = buildContext(message, docChunks);
        if (contextResult.error) {
            return { content: contextResult.error, pdfSource: "Uploaded PDF" };
        }
        
        const { eligibleChunks, constraintText: ctxConstraint, cleanQuery, constraint } = contextResult;
        constraintText = ctxConstraint;

        // Path A: Generic summary request for specific pages
        if (constraint?.type === 'set' && constraint.pages && isGenericPageSummary(message)) {
            const summaries: string[] = [];
            for (const pageNum of constraint.pages) {
                const chunksForPage = eligibleChunks.filter(c => c.pageStart === pageNum);

                if (chunksForPage.length === 0) {
                    summaries.push(`**Page ${pageNum} — No extractable text found.**`);
                    continue;
                }

                const pageText = chunksForPage.map(c => c.text).join('\n\n').slice(0, 8000);
                const summaryPrompt = `SYSTEM: Use ONLY the provided CONTEXT from page ${pageNum} of the user's PDF. Do not use external information.\nUSER: CONTEXT:\n${pageText}\n---\nTASK: Summarize page ${pageNum} succinctly for a student.`;

                try {
                    const pageResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: summaryPrompt });
                    summaries.push(`**Page ${pageNum} — Summary**\n${pageResponse.text}`);
                } catch (e) {
                    console.error(`Error summarizing page ${pageNum}:`, e);
                    summaries.push(`**Page ${pageNum} — Could not generate a summary for this page.**`);
                }
            }
            
            const content = summaries.join('\n\n');
            pages = constraint.pages;
            const pageStr = ` (Source: Page${pages.length > 1 ? 's' : ''} ${pages.join(', ')})`;

            return { content: content + pageStr, pdfSource: "Uploaded PDF", pageConstraint: constraintText };
        } 
        
        // Path B: Targeted RAG query
        let relevantChunks: DocChunk[];
        if (constraint?.type === 'set' && constraint.pages) {
            relevantChunks = searchChunksWithCoverage(cleanQuery, eligibleChunks, constraint.pages, 5);
        } else {
            relevantChunks = searchChunks(cleanQuery, eligibleChunks, 4);
        }

        if (relevantChunks.length === 0) {
            if(constraint?.type === 'set') {
                return { content: `I couldn't find information about your topic on ${constraintText}. Please try another topic or adjust the page filter.`, pdfSource: "Uploaded PDF", pageConstraint: constraintText };
            }
            return { content: getNotFoundResponse(true, cleanQuery || message), pdfSource: "Uploaded PDF" };
        }
        
        const contextHeader = "Please answer the user's request based *only* on the following context provided from their uploaded PDF document. Do not use any other knowledge.\n\n--- CONTEXT FROM UPLOADED PDF ---\n";
        const contextBody = relevantChunks.map(c => c.text).join("\n---\n");
        const contextString = `${contextHeader}${contextBody}\n--- END OF CONTEXT ---\n\n`;
        
        const guardrail = constraintText ? `Important: The user requested content ONLY from ${constraintText} of their document. Do not use or infer from any other pages. If the provided context is insufficient to answer, say you couldn’t find the answer on those specific pages.\n\n` : "";

        finalPrompt = `${guardrail}${contextString}User question: "${cleanQuery || message}"`;
        pages = Array.from(new Set(relevantChunks.map(c => c.pageStart))).sort((a, b) => a - b);
    }

    const userParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: finalPrompt }];
    if (images && images.length > 0) {
        images.forEach(img => {
            userParts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        });
    }

    const contents = [
        { role: "user" as const, parts: [{text: baseInstruction }] },
        { role: "model" as const, parts: [{text: "Understood. I am the SE-ZERT Learning Assistant."}] },
        { role: "user" as const, parts: userParts }
    ];

    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: contents,
            config: { thinkingConfig: { thinkingBudget: 0 } },
        });

        let content = response.text;
        if (docChunks && pages.length > 0) {
            const pageStr = ` (Source: Page${pages.length > 1 ? 's' : ''} ${pages.join(', ')})`;
            content += pageStr;
        }

        return { content, pdfSource: docChunks ? "Uploaded PDF" : null, pageConstraint: constraintText };
    } catch (error) {
        console.error("Gemini API error (Search):", error);

        if (images && images.length > 0) {
            console.log("Image-based search failed. Attempting fallback to text-only search.");
            try {
                const textOnlyContents = [
                    { role: "user" as const, parts: [{text: baseInstruction }] },
                    { role: "model" as const, parts: [{text: "Understood. I am the SE-ZERT Learning Assistant."}] },
                    { role: "user" as const, parts: [{ text: finalPrompt }] }
                ];
                const fallbackResponse = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash', 
                    contents: textOnlyContents,
                    config: { thinkingConfig: { thinkingBudget: 0 } },
                });
                
                let fallbackContent = fallbackResponse.text;
                if (docChunks && pages.length > 0) {
                    const pageStr = ` (Source: Page${pages.length > 1 ? 's' : ''} ${pages.join(', ')})`;
                    fallbackContent += pageStr;
                }

                const fallbackMessage = "I couldn’t analyze the image(s) you provided, but here’s an answer based on the text:\n\n";
                return { content: fallbackMessage + fallbackContent, pdfSource: docChunks ? "Uploaded PDF" : null, pageConstraint: constraintText };
            } catch (fallbackError) {
                console.error("Gemini API error (Fallback Search):", fallbackError);
            }
        }
        
        return { content: "I'm sorry, I seem to be having trouble connecting. Please try again in a moment." };
    }
};

export const generateFlashcards = async (topic: string, docChunks: DocChunk[] | null): Promise<Flashcard[]> => {
    try {
        let context = "";
        let cleanTopic = topic;
        
        if (docChunks) {
            const contextResult = buildContext(topic, docChunks);
             if (contextResult.error) {
                throw new Error(contextResult.error);
            }
            const { eligibleChunks, cleanQuery, constraint } = contextResult;
            cleanTopic = cleanQuery || topic;
            
            let relevantChunks: DocChunk[];
            if (constraint?.type === 'set' && constraint.pages) {
                relevantChunks = searchChunksWithCoverage(cleanTopic, eligibleChunks, constraint.pages, 5);
            } else {
                relevantChunks = searchChunks(cleanTopic, eligibleChunks, 5);
            }

            if (relevantChunks.length === 0) throw new Error(getNotFoundResponse(true, cleanTopic));
            
            context = "Context from PDF:\n" + relevantChunks.map(c => c.text).join('\n---\n');
        }

        const prompt = `${context}\nGenerate 3-5 flashcards for the topic "${cleanTopic}". Each flashcard must have a 'question' and an 'answer'.`;
        const response = await ai.models.generateContent({
           model: "gemini-2.5-flash",
           contents: prompt,
           config: {
             responseMimeType: "application/json",
             responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "The question for the front of the flashcard." },
                    answer: { type: Type.STRING, description: "The answer for the back of the flashcard." },
                  },
                  required: ["question", "answer"]
                },
              },
           },
        });
        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        if (!parsedResponse || parsedResponse.length === 0) throw new Error(getNotFoundResponse(!!docChunks, cleanTopic));
        return parsedResponse.map((card: any, index: number) => ({ ...card, id: `${topic}-${Date.now()}-${index}` }));
    } catch (error: any) {
        console.error("Gemini API error (Flashcards):", error);
        throw new Error(error.message || "Failed to generate flashcards. The topic might not be specific enough or isn't covered in the material.");
    }
};

export const generateSummary = async (topic: string, docChunks: DocChunk[] | null): Promise<GeminiToolResponse> => {
    try {
        if (docChunks) {
            const contextResult = buildContext(topic, docChunks);
            if (contextResult.error) {
                return { content: contextResult.error, pdfSource: "Uploaded PDF" };
            }
            
            const { eligibleChunks, constraintText, cleanQuery, constraint } = contextResult;
            let pages: number[];

            // Path A: Generic summary request for specific pages
            if (constraint?.type === 'set' && constraint.pages && isGenericPageSummary(topic)) {
                const summaries: string[] = [];
                for (const pageNum of constraint.pages) {
                    const chunksForPage = eligibleChunks.filter(c => c.pageStart === pageNum);

                    if (chunksForPage.length === 0) {
                        summaries.push(`**Page ${pageNum} — No extractable text found.**`);
                        continue;
                    }

                    const pageText = chunksForPage.map(c => c.text).join('\n\n').slice(0, 8000);
                    const summaryPrompt = `SYSTEM: Use ONLY the provided CONTEXT from page ${pageNum} of the user's PDF. Do not use external information.\nUSER: CONTEXT:\n${pageText}\n---\nTASK: Summarize page ${pageNum} succinctly for a student in 3-5 bullet points or a short paragraph.`;

                    try {
                        const pageResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: summaryPrompt });
                        summaries.push(`**Page ${pageNum} — Summary**\n${pageResponse.text}`);
                    } catch (e) {
                        console.error(`Error summarizing page ${pageNum}:`, e);
                        summaries.push(`**Page ${pageNum} — Could not generate a summary for this page.**`);
                    }
                }
                
                const content = summaries.join('\n\n');
                pages = constraint.pages;
                const pageStr = ` (Source: Page${pages.length > 1 ? 's' : ''} ${pages.join(', ')})`;

                return { content: content + pageStr, pdfSource: "Uploaded PDF", pageConstraint: constraintText };
            }

            // Path B: Targeted RAG summary request
            let relevantChunks: DocChunk[];
            if (constraint?.type === 'set' && constraint.pages) {
                relevantChunks = searchChunksWithCoverage(cleanQuery, eligibleChunks, constraint.pages, 5);
            } else {
                relevantChunks = searchChunks(cleanQuery, eligibleChunks, 5);
            }
            
            if (relevantChunks.length === 0) {
                 if(constraint?.type === 'set') {
                     return { content: `I couldn't find information about your topic on ${constraintText}. Please try another topic or adjust the page filter.`, pdfSource: "Uploaded PDF", pageConstraint: constraintText };
                 }
                 return { content: getNotFoundResponse(true, cleanQuery || topic), pdfSource: "Uploaded PDF" };
            }

            const contextString = "Context from PDF:\n" + relevantChunks.map(c => c.text).join('\n---\n');
            const guardrail = constraintText ? `Important: The user requested content ONLY from ${constraintText} of their document. Do not use or infer from any other pages.\n\n` : "";
            
            const prompt = `${baseInstruction}\n${guardrail}${contextString}\nYour task is to generate a concise, academic summary of the following topic, using 3-5 bullet points or a short paragraph.\nTopic: ${cleanQuery || topic}`;
            pages = Array.from(new Set(relevantChunks.map(c => c.pageStart))).sort((a, b) => a - b);
            
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            
            let content = response.text;
            if (pages.length > 0) {
                const pageStr = ` (Source: Page${pages.length > 1 ? 's' : ''} ${pages.join(', ')})`;
                content += pageStr;
            }

            return { content, pdfSource: "Uploaded PDF", pageConstraint: constraintText };
        } else {
             const groundedPrompt = `Use Google-grounded retrieval and include attributions. Base your answer only on what you retrieved. Do NOT invent or guess sources. If no attributions are available, return the answer without sources.\n\nYour task is to generate a concise, academic summary of the following topic, using 3-5 bullet points or a short paragraph.\nTopic: "${topic}"`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: groundedPrompt,
                config: {
                    tools: [{googleSearch: {}}],
                }
            });

            const content = response.text;
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            
            const webSources: WebSource[] = groundingChunks
                .map((chunk: any) => chunk.web)
                .filter((web: any) => web && web.uri && web.title)
                .map((web: any) => ({ title: web.title.trim(), url: web.uri }));

            const uniqueSources = Array.from(new Map(webSources.map(item => [item.url, item])).values());
            
            return { content, webSources: uniqueSources };
        }
    } catch (error) {
        console.error("Gemini API error (Summary):", error);
        return { content: "I'm sorry, I was unable to generate a summary for that topic." };
    }
};

export const generatePodcast = async (topic: string, docChunks: DocChunk[] | null): Promise<string> => {
    try {
        let context = "";
        let cleanTopic = topic;

        if (docChunks) {
            const contextResult = buildContext(topic, docChunks);
            if (contextResult.error) {
                return contextResult.error;
            }
            const { eligibleChunks, cleanQuery, constraint } = contextResult;
            cleanTopic = cleanQuery || topic;
            
            let relevantChunks: DocChunk[];
            if (constraint?.type === 'set' && constraint.pages) {
                relevantChunks = searchChunksWithCoverage(cleanTopic, eligibleChunks, constraint.pages, 5);
            } else {
                relevantChunks = searchChunks(cleanTopic, eligibleChunks, 5);
            }

            if (relevantChunks.length === 0) return getNotFoundResponse(true, cleanTopic);
            
            context = "Context from PDF:\n" + relevantChunks.map(c => c.text).join('\n---\n');
        }

        const prompt = `${baseInstruction}
${context}
You are now in "Podcast It!" mode. Your task is to generate a short, podcast-style explanation of a chapter or topic for a student named Max.
Use a friendly, spoken tone — like a host narrating an audio lesson for someone listening on the go.
Your response MUST follow this structure:
1.  **Opening:** Start with a casual, friendly opening like "🎙️ Hey Max, welcome back to your SE-ZERT learning journey!"
2.  **Introduction:** Introduce the topic clearly, for example: "In today’s episode, we’re diving into ${cleanTopic}." Use phrases like "Let's explore..." or "You might be wondering...".
3.  **Explanation:** Explain the main points in simple, conversational language across 2-3 paragraphs.
4.  **Closer:** End with a motivational sign-off, such as "That’s it for today’s chapter — keep learning!"

**IMPORTANT RULES:**
-   DO NOT use bullet points or lists.
-   DO NOT sound robotic or overly formal. This is spoken learning, not a written summary.
-   Keep the entire response under 4 paragraphs.
-   Your response should start with the microphone emoji: 🎙️

Topic to explain: ${cleanTopic}`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API error (Podcast):", error);
        return "I'm sorry, I was unable to generate a podcast script for that topic.";
    }
};

export const getCertificate = async (isReady: boolean): Promise<string> => {
    const prompt = isReady
        ? `🎉 Congratulations, Max!\nYou’ve completed your SE-ZERT Learning Path. Here's your certificate of achievement:\n\n📜 Certificate of Completion\nThis certifies that Max has successfully completed all core modules of the SE-ZERT Systems Engineering learning program.\nDate: ${new Date().toLocaleDateString()}\n\nWould you like to save or share this on LinkedIn?`
        : "Keep going — you're almost there! Just finish the final topics to unlock your certificate.";
    // This is now a simple text generation, but could be a model call if more complex logic was needed
    return Promise.resolve(prompt);
};
