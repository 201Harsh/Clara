import { Request, Response } from "express";
import claraAgent from "../main/clara-ai.js";
import UserModel from "../models/user-model.js";
import CalendarEventModel from "../models/calendar-model.js";

export const ClaraAgent = async (req: Request, res: Response): Promise<any> => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    const dbUser = await UserModel.findById(userId);
    const userName = dbUser?.name || "Boss";
    const role = dbUser?.role || "Unassigned";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await CalendarEventModel.findOne({ userId, date: today });
    const schedule = record ? record.meetings : [];

    const responseText = await claraAgent({
      prompt,
      userId,
      userName,
      role,
      schedule,
    });

    return res.status(200).json({
      response: responseText,
    });
  } catch (error) {
    console.error("Clara Chat Controller Error:", error);
    return res.status(500).json({
      error: "Internal server error: " + error,
    });
  }
};
