import CalendarEventModel from "../models/calendar-model.js";
import { getTodaysMeetings } from "./calendar.service.js";

const getMeetingsService = async ({
  User,
  userId,
}: {
  User: any;
  userId: string;
}) => {
  // 1. Fetch fresh raw meetings from Google Calendar
  const rawMeetings = await getTodaysMeetings(
    userId,
    User.googleAccessToken,
    User.googleRefreshToken || "",
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Fetch the EXISTING database record to see Clara's past decisions
  const existingRecord = await CalendarEventModel.findOne({
    userId,
    date: today,
  });
  const existingMeetings = existingRecord ? existingRecord.meetings : [];

  // 3. Map over Google data and MERGE it with the existing DB data
  const formattedMeetings = rawMeetings.map((meeting: any) => {
    // Check if Clara already triaged this specific meeting
    const savedMeeting = existingMeetings.find(
      (em: any) => em.googleEventId === meeting.id,
    );

    return {
      googleEventId: meeting.id,
      title: meeting.title,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      meetLink: meeting.link,
      // PRESERVE Clara's decision if it exists, otherwise default to human
      decision: savedMeeting ? savedMeeting.decision : "human",
      reason: savedMeeting
        ? savedMeeting.reason
        : "Default: Manual attendance.",
      status: savedMeeting ? savedMeeting.status : "scheduled",
    };
  });

  // 4. Update the DB with the merged data
  // FIXED THE MONGOOSE WARNING: Replaced `new: true` with `returnDocument: 'after'`
  await CalendarEventModel.findOneAndUpdate(
    { userId, date: today },
    { $set: { meetings: formattedMeetings } },
    { upsert: true, returnDocument: "after" },
  );

  return formattedMeetings;
};

export default getMeetingsService;
