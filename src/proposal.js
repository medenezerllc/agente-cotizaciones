/**
 * Convierte el contenido generado por la IA en una propuesta HTML premium.
 *
 * La estructura tiene dos partes:
 *  1) RESUMEN INTERNO (solo para Giancarlo): calificación del lead, ahorro, etc.
 *  2) PROPUESTA PARA EL CLIENTE: documento elegante, listo para enviar/forwardear.
 */
import { OPCIONES_PRECIO, BENEFICIOS, EMPRESA } from "./catalog.js";

/** Genera un folio único para una propuesta (ej. EP-12345678). */
export function generarFolio() {
  return "EP-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const CAL = {
  caliente: { txt: "🔥 Caliente", bg: "#fde8e4", fg: "#b3401f", bar: "#e4572e" },
  tibio: { txt: "🌤️ Tibio", bg: "#fdf3dd", fg: "#8a6400", bar: "#d4af37" },
  frio: { txt: "❄️ Frío", bg: "#e6eef7", fg: "#2c5b8f", bar: "#4a82c4" },
};

function tipoNegocio(lead) {
  return lead.tipo === "Otro" && lead.tipo_otro ? esc(lead.tipo_otro) : esc(lead.tipo || "—");
}

function chips(pairs) {
  return pairs
    .filter(([, v]) => v && String(v).trim() && v !== "—")
    .map(
      ([k, v]) =>
        `<div class="chip"><span class="chip-k">${esc(k)}</span><span class="chip-v">${esc(v)}</span></div>`
    )
    .join("");
}

function tarjetaPrecio(op, recomendada) {
  const cls = recomendada ? "price-card best" : "price-card";
  const badge = recomendada ? `<div class="best-badge">★ Recomendada para ti</div>` : "";
  return `<div class="${cls}">
    ${badge}
    <h4>${esc(op.nombre)}</h4>
    <table class="price-table">
      <tr><td>Costo inicial</td><td>${esc(op.costoInicial)}</td></tr>
      <tr><td>Mensualidad</td><td>${esc(op.mensualidad)}</td></tr>
      <tr><td>Tarifa de procesamiento</td><td>${esc(op.tarifa)}</td></tr>
      <tr><td>Equipo y servicio</td><td>${esc(op.equipo)}</td></tr>
      <tr><td>Seguro</td><td>${esc(op.seguro)}</td></tr>
      <tr><td>Marketing y menús</td><td>${esc(op.marketing)}</td></tr>
    </table>
    <div class="price-ideal"><strong>Ideal para:</strong> ${esc(op.idealPara)}</div>
  </div>`;
}

/**
 * @param {{lead:object, content:object, fecha?:string, interno?:boolean, pdf?:boolean}} args
 *   interno=true  → versión para Giancarlo (incluye resumen interno).
 *   interno=false → versión para el prospecto (sin resumen interno).
 *   pdf=true      → estilos optimizados para impresión / PDF (fondo blanco, página completa).
 * @returns {string} HTML completo
 */
