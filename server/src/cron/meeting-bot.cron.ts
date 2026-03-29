import cron from "node-cron";
import CalendarEventModel from "../models/calendar-model.js";
import CronJobModel from "../models/cron-model.js";

export const startMeetingCronJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Look ahead 5 minutes (Pre-join window)
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      // Look back 15 minutes (In case she is late or the server restarted, she will still join)
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60000);

      // FIX 1: RIP OUT THE DATE QUERY.
      // Let Mongoose search the entire database for ANY meeting marked "bot" and "scheduled".
      // This completely bypasses the UTC/IST timezone bug.
      const dailyRecords = await CalendarEventModel.find({
        meetings: {
          $elemMatch: {
            decision: "bot",
            status: "scheduled",
          },
        },
      });

      // If nothing is pending, stop here and save server resources.
      if (!dailyRecords || dailyRecords.length === 0) {
        return;
      }

      for (const record of dailyRecords) {
        const userIdStr = record.userId.toString();

        for (const meeting of record.meetings) {
          if (
            meeting.decision === "bot" &&
            meeting.status === "scheduled" &&
            meeting.meetLink
          ) {
            const meetingStartTime = new Date(meeting.startTime);

            // FIX 2: WIDEN THE TIME WINDOW.
            // "Is the meeting starting in the next 5 mins, OR did it start in the last 15 mins?"
            if (
              meetingStartTime <= fiveMinutesFromNow &&
              meetingStartTime >= fifteenMinutesAgo
            ) {
              console.log(
                `\n[BOT INITIATION] Target: ${meeting.title} at ${meetingStartTime.toLocaleTimeString()}`,
              );

              // 1. Force update the Calendar array uniquely by Google Event ID
              const updateRes = await CalendarEventModel.updateOne(
                { "meetings.googleEventId": meeting.googleEventId },
                { $set: { "meetings.$.status": "infiltrated" } },
              );

              if (updateRes.modifiedCount > 0) {
                console.log(`[DB] Calendar status updated to 'infiltrated'.`);

                // 2. Create the standalone deployment log ONLY if calendar update succeeds
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
      }
    } catch (error) {
      console.error("[CRON ERROR] Failed to execute scan:", error);
    }
  });

  console.log("⚡ [System] Clara Heartbeat (Cron) initialized.");
};
