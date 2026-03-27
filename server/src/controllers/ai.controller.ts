import { Request, Response } from "express";
import { getTodaysMeetings } from "../services/calendar.service.js";
import { triageMeetings } from "../main/meeting-adjustor.js";
import UserModel from "../models/user-model.js";
import claraAgent from "../main/clara-ai.js";

export const TriageMeetings = async (req: Request, res: Response) => {
  try {
    const userPayload = req.user as { userId: string } | undefined;
    const userId = userPayload?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await UserModel.findById(userId);

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      return res.status(400).json({
        error:
          "Google Calendar not connected. Please authenticate with Google.",
      });
    }

    const meetings = await getTodaysMeetings(
      user.googleAccessToken,
      user.googleRefreshToken,
    );

    if (!meetings || meetings.length === 0) {
      return res.status(200).json({
        message: "No meetings scheduled for today. Clara is standing by.",
      });
    }

    const userRole = req.body.role || "Software Engineer";
    const decisions = await triageMeetings(meetings, userRole);

    return res.status(200).json({
      message: "Meetings successfully triaged",
      triage: decisions,
      rawSchedule: meetings,
    });
  } catch (error) {
    console.error("Clara Triage Error:", error);
    return res.status(500).json({
      error: "Internal server error while processing calendar data",
    });
  }
};

export const ClaraAgent = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    const response = await claraAgent({
      prompt,
    });
    return res.status(200).json({
      response,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error" + error,
    });
  }
};
