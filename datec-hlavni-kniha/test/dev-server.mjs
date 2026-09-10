// Lokální server pro ruční i automatické testy bez SQL Serveru: public/ + /api přes skutečný handler nad mockem Heliosu.
//   node test/dev-server.mjs [port]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHandler } from '../src/api.mjs';
import { mockDbs } from './mock-db.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const handle = createHandler({ dbs: mockDbs() });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + req.headers.host);
  if (url.pathname.startsWith('/api')) {
    const r = await handle(new Request(url, { method: req.method, headers: req.headers }));
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  const file = path.join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname);
  try { const data = await readFile(file); res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(data); }
  catch { res.writeHead(404); res.end('not found'); }
});
const port = Number(process.argv[2] || process.env.PORT || 8788);
server.listen(port, '127.0.0.1', () => console.log(`dev server http://127.0.0.1:${port}`));
