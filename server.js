import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (_, res) => {
  res.json({ ok: true, message: "Server is running. Use POST /render" });
});

app.post("/render", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  console.log("🌐 Starting render for:", url);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: puppeteer.executablePath(), // путь берём напрямую
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ],
      defaultViewport: { width: 1280, height: 800 }
    });

    console.log("✅ Browser launched");

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });

    // ждём, пока страница полностью подгрузит динамику
    await page.waitForTimeout(10000);

    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    console.log("✅ Screenshot captured successfully");
    res.json({ ok: true, screenshot_base64: screenshot.toString("base64") });
  } catch (err) {
    console.error("❌ Render failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
