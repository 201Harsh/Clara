import { Request, Response } from "express";
import CalendarEventModel from "../models/calendar-model.js";
import MeetingRecordModel from "../models/meeting-record-model.js";
import { createBaasClient } from "@meeting-baas/sdk";
import axios from "axios"; // 🌟 Make sure axios is imported
import mongoose from "mongoose";

const client = createBaasClient({
  api_key: process.env.MEETING_BAAS_API_KEY as string,
  api_version: "v2",
});

export const handleBaasCallback = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const incomingSecret = req.headers["x-mb-secret"];
    const expectedSecret =
      process.env.WEBHOOK_SECRET || "clara-super-secret-key";

    if (incomingSecret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = req.body;
    console.log(`\n🔔 [WEBHOOK] Received Event: ${payload.event}`);

    if (payload.event === "bot.completed") {
      const { bot_id, transcription, mp4, extra } = payload.data;

      if (!extra || !extra.userId || !extra.googleEventId) {
        return res
          .status(200)
          .json({ success: true, message: "Ignored legacy bot" });
      }

      try {
        console.log("📥 Downloading real transcript data from AWS S3...");
        // 🌟 GET THE REAL DATA IMMEDIATELY
        const s3Response = await axios.get(transcription);
        const realTranscriptText = s3Response.data;

        console.log("💾 Attempting to save Real Meeting Data to DB...");
        const savedRecord = await MeetingRecordModel.create({
          userId: extra.userId,
          googleEventId: extra.googleEventId,
          botId: bot_id,
          meetingTitle: extra.meetingTitle,
          videoUrl: mp4,
          transcriptData: realTranscriptText, // 🌟 Saved forever.
        });

        console.log(
          `🔍 [DEBUG] Data saved to DB: ${mongoose.connection.host} / ${mongoose.connection.name}`,
        );
        console.log(`🔍 [DEBUG] Saved Document ID: ${savedRecord._id}`);

        console.log("📅 Updating UI Status to 'Completed'...");
        await CalendarEventModel.updateOne(
          {
            userId: extra.userId,
            "meetings.googleEventId": extra.googleEventId,
          },
          { $set: { "meetings.$.status": "completed" } },
        );

        console.log("🧹 Scrubbing cloud data...");
        await client.deleteBotData({ bot_id: bot_id });
      } catch (dbError) {
        console.error("❌ [DATABASE CRASH]:", dbError);
        return res.status(500).json({ error: "Database operation failed" });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ [FATAL WEBHOOK ERROR]:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
