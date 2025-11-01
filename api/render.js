import chromium from "@sparticuz/chromium-min";
import playwright from "playwright-core";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Use POST" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const url = body.url;
    if (!url) {
      return res.status(400).json({ ok: false, error: "url is required" });
    }

    const pdf = !!body.pdf;
    const waitFor = body.waitFor || "networkidle";
    const viewport = body.viewport || { width: 1280, height: 2000 };

    const browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage({ viewport });
    await page.goto(url, { waitUntil: waitFor, timeout: 90000 });
    await page.waitForTimeout(4000);

    const screenshot = await page.screenshot({ fullPage: true, type: "png" });
    let pdfBuffer = null;
    if (pdf) {
      try {
        pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      } catch (e) {
        console.warn("PDF not supported in this environment");
      }
    }

    await browser.close();

    return res.status(200).json({
      ok: true,
      screenshot_base64: screenshot.toString("base64"),
      pdf_base64: pdfBuffer ? pdfBuffer.toString("base64") : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
