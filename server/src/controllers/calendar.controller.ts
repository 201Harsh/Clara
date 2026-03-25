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

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const meetings = await CalendarEventModel.find({
      userId,
      startTime: { $gte: start, $lte: end },
    }).sort({ startTime: 1 });

    return res.status(200).json({ meetings });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
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

    if (!dbUser?.googleAccessToken || !dbUser?.googleRefreshToken) {
      return res.status(400).json({ error: "Google Calendar not connected." });
    }

    const rawMeetings = await getTodaysMeetings(
      dbUser.googleAccessToken,
      dbUser.googleRefreshToken,
    );

    if (!rawMeetings || rawMeetings.length === 0) {
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
      } else {
        console.warn(
          "AI returned malformed data, falling back to empty array.",
          aiResult,
        );
      }
    } catch (aiError) {
      console.error("AI Triage Failed:", aiError);
    }

    const bulkOps = rawMeetings.map((meeting: any) => {
      const triageData = decisions.find((d: any) => d.id === meeting.id) || {
        decision: "human",
        reason: "Fallback: AI classification failed or was unclassified.",
      };

      return {
        updateOne: {
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

    await CalendarEventModel.bulkWrite(bulkOps as any);
    return res
      .status(200)
      .json({ message: "Calendar successfully synced and triaged." });
  } catch (error: any) {
    console.error("Sync Error:", error.message);
    return res.status(500).json({ error: "Failed to sync calendar" });
  }
};
