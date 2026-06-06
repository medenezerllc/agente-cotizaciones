/**
 * Prueba del Bloque 4: genera un lead, lo guarda en Supabase y lo lee de vuelta.
 * Uso: node tests/test-supabase.mjs
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generarContenidoPropuesta } from "../src/openai.js";
import { generarFolio } from "../src/proposal.js";
import { guardarLead, listarLeads } from "../src/db.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dv = await readFile(join(root, ".dev.vars"), "utf8");
const get = (k) => dv.match(new RegExp(`^${k}=(.+)$`, "m"))?.[1]?.trim();

const apiKey = get("OPENAI_API_KEY");
const url = get("SUPABASE_URL");
const key = get("SUPABASE_SERVICE_KEY");

const lead = {
  nombre: "Lucía Fernández",
  negocio: "Café Lunaria",
  email: "lucia@cafelunaria.com",
  telefono: "(305) 555-0177",
  direccion: "123 Ocean Dr, Miami, FL 33139",
  tipo: "Restaurante",
  ubicaciones: "1",
  terminales: "2",
  volumen: "$10k-$50k",
  pago_actual: "$1,100/mes",
  fee_actual: "3.0%",
  fee_quien: "El dueño del negocio",
  pos_actual: "Square",
  interes: ["Sistema POS completo", "Pedidos en línea"],
  prioridad: "No estoy seguro, recomiéndame",
  notas: "Quiero modernizar mi café.",
};

console.log("🧠 Generando propuesta...");
const content = await generarContenidoPropuesta({ lead, apiKey, model: "gpt-4o-mini" });
const folio = generarFolio();

console.log("💾 Guardando en Supabase...");
const fila = await guardarLead({ url, key, lead, content, folio });
console.log("   ✅ Guardado. ID:", fila.id, "| Folio:", fila.folio, "| Calificación:", fila.calificacion, "| Score:", fila.score);

console.log("📖 Leyendo leads guardados...");
const leads = await listarLeads({ url, key, limit: 5 });
console.log(`   ✅ ${leads.length} lead(s) en la base. Últimos:`);
for (const l of leads) console.log(`      #${l.id} · ${l.negocio} · ${l.calificacion} (${l.score}) · ${new Date(l.created_at).toLocaleString("es-MX")}`);
