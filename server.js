import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Server is running. Use POST /render" });
});

app.post("/render", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ ok: false, error: "Missing URL" });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });
    await page.waitForTimeout(5000);

    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    res.json({
      ok: true,
      screenshot_base64: screenshot.toString("base64")
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
