import { Request, Response } from "express";
import CalendarEventModel from "../models/calendar-model.js";
import UserModel from "../models/user-model.js";
import { getTodaysMeetings } from "../services/calendar.service.js";
import { triageMeetings } from "../main/clara-ai.js";

export const GetDailyMeetings = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const user = (req as any).user;
    const userId = user?.userId || user?.id || user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing User ID in token." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the single document for today
    const record = await CalendarEventModel.findOne({ userId, date: today });

    // If it exists, extract the array. If not, return empty array.
    const meetings = record ? record.meetings : [];

    return res.status(200).json({ meetings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const SyncCalendar = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const user = (req as any).user;
    const userId = user?.userId || user?.id || user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing User ID in token." });
    }

    const dbUser = await UserModel.findById(userId);
    console.log(dbUser?.googleAccessToken)

    if (!dbUser?.googleAccessToken) {
      return res.status(400).json({ error: "Google Calendar not connected." });
    }

    const rawMeetings = await getTodaysMeetings(
      dbUser.googleAccessToken,
      dbUser.googleRefreshToken || "",
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!rawMeetings || rawMeetings.length === 0) {
      // If no meetings, clear the array for today
      await CalendarEventModel.findOneAndUpdate(
        { userId, date: today },
        { $set: { meetings: [] } },
        { upsert: true },
      );
      return res.status(200).json({ message: "No meetings today." });
    }

    const userRole = req.body?.role || "Professional";

    let decisions: any[] = [];
    try {
      const aiResult = await triageMeetings(rawMeetings, userRole);
      if (Array.isArray(aiResult)) {
        decisions = aiResult;
      } else if (aiResult && Array.isArray(aiResult.triage)) {
        decisions = aiResult.triage;
      } else if (aiResult && Array.isArray(aiResult.meetings)) {
        decisions = aiResult.meetings;
      }
    } catch (aiError) {
      console.error("AI Triage Failed:", aiError);
    }

    // Build the array
    const meetingsArray = rawMeetings.map((meeting: any) => {
      const triageData = decisions.find((d: any) => d.id === meeting.id) || {
        decision: "human",
        reason: "Fallback: AI classification failed or was unclassified.",
      };

      return {
        googleEventId: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        meetLink: meeting.link,
        decision: triageData.decision,
        reason: triageData.reason,
        status: "scheduled",
      };
    });

    // Save the array into a single document
    await CalendarEventModel.findOneAndUpdate(
      { userId, date: today },
      { $set: { meetings: meetingsArray } },
      { upsert: true, new: true },
    );

    return res
      .status(200)
      .json({ message: "Calendar successfully synced and triaged." });
  } catch (error: any) {
    console.error("Sync Error:", error.message);
    return res.status(500).json({ error: "Failed to sync calendar" });
  }
};
