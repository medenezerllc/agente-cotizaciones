/**
 * El "cerebro" del agente.
 *
 * Le manda a OpenAI los datos del lead + el catálogo de Electronic Payments,
 * y le pide de vuelta un ANÁLISIS ESTRUCTURADO (JSON):
 *  - calificación del lead (frío/tibio/caliente)
 *  - opción de precio recomendada y por qué
 *  - productos recomendados y por qué
 *  - copy de venta personalizado para la propuesta
 *  - estimación de ahorro
 *
 * Importante: la IA NO genera el HTML. Solo genera el CONTENIDO. El diseño
 * bonito lo pone nuestra plantilla (proposal.js). Así la propuesta siempre
 * se ve premium y consistente.
 */
import { contextoParaIA } from "./catalog.js";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    calificacion: {
      type: "string",
      enum: ["caliente", "tibio", "frio"],
      description: "Qué tan listo está el lead para comprar, según su volumen, urgencia e interés.",
    },
    score: { type: "integer", description: "0-100, qué tan buen prospecto es." },
    razon_calificacion: { type: "string", description: "1-2 frases internas para el vendedor explicando la calificación." },
    opcion_recomendada: {
      type: "string",
      enum: ["Opción 1", "Opción 2", "Ambas"],
      description: "Qué modelo de precio conviene más a este lead.",
    },
    razon_opcion: { type: "string", description: "Por qué esa opción es la mejor para este negocio (2-3 frases, tono consultor)." },
    ahorro_estimado: { type: "string", description: "Estimación del ahorro o beneficio económico en lenguaje claro. Si no hay datos suficientes, di que se calculará en la llamada." },
    saludo: { type: "string", description: "Saludo personalizado al dueño del negocio usando su nombre y el del negocio." },
    intro: { type: "string", description: "Párrafo de apertura cálido y profesional (2-4 frases) que conecte con la situación del negocio." },
    productos_recomendados: {
      type: "array",
      description: "3-5 productos del catálogo ideales para este lead.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          nombre: { type: "string", description: "Nombre del producto tal cual del catálogo." },
          beneficio: { type: "string", description: "Una frase de por qué le sirve a ESTE negocio en particular." },
        },
        required: ["nombre", "beneficio"],
      },
    },
    puntos_clave: {
      type: "array",
      description: "3-4 bullets de valor que cierren la venta para este lead específico.",
      items: { type: "string" },
    },
    siguiente_paso: { type: "string", description: "Llamado a la acción claro y amable para agendar/avanzar." },
  },
  required: [
    "calificacion", "score", "razon_calificacion", "opcion_recomendada", "razon_opcion",
    "ahorro_estimado", "saludo", "intro", "productos_recomendados", "puntos_clave", "siguiente_paso",
  ],
};

function leadResumen(lead) {
  const tipo = lead.tipo === "Otro" && lead.tipo_otro ? `Otro: ${lead.tipo_otro}` : lead.tipo;
  const interes = Array.isArray(lead.interes) ? lead.interes.join(", ") : lead.interes || "—";
  return `Nombre: ${lead.nombre}
Negocio: ${lead.negocio}
Email: ${lead.email} | Tel: ${lead.telefono}
Dirección: ${lead.direccion || "no indicó"}
Tipo de negocio: ${tipo || "—"}
Ubicaciones: ${lead.ubicaciones || "—"} | POS/terminales que necesita: ${lead.terminales || "—"}
Volumen mensual con tarjeta: ${lead.volumen || "—"}
Paga hoy al mes (procesamiento): ${lead.pago_actual || "no indicó"}
Processing fee actual: ${lead.fee_actual || "no indicó"} | Lo paga: ${lead.fee_quien || "no indicó"}
POS actual: ${lead.pos_actual || "no indicó"}
Le interesa: ${interes}
Prioridad: ${lead.prioridad || "—"}
Notas: ${lead.notas || "—"}`;
}

/**
 * Llama a OpenAI y devuelve el objeto de contenido para la propuesta.
 * @param {{lead:object, apiKey:string, model?:string, fetchFn?:Function}} opts
 */
export async function generarContenidoPropuesta({ lead, apiKey, model = "gpt-4o-mini", fetchFn = fetch }) {
  const system = `Eres un consultor experto en ventas de soluciones POS y procesamiento de pagos para ${"Electronic Payments"}.
Tu trabajo: analizar a un lead y preparar el contenido de una propuesta profesional que EDUQUE y CIERRE la venta.
Reglas:
- Tono: cálido, consultor, profesional, en español neutro. Nada de tecnicismos sin explicar.
- No inventes productos ni precios fuera del catálogo y modelo de precios dados.
- Recomienda la opción de precio según el perfil: alto volumen y prioridad "tarifa más baja" → Opción 2; quien quiere cero costo/riesgo o pasa el fee al cliente → Opción 1; si dudas o conviene comparar → "Ambas".
- Si el lead dio cuánto paga hoy, usa ese dato para hablar de ahorro de forma realista (sin prometer cifras exactas).
- Sé específico al negocio del lead, no genérico.

CONOCIMIENTO DISPONIBLE:
${contextoParaIA()}`;

  const user = `Analiza este lead y genera el contenido de su propuesta:\n\n${leadResumen(lead)}`;

  const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "propuesta", strict: true, schema: SCHEMA },
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI no devolvió contenido");
  return JSON.parse(content);
}
