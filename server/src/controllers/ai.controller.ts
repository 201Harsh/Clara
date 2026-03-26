import { Request, Response } from "express";
import { triageMeetings } from "../main/clara-ai.js";
import CalendarEventModel from "../models/calendar-model.js";

export const TriageMeetings = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    // Bypassing strict types to ensure we grab the ID correctly
    const user = (req as any).user;
    const userId = user?.userId || user?.id || user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Read directly from the database instead of Google!
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const dbMeetings = await CalendarEventModel.find({
      userId,
      startTime: { $gte: start, $lte: end },
    });

    if (!dbMeetings || dbMeetings.length === 0) {
      return res
        .status(200)
        .json({ message: "No meetings found in database for today." });
    }

    // Formatting for the AI
    const formattedMeetings = dbMeetings.map((m) => ({
      id: m.googleEventId,
      title: m.title,
      startTime: m.startTime,
      endTime: m.endTime,
    }));

    const userRole = req.body?.role || "Software Engineer";
    const aiResponse = await triageMeetings(formattedMeetings, userRole);

    return res.status(200).json({
      message: "Meetings successfully triaged",
      triage: aiResponse.triage || [],
    });
  } catch (error) {
    console.error("Clara Triage Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error while processing AI data" });
  }
};
