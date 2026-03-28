import { Request, Response } from "express";
import UserModel from "../models/user-model.js";
import getMeetingsService from "../services/get-meetings.service.js";

export const GetAllMeetings = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const User = await UserModel.findById(userId);

    if (!User) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!User.googleAccessToken) {
      return res.status(400).json({
        error:
          "Google Calendar not connected. Please authenticate with Google.",
      });
    }

    const meetings = await getMeetingsService({ User, userId });

    if (!meetings)
      return res.status(404).json({
        error: "No Meetings Found.",
      });

    return res.status(200).json({
      message: "Meetings fetched successfully.",
      meetings: meetings,
    });
  } catch (error: any) {
    console.error("GetAllMeetings Error:", error.message);

    // NEW: Catch specific Google OAuth expiration crashes
    if (
      error.message.includes("invalid authentication credentials") ||
      error.code === 401
    ) {
      return res.status(401).json({
        error: "Google session expired. Please reconnect your account.",
      });
    }

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};
