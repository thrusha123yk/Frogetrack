import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Checks if the Gemini AI is correctly configured with a non-placeholder API key.
 */
export const isAIConfigured = () => {
  return API_KEY && API_KEY !== 'YOUR_GEMINI_API_KEY' && API_KEY.trim() !== '';
};

const genAI = new GoogleGenerativeAI(isAIConfigured() ? API_KEY : 'placeholder');

/**
 * Gets a configured Gemini model.
 */
export const getGeminiModel = (modelName = 'gemini-2.5-flash') => {
  if (!isAIConfigured()) {
    throw new Error('Gemini API Key is not configured correctly. Please check your .env.local file.');
  }
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  });
};

/**
 * Centralized function to analyze a spreadsheet sample using AI.
 */
export const analyzeSpreadsheet = async (sampleData, existingSessions = []) => {
  try {
    const model = getGeminiModel();
    const prompt = `
      You are an expert data engineer for "ForgeTrack", an attendance system.
      Analyze this spreadsheet sample and identify the attendance tracking structure.
      
      Spreadsheet Sample (Rows 0-14):
      ${sampleData}
      
      Existing Sessions in Database:
      ${JSON.stringify(existingSessions)}
      
      Today's Date: ${new Date().toISOString().split('T')[0]}
      Program Start Date: 2025-08-04
      
      LOCALE CONTEXT:
      - We are based in India. 
      - We primarily use the DD/MM/YYYY date format. 
      - If you see dates like 15/04/2026, it is April 15th, NOT October 4th.
      - ALWAYS prioritize DD/MM/YYYY or DD-MM-YYYY when parsing ambiguous dates.
      
      TASKS:
      1. Identify the USN/Student ID column (look for 4SF24..., CI, IS, etc).
      2. Identify Student Name column.
      3. Identify all "Session" columns. These are usually columns labeled "Attendance", "P/A", or dates.
      4. Reason about dates:
         - MULTI-ROW HEADERS: The sheet has "Day 1", "Day 2" in Row 1. Row 2 has "Attendance", "Knowledge", "Skill" columns under each Day.
         - For each "Day X", use the "Attendance" column index.
         - EXCEL SERIAL NUMBERS: If you see large numbers like 46238, these are Excel dates. 46238 is Aug 2026 (FUTURE).
         - IMPORTANT: Inferred dates MUST be between 2025-08-04 and Today's Date (${new Date().toISOString().split('T')[0]}). 
         - CRITICAL: If a session/column would fall in the future (after today), YOU MUST EXCLUDE IT from the "sessions" array. DO NOT include it at all.
         - Identify if any inferred date ALREADY exists in the database.
      
      Return ONLY a JSON object:
      {
        "mapping": { "usn_idx": number, "name_idx": number },
        "sessions": [
          { "col_idx": number, "date": "YYYY-MM-DD", "topic": "string", "is_duplicate": boolean, "existing_id": "uuid|null", "confidence": number }
        ],
        "gaps_found": ["string explanation of missing headers or dates"],
        "suggested_weekly_schedule": ["Monday", "Wednesday"]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw error;
  }
};
