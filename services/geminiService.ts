import { GoogleGenAI, Type } from "@google/genai";
import type { Flashcard } from './types';
import { searchChunks } from "./searchDoc";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const baseInstruction = `You are the SE-ZERT Learning Assistant, a friendly and helpful AI tutor for Systems Engineering. Your goal is to help students like Max learn and master SE concepts. Use a friendly, helpful, and academic tone.`;

const buildContext = (userPrompt: string, docChunks: string[]): string => {
    const relevantChunks = searchChunks(userPrompt, docChunks, 4);
    if (relevantChunks.length === 0) {
        return "";
    }
    const contextHeader = "Please answer the user's request based *only* on the following context provided from their uploaded PDF document. Do not use any other knowledge.\n\n--- CONTEXT FROM UPLOADED PDF ---\n";
    const contextBody = relevantChunks.join("\n---\n");
    return `${contextHeader}${contextBody}\n--- END OF CONTEXT ---\n\n`;
};

const getNotFoundResponse = (hasDoc: boolean) => {
    return hasDoc 
        ? "I couldn't find information about that in the uploaded PDF. Please try another topic or a more specific query."
        : "I couldn't find that in the SE-ZERT material. Please try another topic.";
}

export const getSearchResponse = async (
    message: string, 
    docChunks: string[] | null,
    images?: { mimeType: string; data: string }[]
): Promise<string> => {
    let finalPrompt = message;
    let context = "";

    if (docChunks) {
        context = buildContext(message, docChunks);
    }
    
    if (docChunks && !context && (!images || images.length === 0)) {
        return getNotFoundResponse(true);
    }

    if (context) {
        finalPrompt = `${context}User question: "${message}"`;
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
        return response.text;
    } catch (error) {
        console.error("Gemini API error (Search):", error);

        // If the call with images fails, attempt a fallback to text-only
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
                const fallbackMessage = "I couldn’t analyze the image(s) you provided, but here’s an answer based on the text:\n\n";
                return fallbackMessage + fallbackResponse.text;
            } catch (fallbackError) {
                console.error("Gemini API error (Fallback Search):", fallbackError);
            }
        }
        
        return "I'm sorry, I seem to be having trouble connecting. Please try again in a moment.";
    }
};

export const generateFlashcards = async (topic: string, docChunks: string[] | null): Promise<Flashcard[]> => {
    try {
        let context = "";
        if (docChunks) {
            context = buildContext(topic, docChunks);
            if (!context) throw new Error(getNotFoundResponse(true));
        }

        const prompt = `${context}Generate 3-5 flashcards for the topic "${topic}". Each flashcard must have a 'question' and an 'answer'.`;
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
        if (!parsedResponse || parsedResponse.length === 0) throw new Error(getNotFoundResponse(!!docChunks));
        return parsedResponse.map((card: any, index: number) => ({ ...card, id: `${topic}-${Date.now()}-${index}` }));
    } catch (error: any) {
        console.error("Gemini API error (Flashcards):", error);
        throw new Error(error.message || "Failed to generate flashcards. The topic might not be specific enough or isn't covered in the material.");
    }
};

export const generateSummary = async (topic: string, docChunks: string[] | null): Promise<string> => {
    try {
        let context = "";
        if (docChunks) {
            context = buildContext(topic, docChunks);
            if (!context) return getNotFoundResponse(true);
        }

        const prompt = `${baseInstruction}\n${context}\nYour task is to generate a concise, academic summary of the following topic, using 3-5 bullet points or a short paragraph.\nTopic: ${topic}`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API error (Summary):", error);
        return "I'm sorry, I was unable to generate a summary for that topic.";
    }
};

export const generatePodcast = async (topic: string, docChunks: string[] | null): Promise<string> => {
    try {
        let context = "";
        if (docChunks) {
            context = buildContext(topic, docChunks);
            if (!context) return getNotFoundResponse(true);
        }

        const prompt = `${baseInstruction}
${context}
You are now in "Podcast It!" mode. Your task is to generate a short, podcast-style explanation of a chapter or topic for a student named Max.
Use a friendly, spoken tone — like a host narrating an audio lesson for someone listening on the go.
Your response MUST follow this structure:
1.  **Opening:** Start with a casual, friendly opening like "🎙️ Hey Max, welcome back to your SE-ZERT learning journey!"
2.  **Introduction:** Introduce the topic clearly, for example: "In today’s episode, we’re diving into ${topic}." Use phrases like "Let's explore..." or "You might be wondering...".
3.  **Explanation:** Explain the main points in simple, conversational language across 2-3 paragraphs.
4.  **Closer:** End with a motivational sign-off, such as "That’s it for today’s chapter — keep learning!"

**IMPORTANT RULES:**
-   DO NOT use bullet points or lists.
-   DO NOT sound robotic or overly formal. This is spoken learning, not a written summary.
-   Keep the entire response under 4 paragraphs.
-   Your response should start with the microphone emoji: 🎙️

Topic to explain: ${topic}`;
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