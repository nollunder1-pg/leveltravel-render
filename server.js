import express from "express";
import { launch } from "puppeteer";
import { executablePath } from "@puppeteer/browsers";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (_, res) => {
  res.json({ ok: true, message: "Server is running. Use POST /render" });
});

app.post("/render", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: "Missing URL" });

  console.log("Starting render for:", url);

  try {
    const browser = await launch({
      headless: true,
      executablePath: executablePath("chrome"),
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

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 180000 // 3 минуты
    });

    // Ждем прогрузки интерфейса и скриптов
    await page.waitForTimeout(10000);

    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    console.log("✅ Screenshot taken successfully");
    res.json({
      ok: true,
      screenshot_base64: screenshot.toString("base64")
    });
  } catch (err) {
    console.error("❌ Render error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
