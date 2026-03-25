import { Request, Response } from "express";
import clara from "../main/clara-ai.js";

export const ClaraAI = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Invalid prompt",
      });
    }

    const response = await clara({ prompt });

    return res.status(200).json({
      response,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
