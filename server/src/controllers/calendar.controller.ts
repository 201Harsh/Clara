import { Request, Response } from "express";
import CalendarEventModel from "../models/calendar-model.js";
import UserModel from "../models/user-model.js";
import { getTodaysMeetings } from "../services/calendar.service.js";
import { triageMeetings } from "../main/clara-ai.js";

export const GetDailyMeetings = async (req: Request, res: Response) => {
  try {
    // FIX: Extracting 'id' instead of 'userId' based on your JWT signature
    const userPayload = req.user as { id: string } | undefined;
    const userId = userPayload?.id;

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
  } catch (error) {
    console.error("Fetch Meetings Error:", error);
    return res.status(500).json({ error: "Failed to fetch local meetings" });
  }
};

export const SyncCalendar = async (req: Request, res: Response) => {
  try {
    // FIX: Extracting 'id' instead of 'userId' based on your JWT signature
    const userPayload = req.user as { id: string } | undefined;
    const userId = userPayload?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing User ID in token." });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found in database." });
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
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

    // Call the Llama 3.3 Triage Brain
    const decisions = await triageMeetings(rawMeetings, userRole);

    const bulkOps = rawMeetings.map((meeting: any) => {
      // Find the specific AI decision or fallback if Llama missed it
      const triageData = decisions.find((d: any) => d.id === meeting.id) || {
        decision: "human",
        reason: "Fallback: Unclassified",
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
    console.error("🔥 CRITICAL SYNC ERROR 🔥");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    if (error.response) {
      console.error("API Response Data:", error.response.data);
    }
    return res.status(500).json({ error: "Failed to sync calendar" });
  }
};
