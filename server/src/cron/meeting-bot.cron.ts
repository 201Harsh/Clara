import schedule from "node-schedule";
import CalendarEventModel from "../models/calendar-model.js";
import CronJobModel from "../models/cron-model.js";
import { launchClaraInfiltrator } from "../services/puppeteer.service.js";

const executeInfiltration = async (userIdStr: string, meeting: any) => {
  console.log(`\n=================================================`);
  console.log(`[BOT INITIATION SEQUENCE STRUCK]`);
  console.log(`Target: ${meeting.title}`);
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

    if (meeting.meetLink) {
      await launchClaraInfiltrator(meeting.meetLink, meeting.title);
    }
  } catch (error) {
    console.error("[INFILTRATION ERROR] Sequence failed:", error);
  }
};

export const scheduleBotInfiltration = (userIdStr: string, meeting: any) => {
  const jobName = meeting.googleEventId;

  if (schedule.scheduledJobs[jobName]) {
    schedule.scheduledJobs[jobName].cancel();
  }

  const now = new Date();
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);

  // CASE 1: The meeting is already over. Ignore it.
  if (now >= endTime) {
    console.log(
      `[SCHEDULER] Skipped '${meeting.title}' - Meeting has already ended.`,
    );
    return;
  }

  // CASE 2: THE INSTANT JOIN (The Case Study)
  // The meeting has already started, but hasn't ended yet.
  if (now >= startTime && now < endTime) {
    console.log(
      `🚨 [SCHEDULER] '${meeting.title}' is currently active! Bypassing alarm and launching instantly.`,
    );
    executeInfiltration(userIdStr, meeting);
    return;
  }

  // CASE 3: STANDARD SCHEDULING
  // The meeting is in the future. Set the alarm clock.
  schedule.scheduleJob(jobName, startTime, async () => {
    await executeInfiltration(userIdStr, meeting);
  });

  console.log(
    `🕒 [SCHEDULER] Alarm set for '${meeting.title}' at ${startTime.toLocaleTimeString()}`,
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
      `✅ [System] Successfully processed ${queuedCount} bot directives for today.`,
    );
  } catch (error) {
    console.error("[SCHEDULER ERROR] Failed to initialize daily bots:", error);
  }
};
