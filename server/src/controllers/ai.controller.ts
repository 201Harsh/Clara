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

    // Read directly from the database using the new Array-based schema
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the single document for today
    const record = await CalendarEventModel.findOne({
      userId,
      date: today,
    });

    // Check if the record exists and has meetings inside its array
    if (!record || !record.meetings || record.meetings.length === 0) {
      return res
        .status(200)
        .json({ message: "No meetings found in database for today." });
    }

    // Formatting for the AI (mapping over the embedded array!)
    const formattedMeetings = record.meetings.map((m: any) => ({
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
