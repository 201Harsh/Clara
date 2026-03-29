// Import vanilla puppeteer and the wrapper explicitly to fix TS errors
import vanillaPuppeteer from "puppeteer";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Manually wrap puppeteer so TypeScript understands the types perfectly
const puppeteer = addExtra(vanillaPuppeteer);

// Equip stealth camouflage to bypass Google Meet bot-detection
puppeteer.use(StealthPlugin());

export const launchClaraInfiltrator = async (
  meetLink: string,
  meetingTitle: string,
) => {
  console.log(`\n🤖 [PUPPETEER] Booting physical proxy for: ${meetingTitle}`);

  try {
    const browser = await puppeteer.launch({
      headless: false, // Keep false so you can watch her work on your screen
      defaultViewport: null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-notifications",
        "--use-fake-ui-for-media-stream", // Auto-accepts Mic/Camera prompts
        "--use-fake-device-for-media-stream", // Feeds a silent/black screen
      ],
    });

    const page = await browser.newPage();

    console.log(`🔗 [PUPPETEER] Navigating to ${meetLink}...`);
    await page.goto(meetLink, { waitUntil: "networkidle2" });

    // 1. Wait for the Guest Name Input Box
    console.log(`⌨️ [PUPPETEER] Entering disguise name...`);
    await page.waitForSelector('input[type="text"]', { timeout: 15000 });
    await page.type('input[type="text"]', "Clara (Harsh's Proxy)", {
      delay: 100,
    });

    // 2. The Ninja Move: Use keyboard shortcuts to kill Mic & Cam (Ctrl+D / Ctrl+E)
    console.log(`🔇 [PUPPETEER] Killing Mic and Camera...`);
    await page.keyboard.down("Control");
    await page.keyboard.press("d");
    await page.keyboard.press("e");
    await page.keyboard.up("Control");

    // Give the UI a second to register the keypresses
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. Knock on the door
    console.log(`🚪 [PUPPETEER] Clicking Join...`);

    // Using XPath because Google changes their CSS class names constantly
    const joinButtons = await page.$x(
      "//span[contains(text(), 'Ask to join') or contains(text(), 'Join now')]",
    );

    if (joinButtons.length > 0) {
      await (joinButtons[0] as any).click();
      console.log(`✅ [PUPPETEER] Clara has requested entry to the meeting!`);
    } else {
      console.log(
        "⚠️ [PUPPETEER] Could not find Join button. Using Enter key fallback.",
      );
      await page.keyboard.press("Enter");
    }

    // We leave the browser open so Clara stays in the meeting.
  } catch (error) {
    console.error(`❌ [PUPPETEER ERROR] Mission Failed:`, error);
  }
};
