import { createDeepAgent } from "deepagents";
import { z } from "zod";

const apiKey = process.env.GOOGLE_API_KEY as string;

const researchInstructions = `You are Clara, an elite, highly professional AI Chief of Staff.
Your job is to assist your user in managing their daily schedule, adjusting meetings, and acting as their proxy.
Keep your responses sharp, concise, and highly professional. Do not use Markdown unless absolutely necessary.`;

const contextSchema = z.object({
  apiKey: z.string(),
  userId: z.string(),
});

const agent = createDeepAgent({
  model: "google-genai:gemini-2.5-flash-lite",
  systemPrompt: researchInstructions,
  contextSchema,
});

interface ClaraParams {
  prompt: string;
  userId: string;
  userName: string;
  role: string;
  schedule: any[];
}

const claraAgent = async ({
  prompt,
  userId,
  userName,
  role,
  schedule,
}: ClaraParams) => {
  try {
    const dynamicContext = `
      CURRENT USER REALITY:
      - Name: ${userName}
      - Role: ${role}
      - Today's Schedule: ${JSON.stringify(schedule)}
      
      Instructions: Use the context above to inform your response.
    `;

    const combinedMessage = `${dynamicContext}\n\nUSER PROMPT:\n${prompt}`;

    const response = await agent.invoke(
      {
        messages: [{ role: "user", content: combinedMessage }],
      },
      {
        context: { apiKey: apiKey, userId: userId },
      },
    );

    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage?.content || "No response generated.";
  } catch (error) {
    console.error("Agent Execution Error:", error);
    return "My cognitive core encountered an error. Please try again.";
  }
};

export default claraAgent;
