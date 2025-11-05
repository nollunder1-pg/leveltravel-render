import express from "express";
import { launch } from "puppeteer";
import { executablePath } from "@puppeteer/browsers";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Тестовый эндпоинт
app.get("/", (_, res) => {
  res.json({ ok: true, message: "Server is running. Use POST /render" });
});

// Основной рендер-эндпоинт
app.post("/render", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  try {
    console.log("Launching browser...");
    const browser = await launch({
      headless: true,
      executablePath: executablePath("chrome"), // указываем путь Chrome вручную
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
    console.log("Opening URL:", url);

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 180000
    });

    console.log("Taking screenshot...");
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    console.log("Render complete!");
    res.json({ ok: true, screenshot_base64: screenshot.toString("base64") });
  } catch (err) {
    console.error("Render error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Unknown rendering error"
    });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
