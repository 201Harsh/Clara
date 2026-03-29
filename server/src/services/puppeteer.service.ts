import vanillaPuppeteer from "puppeteer";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const puppeteer = addExtra(vanillaPuppeteer as any);
puppeteer.use(StealthPlugin());

// 🌟 UPGRADE: Human-like randomized delay generator
const humanDelay = (min: number, max: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min),
  );

export const launchClaraInfiltrator = async (
  meetLink: string,
  meetingTitle: string,
) => {
  console.log(`\n🤖 [PUPPETEER] Booting physical proxy for: ${meetingTitle}`);

  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      // 1. Point to your actual Chrome installation
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

      // 2. Point to the BASE user data folder (remove the \Profile 1 part from the end)
      // NOTE: Replace 'YourUsername' with your actual Windows folder name!
      // Also, remember to use double slashes \\ in Windows paths.
      userDataDir:
        "C:\\Users\\pande\\AppData\\Local\\Google\\Chrome\\User Data",

      args: [
        // 3. Tell it exactly which profile to load (Default, Profile 1, Profile 2, etc.)
        "--profile-directory=Profile 11",

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

    // Human hesitation: Wait 3 to 5 seconds for the page to fully load
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
      await humanDelay(500, 1500); // Hesitate before typing
      await nameInput.click();
      // Type with a random delay between keystrokes to mimic human fingers
      await nameInput.type("Clara (Proxy)", {
        delay: Math.floor(Math.random() * 100) + 50,
      });
    } else {
      console.log(
        `✅ [PUPPETEER] Authenticated profile detected. Skipping name entry.`,
      );
    }

    // 2. Kill Mic & Cam
    console.log(`🔇 [PUPPETEER] Killing Mic and Camera...`);
    await humanDelay(1000, 2000); // Hesitate before muting
    await page.keyboard.down("Control");
    await page.keyboard.press("d");
    await page.keyboard.press("e");
    await page.keyboard.up("Control");

    await humanDelay(1500, 2500); // Hesitate before looking for the Join button

    // 3. The Bulletproof Knock
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
      // 🌟 UPGRADE: The DOM Injection Click. Bypasses all "Not Clickable" overlays.
      await page.evaluate((btn: any) => btn.click(), joinButtons[0]);
      console.log(`✅ [PUPPETEER] Clara successfully knocked on the door!`);
    } else {
      console.log("❌ [PUPPETEER] Mission Failed. Could not find Join button.");
    }
  } catch (error) {
    console.error(`❌ [PUPPETEER ERROR] Mission Crashed:`, error);
  }
};
