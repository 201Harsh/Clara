import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function meetingAgent({ prompt }: { prompt: string }) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const responseText = response.text;
  console.log(responseText);
}

export default meetingAgent;
