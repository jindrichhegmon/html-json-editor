/**
 * HTTP vrstva (Request → Response), bez vazby na Netlify/Express kvůli testům.
 *
 *   GET /api/health
 *   GET /api/diag
 *   GET /api/prehled?firma=centrum|datec&od=RRRR-MM-DD&do=RRRR-MM-DD[&rok=2026]
 *          → { ucty, mesice, porovnani, roky }
 *   GET /api/detail?firma=&ucet=&od=&do=[&limit=400]   → { zapisy }
 *
 * Bez přihlášení – data nejsou tajná. Pouze čtení. CORS otevřený (GET), aby šla stránka otevřít i mimo server.
 */
import * as kniha from './kniha.mjs';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });

export function createHandler({ dbs }) {
  return async function handle(req) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '');
    const q = (k) => url.searchParams.get(k) ?? '';
    if (req.method.toUpperCase() === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Accept' } });
    if (req.method.toUpperCase() !== 'GET') return json({ ok: false, error: 'Aplikace jen čte – povolena je pouze metoda GET.' }, 405);
    try {
      if (path === '/api/health') return json({ ok: true, cas: new Date().toISOString() });
      if (path === '/api/diag') return json({ ok: true, ...(await kniha.diagnostika(dbs)) });
      if (path === '/api/prehled') return json({ ok: true, ...(await kniha.prehled(dbs, q('firma'), q('od'), q('do'), q('rok'))) });
      if (path === '/api/detail') return json({ ok: true, ...(await kniha.detail(dbs, q('firma'), q('ucet'), q('od'), q('do'), q('limit') || 400)) });
      return json({ ok: false, error: 'Neznámá cesta.' }, 404);
    } catch (e) {
      const status = e.status || 500;
      const msg = e.originalError?.message || e.message || String(e);
      const pretty = status >= 500 && /ETIMEOUT|ESOCKET|ECONNREFUSED|Failed to connect/i.test(msg + (e.code || '')) ? 'SQL Server je nedostupný: ' + msg : msg;
      if (status >= 500) console.error('[kniha]', path, msg);
      return json({ ok: false, error: pretty }, status);
    }
  };
}
