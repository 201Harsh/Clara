import { Request, Response } from "express";
import MeetingRecordModel from "../models/meeting-record-model.js";
import axios from "axios";
import claraAgent from "../main/clara-ai.js";
import UserModel from "../models/user-model.js";

export const generateMissionReport = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { googleEventId } = req.params;

    // Extract user from AuthMiddleware
    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    // 1. Fetch the meeting record to get the S3 Transcript URL
    const record = await MeetingRecordModel.findOne({ googleEventId, userId });

    if (!record || !record.transcriptUrl) {
      return res
        .status(404)
        .json({
          error:
            "Mission report not ready. Transcript is missing or still processing.",
        });
    }

    console.log(
      `[AI SUMMARIZER] Downloading raw transcript for: ${record.meetingTitle}`,
    );

    // 2. Download the JSON file from the Meeting BaaS S3 bucket
    const s3Response = await axios.get(record.transcriptUrl);
    const rawTranscript = s3Response.data;

    // 3. Parse the transcript into a readable script
    // Meeting BaaS typically returns an array of spoken segments.
    // We map it so the LLM can easily read: "Speaker Name: What they said"
    let formattedTranscript = "";
    if (Array.isArray(rawTranscript)) {
      formattedTranscript = rawTranscript
        .map(
          (segment: any) =>
            `${segment.speaker}: ${segment.words.map((w: any) => w.text).join(" ")}`,
        )
        .join("\n");
    } else {
      // Fallback just in case the format is different
      formattedTranscript = JSON.stringify(rawTranscript).substring(0, 10000);
    }

    // 4. Construct the Prompt for Clara
    const dbUser = await UserModel.findById(userId);
    const userName = dbUser?.name || "Boss";
    const role = dbUser?.role || "Unassigned";

    const prompt = `
      You are Clara, an elite AI Executive Assistant. 
      Analyze the following meeting transcript for your boss, ${userName}.
      
      Please provide a structured "Mission Report" containing:
      1. Executive Summary (2-3 sentences max)
      2. Key Decisions Made
      3. Action Items (specifically note if any are assigned to ${userName})
      
      Transcript:
      """
      ${formattedTranscript.substring(0, 20000)} 
      """
    `; // Capping at 20k characters to prevent token limits

    console.log(`[AI SUMMARIZER] Feedings transcript to Clara AI...`);

    // 5. Generate the summary using your existing AI agent
    const summaryResponse = await claraAgent({
      prompt,
      userId,
      userName,
      role,
      schedule: [],
    });

    console.log(`✅ [AI SUMMARIZER] Report generated successfully.`);

    return res.status(200).json({
      success: true,
      report: summaryResponse,
    });
  } catch (error) {
    console.error("[SUMMARIZER ERROR]:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate mission report." });
  }
};
