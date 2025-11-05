import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Server is running. Use POST /render" });
});

app.post("/render", async (req, res) => {
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  console.log("🌐 Starting render for:", url);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-gpu",
        "--no-zygote",
        "--disable-software-rasterizer",
        "--single-process"
      ],
      defaultViewport: { width: 1280, height: 800 }
    });

    console.log("✅ Browser launched successfully");

    const page = await browser.newPage();
    console.log("📄 New page created");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 180000
    });
    console.log("🌍 Page loaded");

    await page.waitForTimeout(4000);
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    console.log("✅ Screenshot captured and browser closed");

    res.json({
      ok: true,
      screenshot_base64: screenshot.toString("base64")
    });
  } catch (err) {
    console.error("❌ Render failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
