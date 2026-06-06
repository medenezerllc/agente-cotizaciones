/**
 * Prueba end-to-end del Bloque 3: lead → IA → propuesta → DOS correos.
 *  - Versión dueño (con resumen interno)
 *  - Versión prospecto (sin resumen interno)
 *
 * Como Resend está en modo prueba, ambos se mandan al correo de tu cuenta
 * Resend para que puedas verlos. En producción (dominio verificado) la
 * versión del prospecto irá a su correo real.
 *
 * Uso: node tests/test-email.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generarContenidoPropuesta } from "../src/openai.js";
import { renderPropuestaHTML } from "../src/proposal.js";
import { enviarEmail, asuntoDueno, asuntoProspecto } from "../src/email.js";
import { htmlToPdfLocal } from "./pdf-local.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dv = await readFile(join(root, ".dev.vars"), "utf8");
const get = (k) => dv.match(new RegExp(`^${k}=(.+)$`, "m"))?.[1]?.trim();

const apiKey = get("OPENAI_API_KEY");
const resendKey = get("RESEND_API_KEY");
const cuentaResend = "medenezerllc@gmail.com"; // único destino válido en modo prueba
const from = "Electronic Payments <onboarding@resend.dev>";

const lead = {
  nombre: "Roberto Salinas",
  negocio: "Boutique Aurora",
  email: "roberto@boutiqueaurora.com",
  telefono: "(212) 555-0199",
  tipo: "Retail",
  ubicaciones: "1",
  terminales: "2",
  volumen: "Menos de $10k",
  pago_actual: "$450/mes",
  fee_actual: "no sé",
  fee_quien: "No sé",
  pos_actual: "no tengo",
  interes: ["Terminales de pago", "Tarjetas de regalo y lealtad"],
  prioridad: "Cero costo inicial y todo incluido",
  notas: "Apenas estoy empezando, quiero algo sencillo y sin pagar mucho de entrada.",
};

console.log("🧠 Generando propuesta...");
const content = await generarContenidoPropuesta({ lead, apiKey, model: "gpt-4o-mini" });

const htmlDueno = renderPropuestaHTML({ lead, content, interno: true });
const htmlProspecto = renderPropuestaHTML({ lead, content, interno: false });
const htmlPdf = renderPropuestaHTML({ lead, content, interno: false, pdf: true });

// Guardar versión prospecto para previsualizar
await writeFile(join(root, "public", "preview-prospecto.html"), htmlProspecto, "utf8");
console.log("📄 Versión prospecto guardada en public/preview-prospecto.html");

// Generar el PDF con Chrome local
console.log("🖨️  Generando PDF con Chrome...");
const pdfBytes = await htmlToPdfLocal(htmlPdf);
await writeFile(join(root, "public", "preview-propuesta.pdf"), pdfBytes);
const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
const pdfName = `Propuesta-${lead.negocio.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`;
console.log("   ✅ PDF generado:", (pdfBytes.length / 1024).toFixed(1), "KB →", pdfName);

// Sufijo único para que Gmail NO agrupe los correos de prueba (en producción no se usa)
const t = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const u = ` [prueba ${t}]`;

console.log("📧 Enviando versión DUEÑO...");
const r1 = await enviarEmail({ apiKey: resendKey, from, to: cuentaResend, replyTo: lead.email, subject: asuntoDueno(lead, content) + u, html: htmlDueno });
console.log("   ✅ ID:", r1.id);

console.log("📧 Enviando versión PROSPECTO (con PDF adjunto)...");
const r2 = await enviarEmail({
  apiKey: resendKey, from, to: cuentaResend, replyTo: cuentaResend,
  subject: asuntoProspecto(lead) + u, html: htmlProspecto,
  attachments: [{ filename: pdfName, content: pdfBase64 }],
});
console.log("   ✅ ID:", r2.id, "(PDF adjunto)");
