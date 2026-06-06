/**
 * Generación de PDF en PRODUCCIÓN (Cloudflare Browser Rendering / Puppeteer).
 * `env.BROWSER` es el binding. Requiere plan Workers Paid.
 *
 * (La versión local para pruebas vive en tests/pdf-local.mjs, fuera del
 *  bundle del worker, porque usa puppeteer-core que no corre en Cloudflare.)
 */

export const PDF_OPTS = {
  format: "A4",
  printBackground: true,
  margin: { top: "0.4in", bottom: "0.4in", left: "0.35in", right: "0.35in" },
};

export async function htmlToPdfCloudflare(html, env) {
  const puppeteer = (await import("@cloudflare/puppeteer")).default;
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf(PDF_OPTS);
  } finally {
    await browser.close();
  }
}
