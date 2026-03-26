import { Request, Response } from "express";
import CalendarEventModel from "../models/calendar-model.js";
import UserModel from "../models/user-model.js"; // Added to get User Details
import { triageMeetings, handleClaraChat } from "../main/clara-ai.js";

// Existing Triage Controller (Kept separate and untouched)
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

// UPDATED: Chatbot Controller with User Profile extraction
export const ClaraChatbotTriage = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { prompt, role } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const user = (req as any).user;
    const userId = user?.userId || user?.id || user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    // 1. Fetch User Details for conversational context
    const dbUser = await UserModel.findById(userId);
    const userDetails = {
      name: dbUser?.name || "Boss",
      email: dbUser?.email || "Unknown",
    };

    // 2. Fetch today's schedule from the database
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await CalendarEventModel.findOne({ userId, date: today });
    const scheduleContext = record ? record.meetings : [];

    // 3. Send prompt, role, schedule, AND user details to Groq
    const aiResponseText = await handleClaraChat(
      prompt,
      role || "Professional",
      scheduleContext,
      userDetails,
    );

    return res.status(200).json({
      message: aiResponseText,
    });
  } catch (error) {
    console.error("Clara Chat Error:", error);
    return res
      .status(500)
      .json({ error: "Clara's core is temporarily offline." });
  }
};
