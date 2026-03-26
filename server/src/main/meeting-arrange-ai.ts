import Groq from "groq-sdk";

const groq = new Groq();

export async function triageMeetings(meetingsData: any, userRole: string) {
  const systemPrompt = `
    You are Clara, an elite autonomous personal assistant. 
    Your user's role is: ${userRole}.
    Exact time is ${new Date().toLocaleString()}
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
