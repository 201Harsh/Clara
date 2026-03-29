import cron from "node-cron";
import CalendarEventModel from "../models/calendar-model.js";

export const startMeetingCronJob = () => {
  // This runs every single minute (* * * * *)
  cron.schedule("* * * * *", async () => {
    // console.log("[CRON] Pulse check: Scanning for upcoming Clara proxies...");

    try {
      const now = new Date();
      // Look ahead 5 minutes
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Grab all users' schedules for today
      const dailyRecords = await CalendarEventModel.find({ date: today });

      for (const record of dailyRecords) {
        for (const meeting of record.meetings) {
          // 2. Only look at meetings Clara is supposed to attend that haven't started yet
          if (
            meeting.decision === "bot" &&
            meeting.status === "scheduled" &&
            meeting.meetLink // Safety check: Make sure there's actually a link!
          ) {
            const meetingStartTime = new Date(meeting.startTime);

            // 3. Is the meeting starting in the next 0 to 5 minutes?
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

              // TODO: This is where we will call launchPuppeteerBot() in the next phase!

              // 4. Update the DB immediately so the next minute's cron doesn't trigger it again
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
