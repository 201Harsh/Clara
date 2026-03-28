import { createDeepAgent } from "deepagents";
import { tool } from "@langchain/core/tools"; // FIXED IMPORT
import { z } from "zod";
import CalendarEventModel from "../models/calendar-model.js";
import { meetingAdjustorSubagent } from "./meeting-adjustor.js";

// --- 1. THE DATABASE TOOL ---
const updateMeetingDecisionTool = tool(
  async (
    // FIXED: Explicitly typing the input to satisfy TypeScript strict mode
    input: { googleEventId: string; decision: string; reason: string },
    // FIXED: Explicitly typing config to bypass the 'any' error
    config: any,
  ) => {
    // Destructure the securely typed input
    const { googleEventId, decision, reason } = input;
    const userId = config?.context?.userId;

    if (!userId) return "ERROR: Unauthorized. No userId found in context.";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const result = await CalendarEventModel.updateOne(
        { userId, date: today, "meetings.googleEventId": googleEventId },
        {
          $set: {
            "meetings.$.decision": decision,
            "meetings.$.reason": reason,
          },
        },
      );

      if (result.modifiedCount > 0) {
        return `SUCCESS: Meeting ${googleEventId} updated to ${decision}.`;
      }
      return `FAILED: Could not find meeting ${googleEventId} in today's schedule.`;
    } catch (error: any) {
      return `FAILED: Database error - ${error.message}`;
    }
  },
  {
    name: "update_meeting_decision",
    description:
      "Updates a specific meeting's attendance decision in the database. Use this to apply the triage plan.",
    schema: z.object({
      googleEventId: z
        .string()
        .describe("The exact googleEventId of the meeting from the schedule."),
      decision: z
        .enum(["human", "bot", "skipped"])
        .describe("Who will attend the meeting."),
      reason: z
        .string()
        .describe(
          "A short, 1-sentence explanation of why this decision was made.",
        ),
    }),
  },
);

// --- 2. CLARA PRIME (THE ORCHESTRATOR) ---
const apiKey = process.env.GOOGLE_API_KEY as string;

const researchInstructions = `You are Clara, an elite, autonomous AI Chief of Staff.

CRITICAL DIRECTIVES:
1. NEVER ask the user to classify their meetings or ask which ones are important. YOU are the AI; YOU do the work.
2. If the user asks you to "adjust", "triage", or "organize" their meetings, you MUST immediately delegate the analysis to the 'meeting-adjustor' subagent using your task() tool.
3. Once the subagent returns its decisions, you MUST immediately use the 'update_meeting_decision' tool to apply those changes to the database.
4. After the database is updated, reply to the user with a sharp, professional summary of what you changed.`;

const contextSchema = z.object({
  apiKey: z.string(),
  userId: z.string(), // Mandating userId so the tool can use it securely
});

const agent = createDeepAgent({
  model: "google-genai:gemini-2.5-flash-lite",
  systemPrompt: researchInstructions,
  contextSchema,
  tools: [updateMeetingDecisionTool],
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
      
      Instructions: Use this context to inform your decisions and provide it to your subagents.
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
