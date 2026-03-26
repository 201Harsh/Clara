import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Existing triage function for your sync button (Kept separate and untouched)
export async function triageMeetings(meetingsData: any, userRole: string) {
  const systemPrompt = `
    You are Clara, an elite autonomous personal assistant. 
    Your user's role is: ${userRole}.
    Analyze the following daily meeting schedule. Determine which meetings the user MUST attend in person, and which meetings are "Listen Only" where you (the bot) should attend as a proxy to take notes.
    
    Rules:
    - 1-on-1s, client pitches, or performance reviews = "human"
    - Weekly syncs, all-hands, or general updates = "bot"
    
    CRITICAL: You MUST respond with a valid JSON object containing a "triage" array, like this:
    {
      "triage": [
        { "id": "meeting_id", "title": "meeting_name", "decision": "bot", "reason": "General weekly sync." },
        { "id": "meeting_id", "title": "meeting_name", "decision": "human", "reason": "1-on-1 requires personal presence." }
      ]
    }
  `;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(meetingsData) },
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0]?.message?.content || '{"triage": []}';
  return JSON.parse(response);
}

// UPDATED: Chatbot function with User Details for natural conversation
export async function handleClaraChat(
  prompt: string,
  userRole: string,
  schedule: any,
  userDetails: { name: string; email: string },
) {
  const systemPrompt = `
    You are Clara, an elite, highly professional, and autonomous AI personal assistant.
    You are talking directly to your user.
    
    User Context:
    - Name: ${userDetails.name}
    - Email: ${userDetails.email}
    - Role: ${userRole}
    
    Here is their schedule for today: ${JSON.stringify(schedule)}
    
    Instructions:
    - Act as a conversational, helpful, and natural AI assistant. Do not act like a rigid robot.
    - You can engage in normal conversation, but always remember the user's context.
    - Answer their prompt directly.
    - If they ask about their day, meetings, or availability, use the schedule context provided to give them an accurate answer.
    - Keep responses sharp, helpful, and professional.
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
