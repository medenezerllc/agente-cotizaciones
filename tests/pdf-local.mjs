/**
 * Generación de PDF en LOCAL (solo para pruebas), usando puppeteer-core +
 * el Google Chrome instalado en la compu. No forma parte del worker.
 */
import { PDF_OPTS } from "../src/pdf.js";

export async function htmlToPdfLocal(html, chromePath) {
  const puppeteer = (await import("puppeteer-core")).default;
  const browser = await puppeteer.launch({
    executablePath:
      chromePath || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf(PDF_OPTS);
  } finally {
    await browser.close();
  }
}
