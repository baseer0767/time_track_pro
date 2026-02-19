
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Utility to pause execution for a set duration
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generic retry wrapper with exponential backoff for Gemini API calls
 * Specifically targets 429 (Rate Limit) and 5xx (Server) errors
 */
async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.status || (error?.message?.includes('429') ? 429 : 0);
    const isRetryable = status === 429 || (status >= 500 && status < 600);
    
    if (retries > 0 && isRetryable) {
      console.warn(`Gemini API: Request failed with status ${status}. Retrying in ${delay}ms... (${retries} attempts left)`);
      await sleep(delay);
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Generates strategic insights based on the provided business context.
 * Implements local caching to prevent unnecessary quota usage.
 */
export const getStrategicInsights = async (context: string, forceRefresh = false) => {
  const cacheKey = `timetrack_insights_${btoa(context).substring(0, 32)}`;
  
  if (!forceRefresh) {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        sessionStorage.removeItem(cacheKey);
      }
    }
  }

  const fallback = [
    "Utilization appears healthy across core engineering teams.",
    "Consider accelerating compliance for pending high-value clients.",
    "Review unbilled WIP for projects older than 30 days."
  ];

  try {
    return await fetchWithRetry(async () => {
      // Re-initialize AI client on every call to pick up updated process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this business state and provide 3 concise, bulleted strategic insights to prevent revenue leakage or improve utilization. Context: ${context}`,
        config: {
          systemInstruction: "You are a world-class professional services financial analyst. Provide 3 specific, actionable insights as a JSON array of strings. Do not include any other text in the response.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      });
      
      const text = response.text;
      const parsed = JSON.parse(text || '[]');
      
      if (parsed.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
      }
      
      return parsed;
    });
  } catch (error: any) {
    console.error("Gemini Insight Error:", error);
    
    // If it's a quota error, we throw it specifically to let the UI handle it
    if (error?.message?.includes('429') || error?.status === 429) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    
    return fallback;
  }
};
