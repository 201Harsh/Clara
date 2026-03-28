import { Request, Response } from "express";
import UserModel from "../models/user-model.js";

export const GetAllMeetings = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user;

    if (!userId)
      return res.status(401).json({
        error: "Unauthorized",
      });

    const User = await UserModel.findById(userId);

    if (!User) {
      return res.status(404).json({
        error: "User not found",
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: "Internal server error" + error,
    });
  }
};
