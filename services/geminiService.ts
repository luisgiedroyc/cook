
import { GoogleGenAI } from "@google/genai";
import { FoodFact } from "../types";

export const getFactOfDay = async (): Promise<FoodFact> => {
  try {
    // Create a new GoogleGenAI instance right before making an API call to ensure fresh configuration
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Расскажи один интересный, короткий и необычный факт о еде. Начни сразу с факта. Верни только текст на русском языке.",
    });
    // Use .text property directly as per Gemini API guidelines
    const text = response.text || "Сыр пармезан может храниться годами!";
    return {
      id: Math.random().toString(36).substr(2, 9),
      text,
      date: new Date().toLocaleDateString()
    };
  } catch (error) {
    return {
      id: 'default',
      text: "Морковь изначально была фиолетовой!",
      date: new Date().toLocaleDateString()
    };
  }
};
