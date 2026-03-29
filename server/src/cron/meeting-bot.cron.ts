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

              // 1. Update Calendar Status
              meeting.status = "in-progress";
              scheduleUpdated = true;

              // 2. Create the Cron Deployment Log
              await CronJobModel.create({
                userId: record.userId,
                googleEventId: meeting.googleEventId,
                meetingTitle: meeting.title,
                meetLink: meeting.meetLink,
                status: "triggered",
              });

              // 3. Blast the real-time notification to the React Frontend
              broadcastToUser(record.userId, "bot_deployed", {
                meetingTitle: meeting.title,
                meetLink: meeting.meetLink,
                status: "in-progress",
                message: "Clara has initiated meeting infiltration.",
              });

              // TODO: Puppeteer Launch goes here next!
            }
          }
        }

        // Save the calendar if any meetings were updated to "in-progress"
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