export function renderPropuestaHTML({ lead, content, fecha, interno = true, pdf = false, folio: folioArg } = {}) {
  const cal = CAL[content.calificacion] || CAL.tibio;
  const o1 = OPCIONES_PRECIO.opcion1;
  const o2 = OPCIONES_PRECIO.opcion2;
  const rec = content.opcion_recomendada;
  const fechaTxt =
    fecha ||
    new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  // Folio único por propuesta: se ve profesional y, además, hace que cada
  // correo sea distinto para que Gmail no lo trate como "contenido repetido"
  // y no lo recorte con los "•••".
  const folio = folioArg || ("EP-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10));
  const uid = `${folio}-${Math.random().toString(36).slice(2, 10)}`;

  const productos = (content.productos_recomendados || [])
    .map(
      (p) => `<div class="prod">
        <div class="prod-mark">✦</div>
        <div><div class="prod-name">${esc(p.nombre)}</div><div class="prod-benefit">${esc(p.beneficio)}</div></div>
      </div>`
    )
    .join("");

  const puntos = (content.puntos_clave || [])
    .map((p) => `<li>${esc(p)}</li>`)
    .join("");

  const beneficios = BENEFICIOS.map(
    (b) => `<div class="benefit"><span class="benefit-check">✓</span>${esc(b)}</div>`
  ).join("");

  // Bloque de resumen interno (solo en la versión para Giancarlo)
  const bloqueInterno = !interno ? "" : `
  <!-- RESUMEN INTERNO (solo para Giancarlo) -->
  <div class="internal">
    <table class="internal-top" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="vertical-align:middle; text-align:left;"><span class="internal-tag">⚑ Resumen interno · solo para ti</span></td>
      <td style="vertical-align:middle; text-align:right;"><span class="qual-badge">${cal.txt}</span>&nbsp;&nbsp;<span class="qual-score">Score ${esc(content.score)}/100</span></td>
    </tr></table>
    <div class="internal-grid">
      <div><b>Lead:</b> ${esc(lead.nombre)} — ${esc(lead.negocio)}</div>
      <div><b>Contacto:</b> ${esc(lead.email)} · ${esc(lead.telefono)}</div>
      ${lead.direccion ? `<div><b>Dirección:</b> ${esc(lead.direccion)}</div>` : ""}
      <div><b>Opción recomendada:</b> ${esc(content.opcion_recomendada)}</div>
      <div><b>Ahorro estimado:</b> ${esc(content.ahorro_estimado)}</div>
    </div>
    <div class="internal-note">${esc(content.razon_calificacion)} ${esc(content.razon_opcion)}</div>
  </div>`;

  // Tarjetas de precio: si recomienda una, va primero y resaltada
  let precios;
  if (rec === "Opción 2") precios = tarjetaPrecio(o2, true) + tarjetaPrecio(o1, false);
  else if (rec === "Ambas") precios = tarjetaPrecio(o1, false) + tarjetaPrecio(o2, false);
  else precios = tarjetaPrecio(o1, true) + tarjetaPrecio(o2, false);

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Propuesta · ${esc(lead.negocio)} · Electronic Payments</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Helvetica, Arial, sans-serif; background: #eceef1; color: #2b2f36; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  .doc { max-width: 760px; margin: 24px auto; background: #fff; box-shadow: 0 18px 50px -20px rgba(0,0,0,.25); border-radius: 18px; overflow: hidden; }

  /* Resumen interno (tono claro ámbar — legible en modo claro y oscuro) */
  .internal { background: #fdf6e3; color: #5a4d28; padding: 20px 26px; border-bottom: 1px solid #ece0b8; }
  .internal-top { width: 100%; margin-bottom: 14px; border-collapse: collapse; }
  .internal-tag { font-size: .68rem; letter-spacing: .18em; text-transform: uppercase; color: #b8923f; font-weight: 700; }
  .qual-badge { background: ${cal.bg}; color: ${cal.fg}; font-weight: 700; padding: 5px 13px; border-radius: 999px; font-size: .85rem; display: inline-block; white-space: nowrap; }
  .qual-score { font-size: .82rem; color: #8a7a4a; white-space: nowrap; }
  .internal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 22px; font-size: .85rem; }
  @media (max-width:560px){ .internal-grid { grid-template-columns: 1fr; } }
  .internal-grid b { color: #9a7d2e; font-weight: 700; }
  .internal-note { margin-top: 12px; font-size: .82rem; color: #6f5f33; border-left: 2px solid #c9a45c; padding-left: 12px; }

  /* Header cliente (claro y suave) */
  .header { background: linear-gradient(135deg,#fbf9f3 0%, #f1ead9 100%); color: #1b1e24; padding: 40px 40px 34px; position: relative; }
  .header::after { content:''; position:absolute; left:0; right:0; bottom:0; height:4px; background: linear-gradient(90deg,#e7c873,#c9a45c,#b8923f); }
  .brand-row { margin-bottom: 26px; border-collapse: collapse; }
  .bm { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg,#e7c873,#b8923f); color:#1a1408; font-weight:800; font-size:18px; text-align:center; line-height:38px; box-shadow:0 4px 12px -4px rgba(184,146,63,.5); }
  .brand-row .bn { font-weight: 700; color:#1b1e24; }
  .brand-row .bn span { color: #b8923f; }
  .brand-row .bt { font-size:.7rem; letter-spacing:.14em; text-transform:uppercase; color:#9a958a; }
  .doc-kicker { font-size:.72rem; letter-spacing:.2em; text-transform:uppercase; color:#b8923f; margin-bottom:8px; font-weight:600; }
  .doc-title { font-family:Georgia, 'Times New Roman', serif; font-size: 2rem; line-height:1.15; font-weight:600; color:#1b1e24; }
  .doc-sub { color:#6a6f77; margin-top:8px; font-size:.95rem; }

  .body { padding: 34px 40px; }
  .greeting { font-family:Georgia, 'Times New Roman', serif; font-size:1.35rem; color:#1b1e24; margin-bottom:10px; }
  .intro { color:#4a4f57; font-size:1.02rem; margin-bottom: 30px; }

  .section { margin-bottom: 32px; }
  .section-title { font-size:.74rem; letter-spacing:.16em; text-transform:uppercase; color:#b8923f; font-weight:700; margin-bottom:14px; display:flex; align-items:center; gap:10px; }
  .section-title::after { content:''; flex:1; height:1px; background:#e6e2d6; }

  .chips { font-size:0; }
  .chip { display:inline-block; vertical-align:top; margin:0 10px 10px 0; background:#f6f4ee; border:1px solid #ece7da; border-radius:10px; padding:9px 13px; font-size:13px; }
  .chip-k { display:block; color:#9a958a; font-size:.7rem; text-transform:uppercase; letter-spacing:.05em; }
  .chip-v { color:#2b2f36; font-weight:600; }

  .prod { display:flex; gap:14px; padding:15px 0; border-bottom:1px solid #f0eee8; }
  .prod:last-child { border-bottom:none; }
  .prod-mark { color:#c9a45c; font-size:1.1rem; flex-shrink:0; margin-top:2px; }
  .prod-name { font-weight:700; color:#1b1e24; }
  .prod-benefit { color:#5a5f67; font-size:.93rem; }

  .prices { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @media (max-width:600px){ .prices { grid-template-columns:1fr; } }
  .price-card { border:1.5px solid #e6e2d6; border-radius:14px; padding:20px; background:#fff; position:relative; }
  .price-card.best { border-color:#d4af37; box-shadow:0 0 0 3px rgba(212,175,55,.14); background:linear-gradient(180deg,#fffdf6,#fff); }
  .best-badge { position:absolute; top:-11px; left:18px; background:linear-gradient(135deg,#e7c873,#b8923f); color:#1a1408; font-size:.72rem; font-weight:700; padding:4px 11px; border-radius:999px; }
  .price-card h4 { font-family:Georgia, 'Times New Roman', serif; font-size:1.12rem; margin-bottom:12px; color:#1b1e24; }
  .price-table { width:100%; border-collapse:collapse; font-size:.84rem; }
  .price-table td { padding:6px 0; border-bottom:1px solid #f2f0ea; vertical-align:top; }
  .price-table td:first-child { color:#8a8f97; width:42%; padding-right:14px; }
  .price-table td:last-child { color:#2b2f36; font-weight:600; }
  .price-ideal { margin-top:12px; font-size:.8rem; color:#6a6f77; background:#faf8f2; border-radius:9px; padding:10px 12px; }

  .savings { background:#faf6ea; border:1px solid #ece0b8; color:#4a4128; border-radius:14px; padding:22px 26px; }
  .savings-tbl { border-collapse:collapse; width:100%; }
  .savings-icon { font-size:1.8rem; }
  .savings b { color:#9a7d2e; }

  .benefits { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
  @media (max-width:560px){ .benefits { grid-template-columns:1fr; } }
  .benefit { font-size:.9rem; color:#4a4f57; }
  .benefit-check { color:#fff; background:#c9a45c; border-radius:50%; width:19px; height:19px; display:inline-block; text-align:center; line-height:19px; font-size:11px; vertical-align:middle; margin-right:9px; }

  .keypoints { list-style:none; }
  .keypoints li { padding:9px 0 9px 28px; position:relative; color:#3a3f47; border-bottom:1px solid #f3f1eb; }
  .keypoints li::before { content:'✦'; position:absolute; left:0; color:#c9a45c; }
  .keypoints li:last-child { border-bottom:none; }

  .cta { background:#faf8f2; border:1px solid #ece7da; border-radius:14px; padding:26px; text-align:center; }
  .cta-title { font-family:Georgia, 'Times New Roman', serif; font-size:1.3rem; color:#1b1e24; margin-bottom:8px; }
  .cta p { color:#5a5f67; margin-bottom:18px; }
  .seller { display:inline-block; background:#fff; border:1px solid #ece7da; border-radius:12px; padding:14px 20px; text-align:left; }
  .seller-tbl { border-collapse:collapse; }
  .seller-av { width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#e7c873,#b8923f); color:#1a1408; font-weight:800; font-size:18px; text-align:center; line-height:46px; }
  .seller-name { font-weight:700; color:#1b1e24; }
  .seller-role { font-size:.8rem; color:#8a8f97; }
  .seller-contact { font-size:.84rem; color:#4a4f57; margin-top:3px; }
  .seller-contact a { color:#b8923f; text-decoration:none; }
  .seller-ref { font-size:.72rem; color:#b3b8c0; margin-top:5px; }

  .footer { background:#faf8f2; color:#8a8f97; text-align:center; padding:22px; font-size:.78rem; border-top:1px solid #ece7da; }
  .footer .gold { color:#b8923f; font-weight:600; }
  ${pdf ? `body{background:#fff;} .doc{max-width:100%;margin:0;border-radius:0;box-shadow:none;}` : ""}
</style></head>
<body>
<div class="doc">
${bloqueInterno}
  <!-- HEADER CLIENTE -->
  <div class="header">
    <table class="brand-row" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="38" style="vertical-align:middle;"><div class="bm">EP</div></td>
      <td style="vertical-align:middle; padding-left:11px;"><div class="bn">Electronic <span>Payments</span></div><div class="bt">POS &amp; Procesamiento de Pagos</div></td>
    </tr></table>
    <div class="doc-kicker">Propuesta personalizada · ${esc(fechaTxt)} · Ref. ${esc(folio)}</div>
    <div class="doc-title">Solución a la medida para ${esc(lead.negocio)}</div>
    <div class="doc-sub">Preparada por ${esc(EMPRESA.vendedor)}</div>
  </div>

  <div class="body">
    <div class="greeting">${esc(content.saludo)}</div>
    <p class="intro">${esc(content.intro)}</p>

    <div class="section">
      <div class="section-title">Tu situación</div>
      <div class="chips">${chips([
        ["Tipo de negocio", tipoNegocio(lead).replace(/&[^;]+;/g, (m) => m)],
        ["Ubicaciones", lead.ubicaciones],
        ["POS / Terminales", lead.terminales],
        ["Volumen mensual", lead.volumen],
        ["Paga hoy", lead.pago_actual],
        ["Fee actual", lead.fee_actual],
        ["POS actual", lead.pos_actual],
        ["Prioridad", lead.prioridad],
      ])}</div>
    </div>

    <div class="section">
      <div class="section-title">Solución recomendada</div>
      ${productos}
    </div>

    <div class="section">
      <div class="section-title">Tu inversión</div>
      <p style="color:#5a5f67; margin-bottom:18px; font-size:.95rem;">${esc(content.razon_opcion)}</p>
      <div class="prices">${precios}</div>
    </div>

    <div class="section">
      <div class="savings">
        <table class="savings-tbl" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="40" style="vertical-align:top;"><span class="savings-icon">💰</span></td>
          <td style="vertical-align:top;"><b>Tu ahorro / beneficio:</b> ${esc(content.ahorro_estimado)}</td>
        </tr></table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Por qué Electronic Payments</div>
      <div class="benefits">${beneficios}</div>
    </div>

    <div class="section">
      <div class="section-title">Lo más importante para ti</div>
      <ul class="keypoints">${puntos}</ul>
    </div>

    <div class="cta">
      <div class="cta-title">${esc(content.siguiente_paso)}</div>
      <p>Estoy listo para resolver tus dudas y afinar los números contigo.</p>
      <div class="seller">
        <table class="seller-tbl" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="46" style="vertical-align:middle;"><div class="seller-av">GM</div></td>
          <td style="vertical-align:middle; padding-left:14px;">
            <div class="seller-name">${esc(EMPRESA.vendedor)} · Electronic Payments</div>
            <div class="seller-contact">${esc(EMPRESA.email)} · ${esc(EMPRESA.telefono)} · Ref. ${esc(folio)}</div>
          </td>
        </tr></table>
      </div>
    </div>
  </div>

  <div class="footer">
    <span class="gold">Electronic Payments</span> · Propuesta ${esc(folio)} para ${esc(lead.negocio)} · ${esc(fechaTxt)} · Precios justos, sin tarifas ocultas.
  </div>
</div>
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; font-size:1px; line-height:1px;">${esc(uid)}</div>
</body></html>`;
}
