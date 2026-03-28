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
    User.googleAccessToken,
    User.googleRefreshToken || "",
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formattedMeetings = rawMeetings.map((meeting: any) => ({
    googleEventId: meeting.id,
    title: meeting.title,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    meetLink: meeting.link,
    decision: "human",
    reason: "Default: Manual attendance.",
    status: "scheduled",
  }));

  await CalendarEventModel.findOneAndUpdate(
    { userId, date: today },
    { $set: { meetings: formattedMeetings } },
    { upsert: true, new: true },
  );

  return formattedMeetings;

};

export default getMeetingsService;
