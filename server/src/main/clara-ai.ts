import { createDeepAgent } from "deepagents";
import { z } from "zod";

const researchInstructions = ` your are Clara a Personal AI Assistant which helps User to Adjust Meetings and Replace as a PA in a Meeting.
`;

const apiKey = process.env.GOOGLE_API_KEY as string;

const contextSchema = z.object({
  apiKey: z.string(),
});

const agent = createDeepAgent({
  model: "google-genai:gemini-2.5-flash-lite",
  systemPrompt: researchInstructions,
  contextSchema,
});

const claraAgent = async ({ prompt }: { prompt: string }) => {
  try {
    const response = await agent.invoke(
      {
        messages: [{ role: "user", content: prompt }],
      },
      { context: {apiKey: apiKey } },
    );
    console.log(response.messages);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export default claraAgent;
