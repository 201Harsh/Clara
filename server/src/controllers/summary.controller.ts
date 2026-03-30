import { Request, Response } from "express";
import MeetingRecordModel from "../models/meeting-record-model.js";
import claraAgent from "../main/clara-ai.js";
import UserModel from "../models/user-model.js";

export const generateMissionReport = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const googleEventId = req.params.googleEventId as string;
    if (!googleEventId)
      return res.status(400).json({ error: "Missing event ID." });

    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized access." });

    // 🌟 Pull the REAL data directly from your MongoDB
    const record = await MeetingRecordModel.findOne({ googleEventId, userId });

    if (!record || !record.transcriptData) {
      return res
        .status(404)
        .json({
          error: "Mission report not ready. Real transcript is missing.",
        });
    }

    console.log(
      `[AI SUMMARIZER] Formatting real transcript for: ${record.meetingTitle}`,
    );

    const rawTranscript = record.transcriptData;
    let formattedTranscript = "";

    if (Array.isArray(rawTranscript)) {
      formattedTranscript = rawTranscript
        .map(
          (segment: any) =>
            `${segment.speaker}: ${segment.words.map((w: any) => w.text).join(" ")}`,
        )
        .join("\n");
    } else {
      formattedTranscript = JSON.stringify(rawTranscript).substring(0, 10000);
    }

    const dbUser = await UserModel.findById(userId);
    const userName = dbUser?.name || "Boss";
    const role = dbUser?.role || "Unassigned";

    const prompt = `
      You are Clara, an elite AI Executive Assistant. 
      Analyze the following real meeting transcript for your boss, ${userName}.
      
      Provide a structured "Mission Report":
      1. Executive Summary (2-3 sentences max)
      2. Key Decisions Made
      3. Action Items (specifically note if any are assigned to ${userName})
      
      Transcript:
      """
      ${formattedTranscript.substring(0, 20000)} 
      """
    `;

    console.log(`[AI SUMMARIZER] Feeding Real Data to Clara AI...`);

    const summaryResponse = await claraAgent({
      prompt,
      userId,
      userName,
      role,
      schedule: [],
    });

    console.log(`✅ [AI SUMMARIZER] Report generated successfully.`);

    return res.status(200).json({ success: true, report: summaryResponse });
  } catch (error) {
    console.error("[SUMMARIZER ERROR]:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate mission report." });
  }
};
