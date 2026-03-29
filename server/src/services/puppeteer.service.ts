import vanillaPuppeteer from "puppeteer";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// FIX 1: Cast as 'any' to bypass the outdated TypeScript definitions in the wrapper
const puppeteer = addExtra(vanillaPuppeteer as any);

// Equip stealth camouflage
puppeteer.use(StealthPlugin());

export const launchClaraInfiltrator = async (
  meetLink: string,
  meetingTitle: string,
) => {
  console.log(`\n🤖 [PUPPETEER] Booting physical proxy for: ${meetingTitle}`);

  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-notifications",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
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

    // 2. The Ninja Move: Kill Mic & Cam
    console.log(`🔇 [PUPPETEER] Killing Mic and Camera...`);
    await page.keyboard.down("Control");
    await page.keyboard.press("d");
    await page.keyboard.press("e");
    await page.keyboard.up("Control");

    // Give the UI a second to register the keypresses
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. Knock on the door
    console.log(`🚪 [PUPPETEER] Clicking Join...`);

    // FIX 2: Use the modern Puppeteer XPath syntax since $x is deprecated
    const joinButtons = await page.$$(
      "::-p-xpath(//span[contains(text(), 'Ask to join') or contains(text(), 'Join now')])",
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
  } catch (error) {
    console.error(`❌ [PUPPETEER ERROR] Mission Failed:`, error);
  }
};
