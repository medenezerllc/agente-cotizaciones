import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { listarLeads, obtenerLead } from './src/db.js';
import { renderPropuestaHTML } from './src/proposal.js';
import { DASHBOARD_HTML } from './src/dashboard.js';

const base = dirname(fileURLToPath(import.meta.url));
const root = join(base, 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

// Credenciales de Supabase (solo para la vista previa local)
const dv = await readFile(join(base, '.dev.vars'), 'utf8').catch(() => '');
const get = (k) => dv.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim();
const SUPABASE_URL = get('SUPABASE_URL');
const SUPABASE_KEY = get('SUPABASE_SERVICE_KEY');

createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    // API: leads para el dashboard
    if (u.pathname === '/api/leads') {
      const leads = await listarLeads({ url: SUPABASE_URL, key: SUPABASE_KEY });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, leads }));
    }
    // Ver una propuesta guardada
    if (u.pathname === '/propuesta') {
      const row = await obtenerLead({ url: SUPABASE_URL, key: SUPABASE_KEY, id: u.searchParams.get('id') });
      if (!row) { res.writeHead(404); return res.end('No encontrada'); }
      const html = renderPropuestaHTML({ lead: row.lead_data, content: row.propuesta, interno: true, folio: row.folio });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    // Dashboard (servido desde el módulo, igual que en producción)
    if (u.pathname === '/dashboard' || u.pathname === '/dashboard.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(DASHBOARD_HTML);
    }
    // Archivos estáticos
    let p = decodeURIComponent(u.pathname);
    if (p === '/') p = '/index.html';
    const data = await readFile(join(root, p));
    res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(500); res.end('Error: ' + e.message);
  }
}).listen(4321, () => console.log('preview on http://localhost:4321'));
