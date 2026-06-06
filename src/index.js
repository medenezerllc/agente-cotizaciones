/**
 * Worker raíz del agente de cotizaciones (Cloudflare).
 *
 * Rutas:
 *   GET  /                 → formulario (servido como archivo estático)
 *   GET  /dashboard        → dashboard (Bloque 6)
 *   POST /api/submit       → recibe el lead, genera la propuesta y la procesa
 *
 * En este Bloque 2 ya funciona: recibir lead → IA genera contenido →
 * render de propuesta HTML. El envío por email (Bloque 3) y el guardado en
 * Supabase (Bloque 4) se conectan en los siguientes bloques.
 */
import { generarContenidoPropuesta } from "./openai.js";
import { renderPropuestaHTML, generarFolio } from "./proposal.js";
import { enviarEmail, asuntoDueno, asuntoProspecto } from "./email.js";
import { htmlToPdfCloudflare } from "./pdf.js";
import { guardarLead, listarLeads, obtenerLead } from "./db.js";
import { DASHBOARD_HTML } from "./dashboard.js";

/** Convierte un Uint8Array a base64 (para adjuntar en Resend). */
function aBase64(bytes) {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function nombreArchivoPdf(lead) {
  const slug = String(lead.negocio || "propuesta")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `Propuesta-${slug || "electronic-payments"}.pdf`;
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

/** Respuesta que pide usuario/contraseña (autenticación básica). */
function pedirLogin() {
  return new Response("Acceso restringido — Panel de Leads", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Panel de Leads", charset="UTF-8"' },
  });
}

/** ¿La petición trae el usuario/contraseña correctos? */
function autorizado(req, env) {
  // Si no hay credenciales configuradas, no se bloquea (útil en local).
  if (!env.DASHBOARD_USER || !env.DASHBOARD_PASS) return true;
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  try {
    const [u, p] = atob(h.slice(6)).split(":");
    return u === env.DASHBOARD_USER && p === env.DASHBOARD_PASS;
  } catch {
    return false;
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // Recibir un lead del formulario
    if (url.pathname === "/api/submit" && req.method === "POST") {
      try {
        const lead = await req.json();

        // 1) El cerebro: IA analiza y genera el contenido de la propuesta
        const content = await generarContenidoPropuesta({
          lead,
          apiKey: env.OPENAI_API_KEY,
          model: env.OPENAI_MODEL || "gpt-4o-mini",
        });

        // 2) Render de las dos versiones de la propuesta (mismo folio en todo)
        const folio = generarFolio();
        const htmlDueno = renderPropuestaHTML({ lead, content, interno: true, folio });
        const htmlProspecto = renderPropuestaHTML({ lead, content, interno: false, folio });
        const from = env.MAIL_FROM || "Electronic Payments <onboarding@resend.dev>";

        // 2b) Guardar el lead en Supabase (best-effort: no truena el flujo si falla)
        if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
          try {
            await guardarLead({ url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_KEY, lead, content, folio });
          } catch (e) {
            console.error("No se pudo guardar en Supabase:", String(e?.message || e));
          }
        }

        // 2c) PDF para el prospecto (best-effort: si falla, el correo igual se manda)
        let pdfAdjunto = null;
        if (env.BROWSER) {
          try {
            const htmlPdf = renderPropuestaHTML({ lead, content, interno: false, pdf: true, folio });
            const bytes = await htmlToPdfCloudflare(htmlPdf, env);
            pdfAdjunto = [{ filename: nombreArchivoPdf(lead), content: aBase64(bytes) }];
          } catch (e) {
            console.error("No se pudo generar el PDF:", String(e?.message || e));
          }
        }

        // 3a) Correo al dueño (con resumen interno) — obligatorio
        await enviarEmail({
          apiKey: env.RESEND_API_KEY,
          from,
          to: env.OWNER_EMAIL,
          replyTo: lead.email,
          subject: asuntoDueno(lead, content),
          html: htmlDueno,
        });

        // 3b) Correo al prospecto (sin resumen interno) — best-effort.
        // No truena el flujo si falla (p.ej. Resend en modo prueba aún sin dominio).
        let prospectoEnviado = false;
        if (lead.email) {
          try {
            await enviarEmail({
              apiKey: env.RESEND_API_KEY,
              from,
              to: lead.email,
              replyTo: env.OWNER_EMAIL,
              subject: asuntoProspecto(lead),
              html: htmlProspecto,
              attachments: pdfAdjunto,
            });
            prospectoEnviado = true;
          } catch (e) {
            console.error("No se pudo enviar al prospecto:", String(e?.message || e));
          }
        }

        return json({ ok: true, calificacion: content.calificacion, score: content.score, prospectoEnviado });
      } catch (err) {
        return json({ ok: false, error: String(err?.message || err) }, 500);
      }
    }

    // Rutas internas (privadas) — requieren usuario/contraseña
    const esRutaPrivada =
      url.pathname === "/dashboard" ||
      url.pathname === "/dashboard.html" ||
      url.pathname === "/api/leads" ||
      url.pathname === "/propuesta";
    if (esRutaPrivada && !autorizado(req, env)) {
      return pedirLogin();
    }

    // API: lista de leads para el dashboard
    if (url.pathname === "/api/leads" && req.method === "GET") {
      try {
        const leads = await listarLeads({ url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_KEY });
        return json({ ok: true, leads });
      } catch (err) {
        return json({ ok: false, error: String(err?.message || err) }, 500);
      }
    }

    // Ver una propuesta guardada (versión interna, para ti)
    if (url.pathname === "/propuesta" && req.method === "GET") {
      try {
        const id = url.searchParams.get("id");
        const row = await obtenerLead({ url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_KEY, id });
        if (!row) return new Response("Propuesta no encontrada", { status: 404 });
        const html = renderPropuestaHTML({
          lead: row.lead_data, content: row.propuesta, interno: true, folio: row.folio,
        });
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      } catch (err) {
        return new Response("Error: " + String(err?.message || err), { status: 500 });
      }
    }

    // Dashboard (ya pasó la autenticación de arriba) — servido por el worker
    if (url.pathname === "/dashboard" || url.pathname === "/dashboard.html") {
      return new Response(DASHBOARD_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // Todo lo demás → archivos estáticos (formulario, etc.)
    return env.ASSETS.fetch(req);
  },
};
