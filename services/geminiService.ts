
import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;
let dynamicApiKey: string | null = null;

/**
 * Sets a dynamic API key (e.g. from Admin Panel) to override the build-time key.
 * This allows hot-swapping keys without redeployment.
 */
export const setDynamicApiKey = (key: string) => {
    if (!key) return;
    dynamicApiKey = key;
    // Reset the instance so it gets recreated with the new key next time getAi is called
    ai = null; 
};

export const getAi = () => {
    if (!ai) {
        // Priority: 1. Dynamic Key (from Admin Panel/DB), 2. Environment Variable
        const apiKey = dynamicApiKey || process.env.API_KEY;
        
        if (!apiKey) {
            // As per guidelines, we should assume API_KEY is available. This is a safeguard.
            throw new Error("API_KEY environment variable not set and no dynamic key provided.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};
