import cron from "node-cron";
import CalendarEventModel from "../models/calendar-model.js";
import CronJobModel from "../models/cron-model.js";

export const startMeetingCronJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyRecords = await CalendarEventModel.find({ date: today });

      for (const record of dailyRecords) {
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
              console.log(
                `\n=================================================`,
              );
              console.log(`[BOT INITIATION SEQUENCE STRUCK]`);
              console.log(`Target: ${meeting.title}`);
              console.log(`Time: ${meetingStartTime.toLocaleTimeString()}`);
              console.log(
                `=================================================\n`,
              );

              // 1. Force the database update explicitly (Bypasses Mongoose `.save()` bugs)
              await CalendarEventModel.updateOne(
                {
                  _id: record._id,
                  "meetings.googleEventId": meeting.googleEventId,
                },
                { $set: { "meetings.$.status": "infiltrated" } },
              );

              // 2. Create the Cron Deployment Log
              try {
                await CronJobModel.create({
                  userId: userIdStr,
                  googleEventId: meeting.googleEventId,
                  meetingTitle: meeting.title,
                  meetLink: meeting.meetLink,
                  status: "triggered",
                });
                console.log(`[DB] Cron Log created for: ${meeting.title}`);
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
