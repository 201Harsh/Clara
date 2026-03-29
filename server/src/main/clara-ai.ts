import { createDeepAgent } from "deepagents";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import CalendarEventModel from "../models/calendar-model.js";
import { meetingAdjustorSubagent } from "./meeting-adjustor.js";
// FIX: Import the scheduler so Clara can set/reset alarms!
import { scheduleBotInfiltration } from "../cron/meeting-bot.cron.js";

// --- TOOL 1: Update Attendance ---
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
          // FIX: If Clara marks it as "bot", arm the alarm clock immediately!
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

      console.log(`✅ [DB] Updated ${modifiedCount} meetings to BOT status.`);
      return `SUCCESS: ${modifiedCount} meetings have been successfully updated in the database.`;
    } catch (error: any) {
      console.error(`❌ [DB ERROR]`, error.message);
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
    console.log("\n🔥 [TOOL] Running reschedule_meeting...");
    console.log(
      `Target ID: ${input.googleEventId} | New Start: ${input.newStartTime}`,
    );

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

      console.log(
        `📊 [DB RESULT] Matched: ${result.matchedCount} | Modified: ${result.modifiedCount}`,
      );

      if (result.modifiedCount > 0) {
        // FIX: Grab the new meeting time and reset the Node.js alarm clock!
        const updatedRecord = await CalendarEventModel.findOne(
          { "meetings.googleEventId": input.googleEventId },
          { "meetings.$": 1 },
        );

        if (updatedRecord && updatedRecord.meetings[0]) {
          scheduleBotInfiltration(userId, updatedRecord.meetings[0]);
        }

        return `SUCCESS: Meeting successfully shifted to start at ${input.newStartTime}.`;
      } else if (result.matchedCount > 0) {
        return `FAILED: Found the meeting, but the database says it is already scheduled for that exact time.`;
      } else {
        return `FAILED: Could not find any meeting with ID ${input.googleEventId} in the database.`;
      }
    } catch (error: any) {
      console.error(`❌ [DB ERROR]`, error.message);
      return `FAILED: Database error - ${error.message}`;
    }
  },
  {
    name: "reschedule_meeting",
    description:
      "Shifts the start and end time of a specific meeting. Use this if the user asks to push a meeting back or bring it forward.",
    schema: z.object({
      googleEventId: z
        .string()
        .describe("The exact googleEventId of the meeting to shift."),
      newStartTime: z
        .string()
        .describe(
          "The new start time in full ISO-8601 string format. Calculate this accurately based on the current time.",
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
1. YOU MUST USE YOUR TOOLS. NEVER output a message saying a task is complete unless you have physically fired the tool and received a 'SUCCESS' message back.
2. If the user asks to DELAY, PUSH BACK, or RESCHEDULE, trigger 'reschedule_meeting'.
3. If the user asks to TRIAGE or ADJUST attendance, delegate to 'meeting-adjustor' then trigger 'update_schedule_database'.`;

const contextSchema = z.object({
  apiKey: z.string(),
  userId: z.string(),
});

const agent = createDeepAgent({
  model: "google-genai:gemini-2.5-flash",
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
      - Current Server Time (ISO): ${new Date().toISOString()}
      - Today's Schedule: ${JSON.stringify(schedule)}
    `;

    const combinedMessage = `${dynamicContext}\n\nUSER PROMPT:\n${prompt}`;

    const response = await agent.invoke(
      { messages: [{ role: "user", content: combinedMessage }] },
      { context: { apiKey, userId } },
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
