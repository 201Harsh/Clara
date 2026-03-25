import { Request, Response } from "express";
import CalendarEventModel from "../models/calendar-model.js";
import UserModel from "../models/user-model.js";
import { getTodaysMeetings } from "../services/calendar.service.js";
import { triageMeetings } from "../main/clara-ai.js";

// 1. Fetch from DB for the UI
export const GetDailyMeetings = async (req: Request, res: Response) => {
  try {
    // FIXED: Safely cast req.user inside the function
    const userPayload = req.user as { userId: string } | undefined;
    const userId = userPayload?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get start and end of today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const meetings = await CalendarEventModel.find({
      userId,
      startTime: { $gte: start, $lte: end },
    }).sort({ startTime: 1 });

    return res.status(200).json({ meetings });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch local meetings" });
  }
};

// 2. Force Sync with Google & Run AI Triage
export const SyncCalendar = async (req: Request, res: Response) => {
  try {
    const userPayload = req.user as { userId: string } | undefined;
    const userId = userPayload?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await UserModel.findById(userId);

    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      return res.status(400).json({ error: "Google Calendar not connected." });
    }

    const rawMeetings = await getTodaysMeetings(
      user.googleAccessToken,
      user.googleRefreshToken,
    );

    if (!rawMeetings || rawMeetings.length === 0) {
      return res.status(200).json({ message: "No meetings today." });
    }

    const userRole = req.body.role || "Professional";
    const decisions = await triageMeetings(rawMeetings, userRole);

    const bulkOps = rawMeetings.map((meeting: any) => {
      const triageData = decisions.find((d: any) => d.id === meeting.id) || {
        decision: "human",
        reason: "Fallback: Unclassified",
      };

      return {
        updateOne: {
          // FIXED: Explicitly cast userId to string so TS knows it is not undefined
          filter: { userId: userId as string, googleEventId: meeting.id },
          update: {
            $set: {
              title: meeting.title,
              startTime: meeting.startTime,
              endTime: meeting.endTime,
              meetLink: meeting.link,
              decision: triageData.decision,
              reason: triageData.reason,
            },
          },
          upsert: true,
        },
      };
    });

    // FIXED: Cast bulkOps to 'any' to bypass hyper-strict Mongoose schema typing
    await CalendarEventModel.bulkWrite(bulkOps as any);

    return res
      .status(200)
      .json({ message: "Calendar successfully synced and triaged." });
  } catch (error) {
    console.error("Sync Error:", error);
    return res.status(500).json({ error: "Failed to sync calendar" });
  }
};
