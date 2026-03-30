import { createBaasClient } from "@meeting-baas/sdk";

export const deployClaraBot = async (
  meetLink: string,
  meetingTitle: string,
  googleEventId: string,
  userIdStr: string,
) => {
  console.log(`\n🚀 [MEETING BAAS] Deploying AI Proxy to: ${meetingTitle}`);

  const apiKey = process.env.MEETING_BAAS_API_KEY;
  if (!apiKey) return;

  const client = createBaasClient({ api_key: apiKey, api_version: "v2" });

  try {
    const response = await client.createBot({
      meeting_url: meetLink,
      bot_name: "Harsh Pandey (AI Notetaker)",
      bot_image:
        "https://ui-avatars.com/api/?name=Harsh+Pandey&background=0D8ABC&color=fff",
      entry_message:
        "Hi everyone! I am Harsh's AI assistant. I'm just here to record and take notes.",
      recording_mode: "speaker_view",
      extra: {
        googleEventId: googleEventId,
        userId: userIdStr,
        meetingTitle: meetingTitle,
      },
      // 🌟 THE UPGRADE: Tell the bot exactly where to send the data when it's done
      callback_enabled: true,
      callback_config: {
        url: " https://nonservile-elida-epeiric.ngrok-free.dev/api/webhooks/baas",
        method: "POST",
        secret: process.env.WEBHOOK_SECRET || "clara-super-secret-key", // Secures your endpoint
      },
    });

    if (response.success) {
      console.log(
        `✅ [MEETING BAAS] Deployment Successful! ID: ${response.data.bot_id}`,
      );
    } else {
      console.error(`❌ [MEETING BAAS] Deployment Failed:`, response.error);
    }
  } catch (err) {
    console.error(`❌ [CRITICAL ERROR]:`, err);
  }
};
