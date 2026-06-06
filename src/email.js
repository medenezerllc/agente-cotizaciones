/**
 * Envío de correos con Resend.
 *
 * - Al dueño (Giancarlo): propuesta CON resumen interno + asunto tipo alerta de lead.
 * - Al prospecto: propuesta SIN resumen interno + asunto de bienvenida.
 */

const CAL_EMOJI = { caliente: "🔥", tibio: "🌤️", frio: "❄️" };

/**
 * Envío genérico de un correo HTML por Resend.
 * `attachments`: arreglo opcional [{ filename, content }] donde content es
 * el archivo en base64 (string).
 */
export async function enviarEmail({ apiKey, from, to, replyTo, subject, html, attachments, fetchFn = fetch }) {
  const res = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      html,
      ...(attachments && attachments.length ? { attachments } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend error ${res.status}: ${txt}`);
  }
  return res.json();
}

/** Asunto del correo interno (para ti). */
export function asuntoDueno(lead, content) {
  const emoji = CAL_EMOJI[content.calificacion] || "📩";
  return `${emoji} Nuevo lead ${content.calificacion}: ${lead.negocio} (Score ${content.score})`;
}

/** Asunto del correo al prospecto (personalizado con su negocio). */
export function asuntoProspecto(lead) {
  return `Propuesta para ${lead.negocio} · Electronic Payments`;
}
