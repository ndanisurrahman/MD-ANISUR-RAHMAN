import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will use fallback questions.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export const geminiService = {
  async generateAssessment(category: string, position: string, department: string = 'General'): Promise<AssessmentQuestion[]> {
    const ai = getAI();
    
    if (!ai) {
      return Array(10).fill(null).map((_, i) => ({
        question: `Sample Question ${i + 1} for ${position} (Fallback) - নমুনা প্রশ্ন ${i + 1} (ফলব্যাক)`,
        options: ["Option A - অপশন এ", "Option B - অপশন বি", "Option C - অপশন সি", "Option D - অপশন ডি"],
        correctAnswer: "Option A - অপশন এ"
      }));
    }

    const prompt = `Generate 10 unique multiple-choice questions for a job applicant assessment.
    Category: ${category}
    Position: ${position}
    Department: ${department}
    
    IMPORTANT: Each question and every option MUST be bilingual. Write the English text first, followed by the Bengali translation (e.g., "What is your name? - আপনার নাম কি?").
    
    The questions should be distributed as follows:
    - 2 questions on HR and Compliance (specific to the garments industry in Bangladesh).
    - 2 questions on behavioral and workplace ethics.
    - 3 questions related to production or the specific department (${department}).
    - 3 questions related to the specific skills required for the position (${position}).
    
    Each question must have 4 options and exactly one correct answer.
    The correctAnswer MUST exactly match the bilingual string of one of the options.
    
    Return the response as a JSON array of objects with the following structure:
    {
      "question": "English Question - বাংলা প্রশ্ন",
      "options": ["English Option - বাংলা অপশন", ...],
      "correctAnswer": "English Option - বাংলা অপশন"
    }`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                correctAnswer: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      
      return JSON.parse(text);
    } catch (error) {
      console.error("Error generating assessment:", error);
      // Fallback questions in case of API failure
      return Array(10).fill(null).map((_, i) => ({
        question: `Sample Question ${i + 1} for ${position}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A"
      }));
    }
  }
};
