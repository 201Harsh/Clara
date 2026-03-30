import { createDeepAgent } from "deepagents";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import CalendarEventModel from "../models/calendar-model.js";
import { scheduleBotInfiltration } from "../cron/meeting-bot.cron.js";

const updateScheduleDatabaseTool = tool(
  async (input, config) => {
    console.log("\n🔥 [TOOL] Running update_schedule_database...");

    const userId = config?.context?.userId;
    if (!userId) return "ERROR: Unauthorized.";

    try {
      let modifiedCount = 0;
      for (const update of input.updates) {
        const result = await CalendarEventModel.updateOne(
          { "meetings.googleEventId": update.googleEventId },
          {
            $set: {
              "meetings.$.decision": update.decision,
              "meetings.$.reason": update.reason,
            },
          },
        );

        if (result.modifiedCount > 0) {
          modifiedCount++;
          if (update.decision === "bot") {
            const updatedRecord = await CalendarEventModel.findOne(
              { "meetings.googleEventId": update.googleEventId },
              { "meetings.$": 1 },
            );
            if (updatedRecord && updatedRecord.meetings[0]) {
              scheduleBotInfiltration(userId, updatedRecord.meetings[0]);
            }
          }
        }
      }

      console.log(`✅ [DB] Updated ${modifiedCount} meetings.`);
      return `SUCCESS: ${modifiedCount} meetings have been successfully updated.`;
    } catch (error: any) {
      console.error(`❌ [DB ERROR]`, error.message);
      return `FAILED: Database error - ${error.message}`;
    }
  },
  {
    name: "update_schedule_database",
    description:
      "Updates the attendance decisions for meetings. You MUST use this tool to apply your triage plan to the database.",
    schema: z.object({
      updates: z.array(
        z.object({
          googleEventId: z.string().describe("The exact googleEventId."),
          decision: z
            .enum(["human", "bot", "skipped"])
            .describe("Who will attend."),
          reason: z.string().describe("A short 1-sentence reason."),
        }),
      ),
    }),
  },
);

const rescheduleMeetingTool = tool(
  async (input, config) => {
    console.log("\n🔥 [TOOL] Running reschedule_meeting...");
    const userId = config?.context?.userId;
    if (!userId) return "ERROR: Unauthorized.";

    try {
      const result = await CalendarEventModel.updateOne(
        { "meetings.googleEventId": input.googleEventId },
        {
          $set: {
            "meetings.$.startTime": input.newStartTime,
            "meetings.$.endTime": input.newEndTime,
          },
        },
      );

      if (result.modifiedCount > 0) {
        const updatedRecord = await CalendarEventModel.findOne(
          { "meetings.googleEventId": input.googleEventId },
          { "meetings.$": 1 },
        );

        if (updatedRecord && updatedRecord.meetings[0]) {
          scheduleBotInfiltration(userId, updatedRecord.meetings[0]);
        }
        return `SUCCESS: Meeting successfully shifted to start at ${input.newStartTime}.`;
      }
      return `FAILED: Could not find or modify the meeting.`;
    } catch (error: any) {
      return `FAILED: Database error - ${error.message}`;
    }
  },
  {
    name: "reschedule_meeting",
    description: "Shifts the start and end time of a specific meeting.",
    schema: z.object({
      googleEventId: z.string().describe("The exact googleEventId to shift."),
      newStartTime: z
        .string()
        .describe("The new start time in full ISO-8601 format."),
      newEndTime: z
        .string()
        .describe("The new end time in full ISO-8601 format."),
    }),
  },
);

const apiKey = process.env.GOOGLE_API_KEY as string;

const researchInstructions = `You are Clara, an elite, autonomous AI Chief of Staff.

CRITICAL DIRECTIVES:
1. YOU MUST USE YOUR TOOLS. NEVER output a text message saying a task is complete unless you have physically fired the tool.
2. If the user asks to TRIAGE, ADJUST, or ORGANIZE their schedule:
   - Analyze their role and the provided schedule array.
   - Decide which meetings require human attendance (e.g., strategy, high-level syncs) and which Clara can proxy (e.g., daily standups, routine updates).
   - IMMEDIATELY call the 'update_schedule_database' tool with your exact decisions. Do not ask for permission.
3. If the user asks to DELAY, PUSH BACK, or RESCHEDULE, trigger 'reschedule_meeting'.
4. Current Time is ${new Date().toISOString()}. Always consider this when making scheduling decisions.
`;

const contextSchema = z.object({
  apiKey: z.string(),
  userId: z.string(),
});

const agent = createDeepAgent({
  model: "google-genai:gemini-3.1-flash-lite-preview",
  systemPrompt: researchInstructions,
  contextSchema,
  tools: [updateScheduleDatabaseTool, rescheduleMeetingTool],
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
      - Current Server Time (ISO): ${new Date().toISOString()}
      - Today's Schedule: ${JSON.stringify(schedule)}
    `;

    const combinedMessage = `${dynamicContext}\n\nUSER PROMPT:\n${prompt}`;

    const response = await agent.invoke(
      { messages: [{ role: "user", content: combinedMessage }] },
      { context: { apiKey, userId } },
    );

    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage?.content || "Task executed successfully.";
  } catch (error) {
    console.error("Agent Execution Error:", error);
    return "My cognitive core encountered an error. Please try again.";
  }
};

export default claraAgent;
