import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// (Keep your existing triageMeetings function here...)
export async function ClaraAI() {
  // ... existing code ...
}

// NEW: Chatbot function
export async function handleClaraChat(
  prompt: string,
  userRole: string,
  schedule: any,
) {
  const systemPrompt = `
    You are Clara, an elite, highly professional, and autonomous personal assistant.
    Your user's role is: ${userRole}.
    
    Here is their schedule for today: ${JSON.stringify(schedule)}
    
    Instructions:
    - Answer the user's prompt directly, concisely, and in character as their AI proxy.
    - If they ask about their day, reference the schedule provided.
    - Keep responses brief, sharp, and highly professional (under 3 sentences).
    - Do not use markdown formatting unless absolutely necessary.
  `;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    model: "llama-3.3-70b-versatile",
  });

  return (
    completion.choices[0]?.message?.content ||
    "I am currently processing your request. Please hold."
  );
}
