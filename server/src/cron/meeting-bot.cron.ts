import cron from "node-cron";
import CalendarEventModel from "../models/calendar-model.js";
import CronJobModel from "../models/cron-model.js";
import { broadcastToUser } from "../services/sse.service.js";

export const startMeetingCronJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyRecords = await CalendarEventModel.find({ date: today });

      for (const record of dailyRecords) {
        let scheduleUpdated = false;

        // FIX 2: Convert Mongoose ObjectId to a standard string for strict typing
        const userIdStr = record.userId.toString();

        for (const meeting of record.meetings) {
          if (
            meeting.decision === "bot" &&
            meeting.status === "scheduled" &&
            meeting.meetLink
          ) {
            const meetingStartTime = new Date(meeting.startTime);

            if (
              meetingStartTime >= now &&
              meetingStartTime <= fiveMinutesFromNow
            ) {
              console.log(`[BOT INITIATION] Target: ${meeting.title}`);

              // FIX 1: Match your schema's exact status string
              meeting.status = "infiltrated";
              scheduleUpdated = true;

              await CronJobModel.create({
                userId: userIdStr,
                googleEventId: meeting.googleEventId,
                meetingTitle: meeting.title,
                meetLink: meeting.meetLink,
                status: "triggered",
              });

              // FIX 2: Pass the stringified ID to the SSE broadcast
              broadcastToUser(userIdStr, "bot_deployed", {
                meetingTitle: meeting.title,
                meetLink: meeting.meetLink,
                status: "infiltrated",
                message: "Clara has initiated meeting infiltration.",
              });

              // TODO: Puppeteer Launch goes here next!
            }
          }
        }

        if (scheduleUpdated) {
          await record.save();
        }
      }
    } catch (error) {
      console.error("[CRON ERROR] Failed to execute scan:", error);
    }
  });

  console.log("⚡ [System] Clara Heartbeat (Cron) initialized.");
};
