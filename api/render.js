import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Use POST" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const url = body?.url;
    if (!url) return res.status(400).json({ ok: false, error: "url required" });

    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
    await page.waitForTimeout(3000);

    const screenshot = await page.screenshot({ fullPage: true, type: "png" });
    await browser.close();

    res.status(200).json({
      ok: true,
      screenshot_base64: screenshot.toString("base64")
    });
  } catch (err) {
    console.error("Render error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
