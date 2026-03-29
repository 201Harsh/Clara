import schedule from "node-schedule";
import CalendarEventModel from "../models/calendar-model.js";
import CronJobModel from "../models/cron-model.js";

export const scheduleBotInfiltration = (userIdStr: string, meeting: any) => {
  const jobName = meeting.googleEventId;

  if (schedule.scheduledJobs[jobName]) {
    schedule.scheduledJobs[jobName].cancel();
  }

  const meetingStartTime = new Date(meeting.startTime);
  const now = new Date();

  if (meetingStartTime <= now) return;

  schedule.scheduleJob(jobName, meetingStartTime, async () => {
    console.log(`\n=================================================`);
    console.log(`[BOT INITIATION] Target: ${meeting.title}`);
    console.log(`Time: ${new Date().toLocaleTimeString()}`);
    console.log(`=================================================\n`);

    try {
      await CalendarEventModel.updateOne(
        { "meetings.googleEventId": meeting.googleEventId },
        { $set: { "meetings.$.status": "infiltrated" } },
      );

      await CronJobModel.create({
        userId: userIdStr,
        googleEventId: meeting.googleEventId,
        meetingTitle: meeting.title,
        meetLink: meeting.meetLink,
        status: "triggered",
      });

      console.log(`[DB] Infiltration logged successfully.`);

    } catch (error) {
      console.error("[INFILTRATION ERROR] Database update failed:", error);
    }
  });

  console.log(
    `🕒 [SCHEDULER] Alarm set for '${meeting.title}' at ${meetingStartTime.toLocaleTimeString()}`,
  );
};

export const initializeAllScheduledBots = async () => {
  console.log("⚡ [System] Booting up Clara Scheduler...");
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyRecords = await CalendarEventModel.find({ date: today });

    let queuedCount = 0;

    for (const record of dailyRecords) {
      const userIdStr = record.userId.toString();

      for (const meeting of record.meetings) {
        if (
          meeting.decision === "bot" &&
          meeting.status === "scheduled" &&
          meeting.meetLink
        ) {
          scheduleBotInfiltration(userIdStr, meeting);
          queuedCount++;
        }
      }
    }
    console.log(
      `✅ [System] Successfully queued ${queuedCount} bot deployments for today.`,
    );
  } catch (error) {
    console.error("[SCHEDULER ERROR] Failed to initialize daily bots:", error);
  }
};
