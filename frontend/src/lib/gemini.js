import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'placeholder');

export const getGeminiModel = (modelName = 'gemini-2.0-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};
