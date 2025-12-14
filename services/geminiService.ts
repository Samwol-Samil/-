import { GoogleGenAI, Type } from "@google/genai";
import { Character, SimulationResult } from "../types";

// Initialize the Gemini AI client
// The API key is guaranteed to be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDaySimulation = async (
  day: number,
  characters: Character[]
): Promise<SimulationResult> => {
  const model = "gemini-2.5-flash";

  // Optimization: Minimize context to reduce input tokens and processing time.
  const characterContext = characters.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    traits: c.traits, 
    status: c.status,
    catchphrase: c.catchphrase,
    isEmployed: c.isEmployed,
    relationships: c.relationships,
  }));

  // Highly optimized prompt for speed + Dialogue Requirement + Relationship Volatility
  const prompt = `Day ${day}. Chars: ${JSON.stringify(characterContext)}.
Rules:
1. Generate 3 logs total.
2. MANDATORY: One log MUST be a short dialogue between 2 RANDOMLY CHOSEN characters. Format: "Name A: '...'\nName B: '...'" (Use newline).
3. MANDATORY: Generate at least 4-6 relationship updates. Mix small random fluctuations (-5 to +5) and event-based changes. Relationships must change every day.
4. Logic: Marriage(>90 affinity & Dating), Fired(Lazy/Negative), Cheating(Partnered char flirts -> Breakup).
5. Style: Concise, dry. No emojis.
6. JSON ONLY.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192, // Increased to strictly prevent JSON cutoff
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            logs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['neutral', 'positive', 'negative', 'romantic', 'drama'] },
                },
                required: ['text', 'type']
              }
            },
            relationshipUpdates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceId: { type: Type.STRING },
                  targetId: { type: Type.STRING },
                  amount: { type: Type.INTEGER },
                },
                required: ['sourceId', 'targetId', 'amount']
              }
            },
            statusUpdates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterId: { type: Type.STRING },
                  newStatus: { type: Type.STRING },
                },
                required: ['characterId', 'newStatus']
              }
            },
            roleUpdates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterId: { type: Type.STRING },
                  newRole: { type: Type.STRING },
                  isEmployed: { type: Type.BOOLEAN },
                },
                required: ['characterId', 'newRole', 'isEmployed']
              }
            }
          },
          required: ['logs', 'relationshipUpdates', 'statusUpdates', 'roleUpdates']
        },
      },
    });

    if (response.text) {
      // Clean up potential markdown code fences if they exist (rare with json mode but possible)
      const cleanText = response.text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleanText) as SimulationResult;
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Simulation failed:", error);
    // Return a dummy result to prevent crash
    return {
      logs: [{ text: "데이터를 처리하는 도중 오류가 발생했습니다. (JSON Parsing Error)", type: "neutral" }],
      relationshipUpdates: [],
      statusUpdates: [],
      roleUpdates: [],
    };
  }
};