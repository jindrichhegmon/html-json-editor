// npm test – API a datová vrstva s mockem Heliosu (bez SQL Serveru)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../src/api.mjs';
import { obdobi, firmaKey } from '../src/kniha.mjs';
import { mockDbs } from './mock-db.mjs';

const Y = new Date().getFullYear();
const get = (handle, path) => handle(new Request('http://x' + path, { method: 'GET' })).then(async r => ({ status: r.status, body: await r.json() }));

test('obdobi: validace a horní mez (den po „do“)', () => {
  assert.deepEqual(obdobi('2026-01-01', '2026-01-31'), { od: '2026-01-01', doVcetne: '2026-01-31', doNext: '2026-02-01' });
  assert.equal(obdobi('2026-12-01', '2026-12-31').doNext, '2027-01-01');
  assert.throws(() => obdobi('1.1.2026', '2026-01-31'), /RRRR-MM-DD/);
  assert.throws(() => obdobi('2026-02-01', '2026-01-31'), /za datem/);
  assert.equal(firmaKey('Centrum'), 'centrum');
  assert.throws(() => firmaKey('clb'), /Neznámá firma/);
});

test('GET /api/prehled: obraty, měsíce a porovnání let z Helios005 pro Centrum', async () => {
  const dbs = mockDbs();
  const handle = createHandler({ dbs });
  const { status, body } = await get(handle, `/api/prehled?firma=centrum&od=${Y}-01-01&do=${Y}-12-31`);
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.deepEqual(body.roky, [Y - 1, Y]);
  const najem = body.ucty.find(a => a.u === '518310');
  assert.deepEqual(najem, { u: '518310', name: 'Nájemné', md: 50000, dal: 0, z: 50000, n: 2, cls: '5' });
  assert.equal(body.ucty.find(a => a.u === '602103').dal, 1450000);
  assert.equal(body.ucty.find(a => a.u === '602103').name, 'Tržby z prodeje služeb - pojišťovny za výkony');
  // loňské řádky nejsou v obratech období
  assert.equal(body.ucty.reduce((s, a) => s + a.n, 0), 8);
  // měsíce jen tříd 5/6
  assert.deepEqual(body.mesice.map(m => m.mes + '/' + m.tr).sort(), [`${Y}-01/5`, `${Y}-01/6`, `${Y}-02/5`, `${Y}-02/6`]);
  assert.equal(body.mesice.find(m => m.mes === `${Y}-01` && m.tr === '5').md, 325000);
  // porovnání: oba roky, 12 hodnot, DAL−MD
  const cmp = body.porovnani.filter(c => c.u === '602103');
  assert.deepEqual(cmp.map(c => c.rok), [Y - 1, Y]);
  assert.equal(cmp[1].m[0], 800000); assert.equal(cmp[1].m[1], 650000); assert.equal(cmp[1].m.length, 12);
  assert.equal(body.porovnani.find(c => c.u === '521100' && c.rok === Y - 1).m[5], -280000);
  assert.ok(body.porovnani.every(c => c.u.length === 6 && '56'.includes(c.cls)));
  // Datec se do Helios005 nesahalo
  assert.equal(dbs.helios004.calls.length, 0);
  assert.ok(dbs.helios005.calls.every(c => c.params.od === undefined || /^\d{4}-\d{2}-\d{2}$/.test(c.params.od)), 'data jako parametry');
});

test('GET /api/prehled: Datec čte Helios004, období bez zápisů dává prázdné pole', async () => {
  const dbs = mockDbs();
  const handle = createHandler({ dbs });
  const { body } = await get(handle, `/api/prehled?firma=datec&od=${Y}-01-01&do=${Y}-01-31&rok=${Y}`);
  assert.equal(body.ok, true);
  assert.deepEqual(body.ucty.map(a => a.u), ['518310', '602200']);
  assert.equal(dbs.helios005.calls.length, 0);
  const r2 = await get(handle, `/api/prehled?firma=datec&od=${Y}-05-01&do=${Y}-05-31`);
  assert.deepEqual(r2.body.ucty, []);
  assert.deepEqual(r2.body.mesice, []);
});

test('GET /api/detail: zápisy na účtu od nejnovějších, limit a validace', async () => {
  const handle = createHandler({ dbs: mockDbs() });
  const { body } = await get(handle, `/api/detail?firma=centrum&ucet=518310&od=${Y}-01-01&do=${Y}-12-31`);
  assert.equal(body.ok, true);
  assert.equal(body.limit, 400);
  assert.deepEqual(body.zapisy.map(z => z.d), [`${Y}-02-03`, `${Y}-01-05`]);
  assert.deepEqual(body.zapisy[1], { d: `${Y}-01-05`, dud: 'FP', dok: '26001', txt: 'Nájem leden', naz: 'Reality s.r.o.', md: 25000, dal: 0 });
  const lim = await get(handle, `/api/detail?firma=centrum&ucet=518310&od=${Y}-01-01&do=${Y}-12-31&limit=1`);
  assert.equal(lim.body.zapisy.length, 1);
  const bad = await get(handle, `/api/detail?firma=centrum&od=${Y}-01-01&do=${Y}-12-31`);
  assert.equal(bad.status, 400); assert.match(bad.body.error, /číslo účtu/);
});

test('chybové stavy: neznámá firma, špatné datum, cesta, metoda, výpadek SQL', async () => {
  const handle = createHandler({ dbs: mockDbs() });
  assert.equal((await get(handle, '/api/prehled?firma=clb&od=2026-01-01&do=2026-12-31')).status, 400);
  assert.equal((await get(handle, '/api/prehled?firma=datec&od=2026-13-01&do=2026-12-31')).status, 400);
  assert.equal((await get(handle, '/api/nic')).status, 404);
  const post = await handle(new Request('http://x/api/prehled', { method: 'POST' }));
  assert.equal(post.status, 405);
  const down = createHandler({ dbs: { helios005: { async query() { throw Object.assign(new Error('Failed to connect to 90.182.39.103:1433 in 15000ms'), { code: 'ESOCKET' }); } } } });
  const r = await get(down, '/api/prehled?firma=centrum&od=2026-01-01&do=2026-12-31');
  assert.equal(r.status, 500);
  assert.match(r.body.error, /^SQL Server je nedostupný: /);
});

test('GET /api/health a /api/diag', async () => {
  const handle = createHandler({ dbs: mockDbs() });
  assert.equal((await get(handle, '/api/health')).body.ok, true);
  const { body } = await get(handle, '/api/diag');
  assert.equal(body.centrum.spojeni, 'helios005');
  assert.equal(body.datec.spojeni, 'helios004');
  assert.equal(body.centrum.denik.radku, 11);
  assert.equal(body.centrum.uctu, 6);
});
