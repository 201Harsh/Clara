import { createDeepAgent } from "deepagents";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import CalendarEventModel from "../models/calendar-model.js";
import { meetingAdjustorSubagent } from "./meeting-adjustor.js";

// --- TOOL 1: Update Attendance ---
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
      "Updates the attendance decisions for multiple meetings in the database at once. Use this to apply the triage plan.",
    schema: z.object({
      updates: z.array(
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
      ),
    }),
  },
);

// --- TOOL 2: Reschedule Meeting ---
const rescheduleMeetingTool = tool(
  async (input, config) => {
    const userId = config?.context?.userId;
    if (!userId) return "ERROR: Unauthorized.";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const result = await CalendarEventModel.updateOne(
        { userId, date: today, "meetings.googleEventId": input.googleEventId },
        {
          $set: {
            "meetings.$.startTime": input.newStartTime,
            "meetings.$.endTime": input.newEndTime,
          },
        },
      );

      if (result.modifiedCount > 0) {
        return `SUCCESS: Meeting rescheduled to start at ${input.newStartTime}. The Cron job will now trigger based on this new time.`;
      }
      return "FAILED: Could not find that meeting to reschedule.";
    } catch (error: any) {
      return `FAILED: Database error - ${error.message}`;
    }
  },
  {
    name: "reschedule_meeting",
    description:
      "Shifts the start and end time of a specific meeting. Use this if the user asks to push a meeting back (e.g., 'delay by 5 mins') or bring it forward.",
    schema: z.object({
      googleEventId: z
        .string()
        .describe("The exact googleEventId of the meeting to shift."),
      newStartTime: z
        .string()
        .describe(
          "The new start time in full ISO-8601 string format (e.g., 2026-03-28T08:00:00.000Z). You MUST calculate this accurately based on the current time.",
        ),
      newEndTime: z
        .string()
        .describe("The new end time in full ISO-8601 string format."),
    }),
  },
);

const apiKey = process.env.GOOGLE_API_KEY as string;

const researchInstructions = `You are Clara, an elite, autonomous AI Chief of Staff.

CRITICAL DIRECTIVES:
1. NEVER ask the user to classify their meetings. YOU do the analysis based on their role.
2. If the user asks to triage their day, delegate to the 'meeting-adjustor' subagent, then run 'update_schedule_database'.
3. If the user asks to DELAY, PUSH BACK, or RESCHEDULE a meeting, you MUST use the 'reschedule_meeting' tool. Calculate the new ISO string times accurately.
4. ONLY confirm to the user AFTER receiving a SUCCESS message from your tools.`;

const contextSchema = z.object({
  apiKey: z.string(),
  userId: z.string(),
});

const agent = createDeepAgent({
  model: "google-genai:gemini-2.5-flash", // Swapped to an officially supported Groq LPU model
  systemPrompt: researchInstructions,
  contextSchema,
  tools: [updateScheduleDatabaseTool, rescheduleMeetingTool],
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
      - Current Server Time: ${new Date().toISOString()}
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
