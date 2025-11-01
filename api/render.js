import puppeteer from "puppeteer";

export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const url = body?.url;
    if (!url) return res.status(400).json({ ok: false, error: "url required" });

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote"
      ]
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
