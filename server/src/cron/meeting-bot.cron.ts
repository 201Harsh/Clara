import cron from "node-cron";
import CalendarEventModel from "../models/calendar-model.js";

export const startMeetingCronJob = () => {
  cron.schedule("* * * * *", async () => {

    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyRecords = await CalendarEventModel.find({ date: today });

      for (const record of dailyRecords) {
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
              console.log(`Link: ${meeting.meetLink}`);
              console.log(`User ID: ${record.userId}`);
              console.log(
                `=================================================\n`,
              );


              await CalendarEventModel.updateOne(
                {
                  userId: record.userId,
                  date: today,
                  "meetings.googleEventId": meeting.googleEventId,
                },
                {
                  $set: { "meetings.$.status": "in-progress" },
                },
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("[CRON ERROR] Failed to execute meeting scan:", error);
    }
  });

  console.log(
    "⚡ [System] Clara Heartbeat (Cron) initialized and listening...",
  );
};
