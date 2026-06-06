/**
 * Guardado y lectura de leads en Supabase (vía su API REST / PostgREST).
 * Usa la llave service_role, que solo vive del lado del servidor.
 */

const CAL_RANK = { caliente: 3, tibio: 2, frio: 1 };

/**
 * Guarda un lead + su propuesta en la tabla `leads`.
 * @returns {object|null} la fila creada, o null si falla.
 */
export async function guardarLead({ url, key, lead, content, folio, fetchFn = fetch }) {
  const fila = {
    estado: "nuevo",
    nombre: lead.nombre || null,
    negocio: lead.negocio || null,
    email: lead.email || null,
    telefono: lead.telefono || null,
    direccion: lead.direccion || null,
    tipo: lead.tipo === "Otro" && lead.tipo_otro ? `Otro: ${lead.tipo_otro}` : lead.tipo || null,
    volumen: lead.volumen || null,
    calificacion: content?.calificacion || null,
    score: typeof content?.score === "number" ? content.score : null,
    opcion: content?.opcion_recomendada || null,
    ahorro: content?.ahorro_estimado || null,
    folio: folio || null,
    lead_data: lead,
    propuesta: content,
  };

  const res = await fetchFn(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(fila),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase insert error ${res.status}: ${txt}`);
  }
  const rows = await res.json();
  return rows[0] || null;
}

/** Lee un lead por su id. */
export async function obtenerLead({ url, key, id, fetchFn = fetch }) {
  const res = await fetchFn(`${url}/rest/v1/leads?select=*&id=eq.${encodeURIComponent(id)}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Supabase get error ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows[0] || null;
}

/** Lee los leads (para el dashboard), más recientes primero. */
export async function listarLeads({ url, key, limit = 200, fetchFn = fetch }) {
  const res = await fetchFn(
    `${url}/rest/v1/leads?select=*&order=created_at.desc&limit=${limit}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase select error ${res.status}: ${txt}`);
  }
  return res.json();
}

export { CAL_RANK };
