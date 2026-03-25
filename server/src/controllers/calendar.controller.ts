import { Request, Response } from "express";
import CalendarEventModel from "../models/calendar-model.js";
import UserModel from "../models/user-model.js";
import { getTodaysMeetings } from "../services/calendar.service.js";
import { triageMeetings } from "../main/clara-ai.js";

interface AuthRequest extends Request {
  user?: { userId: string };
}

// 1. Fetch from DB for the UI
export const GetDailyMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

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
export const SyncCalendar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await UserModel.findById(userId);

    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      return res.status(400).json({ error: "Google Calendar not connected." });
    }

    // Fetch raw schedule
    const rawMeetings = await getTodaysMeetings(
      user.googleAccessToken,
      user.googleRefreshToken,
    );

    if (!rawMeetings || rawMeetings.length === 0) {
      return res.status(200).json({ message: "No meetings today." });
    }

    // Run Llama 3.3 Triage
    const userRole = req.body.role || "Professional";
    const decisions = await triageMeetings(rawMeetings, userRole);

    // Upsert to Database (Creates new, updates existing)
    const bulkOps = rawMeetings.map((meeting: any) => {
      // Find the AI's decision for this specific meeting
      const triageData = decisions.find((d: any) => d.id === meeting.id) || {
        decision: "human",
        reason: "Fallback: Unclassified",
      };

      return {
        updateOne: {
          filter: { userId, googleEventId: meeting.id },
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
          upsert: true, // Creates the document if it doesn't exist!
        },
      };
    });

    await CalendarEventModel.bulkWrite(bulkOps);

    return res
      .status(200)
      .json({ message: "Calendar successfully synced and triaged." });
  } catch (error) {
    console.error("Sync Error:", error);
    return res.status(500).json({ error: "Failed to sync calendar" });
  }
};
