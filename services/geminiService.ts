import { GoogleGenAI } from "@google/genai";
import { tokenMonitor } from "./tokenMonitor";

let aiClient: GoogleGenAI | null = null;

export const initializeGemini = (apiKey: string) => {
  if (!apiKey) {
    console.warn("Gemini Service initialized without API Key");
    aiClient = null;
    return;
  }
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log("Gemini Service initialized successfully");
  } catch (e) {
    console.error("Failed to initialize Gemini Client:", e);
    aiClient = null;
  }
};

// Helper to strip ```json markdown blocks and fix common JSON errors
const cleanJson = (text: string) => {
    let clean = text.trim();
    // Handle markdown code blocks
    if (clean.startsWith('```json')) clean = clean.slice(7);
    else if (clean.startsWith('```')) clean = clean.slice(3);
    
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    
    // Remove comments (//)
    clean = clean.replace(/\/\/.*$/gm, '');
    
    return clean.trim();
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const suggestCategories = async (
  samplePluginNames: string[],
  currentCategories: string[]
): Promise<string[]> => {
  if (!aiClient) throw new Error("API Key not set");

  const modelId = "gemini-2.5-flash";
  const prompt = `
    Analyze this list of audio plugin filenames:
    ${JSON.stringify(samplePluginNames.slice(0, 50))}

    And the user's current categories:
    ${JSON.stringify(currentCategories)}

    Task: Create a refined, comprehensive list of categories for organizing these plugins. 
    1. Keep valid existing categories.
    2. Add new categories if the plugins suggest a need (e.g., if you see many 'EQ' plugins, add 'Equalizer').
    3. Return a JSON object with a "categories" property containing the array of strings.
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    // Track token usage
    const promptTokens = tokenMonitor.estimateTokens(prompt);
    const completionTokens = tokenMonitor.estimateTokens(response.text || "");
    tokenMonitor.recordUsage(promptTokens, completionTokens);
    
    const json = JSON.parse(cleanJson(response.text || "{}"));
    return json.categories || currentCategories;
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return currentCategories;
  }
};

export const categorizeBatch = async (
  pluginNames: string[],
  availableCategories: string[],
  allowMultiTag: boolean,
  useLocalFallback: boolean = true 
): Promise<Record<string, string[]>> => {
    
    if (!aiClient) {
        console.warn("No API Client available.");
        return {};
    }

    if (!availableCategories || availableCategories.length === 0) {
        return {};
    }

    const modelId = "gemini-2.5-flash";
    
    // Simplified prompt for better reliability
    const prompt = `
      You are an expert audio librarian.
      
      PLUGINS: ${JSON.stringify(pluginNames)}
      CATEGORIES: ${JSON.stringify(availableCategories)}
      
      INSTRUCTIONS:
      1. Identify the plugin type (e.g. "Pro-Q 3" -> EQ).
      2. Match it to the BEST category from the provided list.
      3. ${useLocalFallback ? 'If unsure, make your best guess.' : 'If completely unsure, return null.'}
      4. Return JSON: { "PluginName": ["PrimaryCategory"${allowMultiTag ? ', "SecondaryCategory", ...' : ''}] }
      5. Primary Category (Index 0) is mandatory${allowMultiTag ? '. You may assign multiple relevant categories.' : '. Only assign ONE category per plugin.'}.
    `;

    // Retry Logic for Rate Limiting
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await aiClient.models.generateContent({
              model: modelId,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
              }
            });
        
            // Track token usage
            const promptTokens = tokenMonitor.estimateTokens(prompt);
            const completionTokens = tokenMonitor.estimateTokens(response.text || "");
            tokenMonitor.recordUsage(promptTokens, completionTokens);
        
            const rawText = cleanJson(response.text || "{}");
            let result;
            try {
                result = JSON.parse(rawText);
            } catch (jsonErr) {
                console.warn("JSON Parse Error, Retrying...", jsonErr);
                throw new Error("Invalid JSON");
            }
            
            const validatedResult: Record<string, string[]> = {};
            
            pluginNames.forEach(name => {
                const rawCats = result[name];
                
                // If we got a valid array
                if (Array.isArray(rawCats) && rawCats.length > 0) {
                     // Filter against valid categories to be safe
                     const validCats = rawCats.filter(c => 
                        availableCategories.some(ac => ac.toLowerCase() === c.toLowerCase())
                     );
                     
                     // If fuzzy match worked
                     if (validCats.length > 0) {
                         // Map back to exact casing from availableCategories
                         const finalCats = validCats.map(vc => 
                            availableCategories.find(ac => ac.toLowerCase() === vc.toLowerCase()) || vc
                         );
                         validatedResult[name] = finalCats;
                         return;
                     }
                }
                
                // If we are here, AI failed or returned invalid category
                // We leave it undefined so the App knows it failed
            });

            return validatedResult;

        } catch (e: any) {
            console.warn(`Batch Analysis Attempt ${attempt + 1} Failed:`, e.message);
            
            // Check for Rate Limit (429)
            if (e.message?.includes('429') || e.status === 429) {
                const delay = Math.pow(2, attempt) * 2000 + 1000; 
                console.log(`Rate limit hit. Retrying in ${delay}ms...`);
                await wait(delay);
                attempt++;
                continue;
            }

            // If it's a JSON error, retry quickly
            if (e.message === "Invalid JSON") {
                await wait(1000);
                attempt++;
                continue;
            }

            // Other error? Break
            break;
        }
    }

    return {};
};