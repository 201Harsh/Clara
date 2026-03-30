import { Request, Response } from "express";
import CalendarEventModel from "../models/calendar-model.js";
import MeetingRecordModel from "../models/meeting-record-model.js";
import { createBaasClient } from "@meeting-baas/sdk";

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
      console.warn("⚠️ [WEBHOOK] Unauthorized access. Secret mismatch.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = req.body;
    console.log(`\n🔔 [WEBHOOK] Received Event: ${payload.event}`);

    if (payload.event === "bot.completed") {
      const { bot_id, transcription, mp4, extra } = payload.data;

      console.log(`✅ [WEBHOOK] Bot ${bot_id} finished. Processing data...`);

      // 🌟 SAFETY NET: Ignore legacy test bots that don't have DB context
      if (!extra || !extra.userId || !extra.googleEventId) {
        console.warn(
          `⚠️ [WEBHOOK] Bot ${bot_id} is missing 'extra' metadata. Ignoring old test.`,
        );
        return res
          .status(200)
          .json({ success: true, message: "Ignored legacy bot" });
      }

      try {
        console.log("💾 Attempting to save MeetingRecord...");
        await MeetingRecordModel.create({
          userId: extra.userId,
          googleEventId: extra.googleEventId,
          botId: bot_id,
          meetingTitle: extra.meetingTitle,
          videoUrl: mp4,
          transcriptUrl: transcription,
        });
        console.log("💾 MeetingRecord saved successfully.");

        console.log("📅 Attempting to update CalendarEvent...");
        await CalendarEventModel.updateOne(
          {
            userId: extra.userId,
            "meetings.googleEventId": extra.googleEventId,
          },
          { $set: { "meetings.$.status": "completed" } },
        );
        console.log("📅 Calendar status updated to 'completed'.");

        console.log("🧹 Attempting to scrub cloud data...");
        await client.deleteBotData({ bot_id: bot_id });
        console.log("🧹 Cloud data scrubbed.");
      } catch (dbError) {
        console.error("❌ [DATABASE CRASH]:", dbError);
        return res.status(500).json({ error: "Database operation failed" });
      }
    }

    else if (payload.event === "bot.failed") {
      console.error(`❌ [WEBHOOK] Bot Failed:`, payload.data.error_message);

      if (payload.data.extra && payload.data.extra.userId) {
        await CalendarEventModel.updateOne(
          {
            userId: payload.data.extra.userId,
            "meetings.googleEventId": payload.data.extra.googleEventId,
          },
          { $set: { "meetings.$.status": "failed" } },
        );
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ [FATAL WEBHOOK ERROR]:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
