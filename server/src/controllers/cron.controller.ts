import { Request, Response } from "express";
import CronJobModel from "../models/cron-model.js";

export const getCronLogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized Access" });
      return;
    }

    const logs = await CronJobModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ logs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
