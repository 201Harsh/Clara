import { Request, Response } from "express";
import claraAgent from "../main/clara-ai.js";

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
