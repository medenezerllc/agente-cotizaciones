/**
 * Prueba local del "cerebro" sin necesidad de Cloudflare.
 * Lee la llave de OpenAI de .dev.vars, manda un lead de ejemplo, genera la
 * propuesta y la guarda en public/preview-propuesta.html para previsualizar.
 *
 * Uso: node tests/test-cerebro.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generarContenidoPropuesta } from "../src/openai.js";
import { renderPropuestaHTML } from "../src/proposal.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Leer OPENAI_API_KEY de .dev.vars
const devvars = await readFile(join(root, ".dev.vars"), "utf8");
const apiKey = devvars.match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim();
if (!apiKey) throw new Error("No encontré OPENAI_API_KEY en .dev.vars");

// Lead de ejemplo (restaurante de volumen medio-alto)
const lead = {
  nombre: "María González",
  negocio: "La Cocina de María",
  email: "maria@lacocina.com",
  telefono: "(908) 555-0142",
  tipo: "Restaurante",
  ubicaciones: "2",
  terminales: "4",
  volumen: "$50k-$150k",
  pago_actual: "$2,400/mes",
  fee_actual: "3.2%",
  fee_quien: "El dueño del negocio",
  pos_actual: "Toast",
  interes: ["Sistema POS completo", "Pago en mesa / propina", "Pedidos en línea"],
  prioridad: "La tarifa de procesamiento más baja",
  notas: "Tenemos mucho volumen los fines de semana y el sistema actual se pone lento.",
};

console.log("🧠 Pensando... (llamando a OpenAI)");
const content = await generarContenidoPropuesta({ lead, apiKey, model: "gpt-4o-mini" });
console.log("✅ Calificación:", content.calificacion, "| Score:", content.score, "| Opción:", content.opcion_recomendada);

const html = renderPropuestaHTML({ lead, content });
const out = join(root, "public", "preview-propuesta.html");
await writeFile(out, html, "utf8");
console.log("📄 Propuesta guardada en:", out);
