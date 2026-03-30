import vanillaPuppeteer from "puppeteer";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import path from "path";

const puppeteer = addExtra(vanillaPuppeteer as any);
puppeteer.use(StealthPlugin());

const humanDelay = (min: number, max: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min),
  );

const claraBrainPath = path.join(process.cwd(), "clara-browser-data");

export const launchClaraInfiltrator = async (
  meetLink: string,
  meetingTitle: string,
) => {
  console.log(`\n🤖 [PUPPETEER] Booting physical proxy for: ${meetingTitle}`);

  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: claraBrainPath,
      ignoreDefaultArgs: ["--enable-automation"], 
      args: [
        "--disable-blink-features=AutomationControlled", 
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--window-size=1920,1080",
      ],
    });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://meet.google.com", [
      "camera",
      "microphone",
      "notifications",
    ]);

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    console.log(`🔗 [PUPPETEER] Navigating to ${meetLink}...`);
    await page.goto(meetLink, { waitUntil: "networkidle2" });

    await humanDelay(3000, 5000);

    console.log(`👁️ [PUPPETEER] Checking authentication state...`);

    const nameInput = await page
      .waitForSelector('input[type="text"]', {
        visible: true,
        timeout: 3000,
      })
      .catch(() => null);

    if (nameInput) {
      console.log(
        `⌨️ [PUPPETEER] Anonymous mode detected. Typing disguise name...`,
      );
      await humanDelay(500, 1500);
      await nameInput.click();
      await nameInput.type("Clara (Proxy)", {
        delay: Math.floor(Math.random() * 100) + 50,
      });
    } else {
      console.log(
        `✅ [PUPPETEER] Authenticated profile detected. Skipping name entry.`,
      );
    }

    console.log(`🔇 [PUPPETEER] Killing Mic and Camera...`);
    await humanDelay(1000, 2000);
    await page.keyboard.down("Control");
    await page.keyboard.press("d");
    await page.keyboard.press("e");
    await page.keyboard.up("Control");

    await humanDelay(1500, 2500);

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
      await page.evaluate((btn: any) => btn.click(), joinButtons[0]);
      console.log(`✅ [PUPPETEER] Clara successfully knocked on the door!`);
    } else {
      console.log("❌ [PUPPETEER] Mission Failed. Could not find Join button.");
    }
  } catch (error) {
    console.error(`❌ [PUPPETEER ERROR] Mission Crashed:`, error);
  }
};
