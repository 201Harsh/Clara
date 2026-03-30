import { createBaasClient } from "@meeting-baas/sdk";

export const deployClaraBot = async (
  meetLink: string,
  meetingTitle: string,
) => {
  console.log(`\n🚀 [MEETING BAAS] Deploying Clara to: ${meetingTitle}`);

  const apiKey = process.env.MEETING_BAAS_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ [MEETING BAAS] Missing API Key. Add MEETING_BAAS_API_KEY to your .env file.",
    );
    return;
  }

  // Initialize the modern v2 client
  const client = createBaasClient({
    api_key: apiKey,
    api_version: "v2",
  });

  try {
    // Send the bot to the meeting
    const { success, data, error, statusCode } = await client.createBot({
      bot_name: "Clara (AI Proxy)",
      meeting_url: meetLink,
      // You can add an entry message so she announces herself in the chat!
      entry_message:
        "Hi everyone! I am Clara, Harsh's AI assistant. I'm just here to take notes.",
    });

    if (success) {
      console.log(`✅ [MEETING BAAS] Deployment Successful!`);
      console.log(`🤖 [BOT ID]: ${data.bot_id}`);
      console.log(
        `Clara is currently flying to Google's servers and will join the room shortly.`,
      );
    } else {
      console.error(
        `❌ [MEETING BAAS ERROR] Deployment Failed (Status ${statusCode}):`,
        error,
      );
    }
  } catch (err) {
    console.error(`❌ [CRITICAL ERROR] Failed to reach Meeting BaaS API:`, err);
  }
};
