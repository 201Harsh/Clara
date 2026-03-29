import vanillaPuppeteer from "puppeteer";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const puppeteer = addExtra(vanillaPuppeteer as any);
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
      userDataDir: "./clara-browser-profile", // Clara's permanent brain
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

    // Hydration pause
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // 1. Check Authentication State
    console.log(`👁️ [PUPPETEER] Checking authentication state...`);

    // Fast-fail in 3 seconds. If she's logged in, this input doesn't exist.
    const nameInput = await page
      .waitForSelector('input[type="text"]', {
        visible: true,
        timeout: 3000,
      })
      .catch(() => null);

    if (nameInput) {
      console.log(
        `⌨️ [PUPPETEER] Anonymous mode detected. Entering disguise name...`,
      );
      await nameInput.click();
      await nameInput.type("Clara (Proxy)", { delay: 100 });
    } else {
      console.log(
        `✅ [PUPPETEER] Authenticated profile detected. Skipping name entry.`,
      );
    }

    // 2. Kill Mic & Cam
    console.log(`🔇 [PUPPETEER] Killing Mic and Camera...`);
    await page.keyboard.down("Control");
    await page.keyboard.press("d");
    await page.keyboard.press("e");
    await page.keyboard.up("Control");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. The Knock
    console.log(`🚪 [PUPPETEER] Scanning DOM for Join button...`);

    await page
      .waitForFunction(
        `
      Array.from(document.querySelectorAll('button, span')).some(b => 
        b.textContent && (b.textContent.includes('Ask to join') || b.textContent.includes('Join now'))
      )
    `,
        { timeout: 15000 },
      )
      .catch(() => console.log("⚠️ [PUPPETEER] Join button wait skipped."));

    const joinButtons = await page.$$(
      "::-p-xpath(//button[contains(., 'Ask to join') or contains(., 'Join now')] | //span[contains(text(), 'Ask to join') or contains(text(), 'Join now')])",
    );

    if (joinButtons.length > 0) {
      await (joinButtons[0] as any).click();
      console.log(`✅ [PUPPETEER] Clara successfully knocked on the door!`);
    } else {
      console.log("❌ [PUPPETEER] Mission Failed. Could not find Join button.");
    }

    // DO NOT CLOSE THE BROWSER HERE. Let her stay in the meeting!
  } catch (error) {
    console.error(`❌ [PUPPETEER ERROR] Mission Crashed:`, error);
  }
};
