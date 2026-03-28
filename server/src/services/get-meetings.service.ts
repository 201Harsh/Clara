import CalendarEventModel from "../models/calendar-model.js";
import { getTodaysMeetings } from "./calendar.service.js";

const getMeetingsService = async ({
  User,
  userId,
}: {
  User: any;
  userId: string;
}) => {
  const rawMeetings = await getTodaysMeetings(
    userId,
    User.googleAccessToken,
    User.googleRefreshToken || "",
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingRecord = await CalendarEventModel.findOne({
    userId,
    date: today,
  });
  const existingMeetings = existingRecord ? existingRecord.meetings : [];

  const formattedMeetings = rawMeetings.map((meeting: any) => {
    const savedMeeting = existingMeetings.find(
      (em: any) => em.googleEventId === meeting.id,
    );

    return {
      googleEventId: meeting.id,
      title: meeting.title,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      meetLink: meeting.link,
      decision: savedMeeting ? savedMeeting.decision : "human",
      reason: savedMeeting
        ? savedMeeting.reason
        : "Default: Manual attendance.",
      status: savedMeeting ? savedMeeting.status : "scheduled",
    };
  });

  await CalendarEventModel.findOneAndUpdate(
    { userId, date: today },
    { $set: { meetings: formattedMeetings } },
    { upsert: true, returnDocument: "after" },
  );

  return formattedMeetings;
};

export default getMeetingsService;
