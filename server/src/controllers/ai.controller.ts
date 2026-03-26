import { Request, Response } from "express";
import { triageMeetings } from "../main/meeting-arrange-ai.js";
import CalendarEventModel from "../models/calendar-model.js";

export const TriageMeetings = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const user = (req as any).user;
    const userId = user?.userId || user?.id || user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await CalendarEventModel.findOne({
      userId,
      date: today,
    });

    if (!record || !record.meetings || record.meetings.length === 0) {
      return res
        .status(200)
        .json({ message: "No meetings found in database for today." });
    }

    const formattedMeetings = record.meetings.map((m: any) => ({
      id: m.googleEventId,
      title: m.title,
      startTime: m.startTime,
      endTime: m.endTime,
    }));

    const userRole = req.body?.role || "";
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
