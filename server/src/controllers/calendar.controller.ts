import { Request, Response } from "express";
import UserModel from "../models/user-model.js";
import CalendarEventModel from "../models/calendar-model.js";
import { getTodaysMeetings } from "../services/calendar.service.js";

export const GetAllMeetings = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const User = await UserModel.findById(userId);

    if (!User) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!User.googleAccessToken) {
      return res.status(400).json({
        error:
          "Google Calendar not connected. Please authenticate with Google.",
      });
    }

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
      decision: "human", // Defaults to user attending
      reason: "Default: Manual attendance.",
      status: "scheduled",
    }));

    await CalendarEventModel.findOneAndUpdate(
      { userId, date: today },
      { $set: { meetings: formattedMeetings } },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      message: "Meetings fetched successfully.",
      meetings: formattedMeetings,
    });
  } catch (error: any) {
    console.error("GetAllMeetings Error:", error);
    return res.status(500).json({
      error: "Internal server error: " + error.message,
    });
  }
};
