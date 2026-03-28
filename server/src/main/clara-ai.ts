import { createDeepAgent } from "deepagents";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import CalendarEventModel from "../models/calendar-model.js";
import { meetingAdjustorSubagent } from "./meeting-adjustor.js";

const updateScheduleDatabaseTool = tool(
  async (input, config) => {
    const userId = config?.context?.userId;
    if (!userId) return "ERROR: Unauthorized. No userId found in context.";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      let modifiedCount = 0;

      for (const update of input.updates) {
        const result = await CalendarEventModel.updateOne(
          {
            userId,
            date: today,
            "meetings.googleEventId": update.googleEventId,
          },
          {
            $set: {
              "meetings.$.decision": update.decision,
              "meetings.$.reason": update.reason,
            },
          },
        );
        if (result.modifiedCount > 0) modifiedCount++;
      }

      return `SUCCESS: ${modifiedCount} meetings have been successfully updated in the database.`;
    } catch (error: any) {
      return `FAILED: Database error - ${error.message}`;
    }
  },
  {
    name: "update_schedule_database",
    description:
      "Updates the attendance decisions for multiple meetings in the database at once. You MUST use this tool to apply the triage plan.",
    schema: z.object({
      updates: z
        .array(
          z.object({
            googleEventId: z
              .string()
              .describe("The exact googleEventId of the meeting."),
            decision: z
              .enum(["human", "bot", "skipped"])
              .describe("Who will attend: 'human' or 'bot'."),
            reason: z
              .string()
              .describe("A short 1-sentence reason for this decision."),
          }),
        )
        .describe("An array of meeting updates to apply to the database."),
    }),
  },
);

const apiKey = process.env.GOOGLE_API_KEY as string;

const researchInstructions = `You are Clara, an elite, autonomous AI Chief of Staff.

CRITICAL DIRECTIVES:
1. NEVER ask the user to classify their meetings. YOU do the analysis based on their role.
2. If the user asks to "adjust", "triage", or "organize" their day, delegate the analysis to the 'meeting-adjustor' subagent. Do NOT do the triage analysis yourself in the description field.
3. ONCE THE SUBAGENT RETURNS THE PLAN, YOU MUST IMMEDIATELY CALL THE 'update_schedule_database' TOOL. Pass the array of changes to it.
4. DO NOT tell the user you updated their schedule until AFTER you have received the SUCCESS message from the 'update_schedule_database' tool.`;

const contextSchema = z.object({
  apiKey: z.string(),
  userId: z.string(),
});

const agent = createDeepAgent({
  model: "google-genai:gemini-2.5-flash-lite",
  systemPrompt: researchInstructions,
  contextSchema,
  tools: [updateScheduleDatabaseTool],
  subagents: [meetingAdjustorSubagent],
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
      
      Instructions: Use this context to inform your decisions.
    `;

    const combinedMessage = `${dynamicContext}\n\nUSER PROMPT:\n${prompt}`;

    const response = await agent.invoke(
      {
        messages: [{ role: "user", content: combinedMessage }],
      },
      {
        context: { apiKey, userId },
      },
    );

    console.log(response)

    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage?.content || "Task executed successfully.";
  } catch (error) {
    console.error("Agent Execution Error:", error);
    return "My cognitive core encountered an error. Please try again.";
  }
};

export default claraAgent;
