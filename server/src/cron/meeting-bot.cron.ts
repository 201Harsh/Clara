import cron from "node-cron";
import CalendarEventModel from "../models/calendar-model.js";
import CronJobModel from "../models/cron-model.js";

export const startMeetingCronJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      // Look ahead 5 minutes
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyRecords = await CalendarEventModel.find({ date: today });

      for (const record of dailyRecords) {
        const userIdStr = record.userId.toString();

        for (const meeting of record.meetings) {
          // Look for meetings marked as 'bot' that haven't been infiltrated yet
          if (
            meeting.decision === "bot" &&
            meeting.status !== "infiltrated" &&
            meeting.meetLink
          ) {
            const meetingStartTime = new Date(meeting.startTime);

            if (
              meetingStartTime >= now &&
              meetingStartTime <= fiveMinutesFromNow
            ) {
              console.log(
                `\n[BOT INITIATION] Target: ${meeting.title} at ${meetingStartTime.toLocaleTimeString()}`,
              );

              // 1. Force update the Calendar array
              const updateRes = await CalendarEventModel.updateOne(
                {
                  _id: record._id,
                  "meetings.googleEventId": meeting.googleEventId,
                },
                { $set: { "meetings.$.status": "infiltrated" } },
              );

              if (updateRes.modifiedCount > 0) {
                console.log(`[DB] Calendar status updated to 'infiltrated'.`);
              }

              // 2. Create the standalone deployment log
              try {
                await CronJobModel.create({
                  userId: userIdStr,
                  googleEventId: meeting.googleEventId,
                  meetingTitle: meeting.title,
                  meetLink: meeting.meetLink,
                  status: "triggered",
                });
                console.log(`[DB] Cron Log created successfully.`);
              } catch (cronErr) {
                console.error(
                  "[DB ERROR] Failed to save CronJobModel:",
                  cronErr,
                );
              }

              // TODO: Puppeteer Launch goes here next!
            }
          }
        }
      }
    } catch (error) {
      console.error("[CRON ERROR] Failed to execute scan:", error);
    }
  });

  console.log("⚡ [System] Clara Heartbeat (Cron) initialized.");
};
