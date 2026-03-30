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
    // 1. Verify the Secret (Security check)
    const incomingSecret = req.headers["x-mb-secret"];
    const expectedSecret =
      process.env.WEBHOOK_SECRET || "clara-super-secret-key";

    if (incomingSecret !== expectedSecret) {
      console.warn("⚠️ [WEBHOOK] Unauthorized access attempt.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = req.body;
    console.log(`\n🔔 [WEBHOOK] Received Event: ${payload.event}`);

    // 2. Handle Bot Completion
    if (payload.event === "bot.completed") {
      const { bot_id, transcription, mp4, extra } = payload.data;

      console.log(`✅ [WEBHOOK] Bot ${bot_id} finished. Processing data...`);

      // 3. Save the Artifact URLs to the Database
      await MeetingRecordModel.create({
        userId: extra.userId,
        googleEventId: extra.googleEventId,
        botId: bot_id,
        meetingTitle: extra.meetingTitle,
        videoUrl: mp4,
        transcriptUrl: transcription,
      });

      // 4. Update Calendar Status to trigger the UI update!
      await CalendarEventModel.updateOne(
        { userId: extra.userId, "meetings.googleEventId": extra.googleEventId },
        { $set: { "meetings.$.status": "completed" } },
      );

      console.log(`[DB] Upgraded status to 'completed' for UI rendering.`);

      // 5. Delete data off their servers for privacy
      await client.deleteBotData({ bot_id: bot_id });
      console.log(`[CLEANUP] Scrubbed bot data from Meeting BaaS cloud.`);
    }

    // Handle failures gracefully
    else if (payload.event === "bot.failed") {
      console.error(`❌ [WEBHOOK] Bot Failed:`, payload.data.error_message);

      await CalendarEventModel.updateOne(
        {
          userId: payload.data.extra.userId,
          "meetings.googleEventId": payload.data.extra.googleEventId,
        },
        { $set: { "meetings.$.status": "failed" } },
      );
    }

    // Always return 200 OK quickly
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[WEBHOOK ERROR]:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
