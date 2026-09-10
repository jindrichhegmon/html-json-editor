// Test aplikace salda s mockem ctx (bez databáze):  node test/salda.test.js
import assert from 'node:assert/strict';
import { z } from 'zod';
import app from '../apps/salda.js';

const schema = z.object(app.input);
const calls = [];
let tpRows = [
  { id: 1, firma: 'CLB', popis: 'ALZA', frekvence: 'Měsíční', castka: 3575, datum: '2026-09-15' },
  { id: 2, firma: 'DATEC', popis: 'Byt 104 prodej', frekvence: 'Jednorázově', castka: -5100000, datum: '2026-09-24' },
];
const db = (name) => ({
  async query(sql, params) {
    calls.push({ name, sql: sql.replace(/\s+/g, ' ').trim(), params });
    if (/FROM dbo\.CLBSaldoDO/.test(sql)) return [{ nazev: 'Lékárna Baťov s.r.o.', saldo: -21703.52, splatnost: '2026-09-14', corg: 18, parovaci: null }];
    if (/FROM dbo\.DATECSaldoDO/.test(sql)) return [];
    if (/FROM dbo\.CLBSaldoOD/.test(sql)) return [{ nazev: 'RBP, zdravotní pojišťovna', saldo: 85234, splatnost: '2026-09-30', corg: 19, parovaci: null }];
    if (/FROM dbo\.DATECSaldoOD/.test(sql)) return [{ nazev: 'ViVi', saldo: -1158.84, splatnost: '2026-06-30', corg: 3, parovaci: null }];
    if (/INSERT INTO dbo\.Salda_TrvalePrikazy/.test(sql)) { const id = 99; tpRows.push({ id, firma: params.firma, popis: params.popis, frekvence: params.frekvence, castka: params.castka, datum: params.datum }); return [{ id }]; }
    if (/FROM dbo\.Salda_TrvalePrikazy WHERE Id = @id/.test(sql)) return tpRows.filter(r => r.id === params.id);
    if (/FROM dbo\.Salda_TrvalePrikazy/.test(sql)) return tpRows;
    throw new Error('neočekávaný dotaz: ' + sql);
  },
  async exec(sql, params) {
    calls.push({ name, sql: sql.replace(/\s+/g, ' ').trim(), params });
    if (/^UPDATE/.test(sql.trim())) { const r = tpRows.find(x => x.id === params.id && x.firma === params.firma); if (!r) return 0; Object.assign(r, { popis: params.popis, frekvence: params.frekvence, castka: params.castka, datum: params.datum }); return 1; }
    if (/^DELETE/.test(sql.trim())) { const n = tpRows.length; tpRows = tpRows.filter(x => !(x.id === params.id && x.firma === params.firma)); return n - tpRows.length; }
    throw new Error('neočekávaný exec: ' + sql);
  },
});
const ctx = { db, log: () => {}, trigger: 'test', databases: () => ['jhn', 'clb1'] };
const run = (input) => app.run(schema.parse(input), ctx);

// prehled
let r = await run({});
assert.equal(r.firmy.centrum.kod, 'CLB');
assert.equal(r.firmy.centrum.faktury[0].castka, -21703.52);
assert.equal(r.firmy.centrum.odberatele[0].castka, 85234);
assert.equal(r.firmy.datec.odberatele[0].castka, -1158.84);
assert.equal(r.firmy.centrum.tp.length, 1); assert.equal(r.firmy.datec.tp.length, 1);
assert.ok(calls.every(c => (c.name === 'clb1') === /Saldo/.test(c.sql)), 'saldokonto jen z clb1, TP jen z jhn');
assert.ok(!calls.some(c => c.name === 'clb1' && /INSERT|UPDATE|DELETE/.test(c.sql)), 'do clb1 se nikdy nezapisuje');

// jen dodavatelé – bez dotazů na SaldoOD
calls.length = 0;
r = await run({ cast: 'dodavatele' });
assert.ok(!calls.some(c => /SaldoOD/.test(c.sql)));
assert.equal(r.firmy.centrum.odberatele.length, 0);
assert.equal(r.firmy.centrum.tp.length, 1);

// jen odběratelé – bez TP a bez SaldoDO
calls.length = 0;
r = await run({ cast: 'odberatele' });
assert.ok(!calls.some(c => /SaldoDO|Salda_TrvalePrikazy/.test(c.sql)));

// tp-create s validací, parametrizovaně (žádné lepení hodnot do SQL)
r = await run({ akce: 'tp-create', firma: 'centrum', popis: 'Test', frekvence: 'Měsíční', castka: '1234.5', datum: '2026-10-01' });
assert.equal(r.ok, true); assert.equal(r.id, 99); assert.equal(r.zaznam.castka, 1234.5); assert.equal(r.zaznam.firma, 'CLB');
assert.ok(calls.at(-2).sql.includes('@popis') && !calls.at(-2).sql.includes('Test'));
await assert.rejects(run({ akce: 'tp-create', firma: 'centrum', popis: '', frekvence: 'Měsíční', castka: 1, datum: '2026-10-01' }), /popis/);
await assert.rejects(run({ akce: 'tp-create', firma: 'centrum', popis: 'x', frekvence: 'Měsíční', castka: 0, datum: '2026-10-01' }), /částku/);
await assert.rejects(run({ akce: 'tp-create', firma: 'centrum', popis: 'x', frekvence: 'Měsíční', castka: 1, datum: '1.10.2026' }), /RRRR-MM-DD/);
await assert.rejects(run({ akce: 'tp-create', popis: 'x', frekvence: 'Měsíční', castka: 1, datum: '2026-10-01' }), /firma/);

// tp-update: jiná firma → nenalezeno
await assert.rejects(run({ akce: 'tp-update', firma: 'datec', id: 99, popis: 'Test2', frekvence: 'Roční', castka: 5, datum: '2026-10-02' }), /nebyl nalezen/);
r = await run({ akce: 'tp-update', firma: 'centrum', id: '99', popis: 'Test2', frekvence: 'Roční', castka: -5, datum: '2026-10-02' });
assert.equal(r.zaznam.popis, 'Test2'); assert.equal(r.zaznam.castka, -5);

// tp-delete
r = await run({ akce: 'tp-delete', firma: 'centrum', id: 99 });
assert.equal(r.smazano, true);
await assert.rejects(run({ akce: 'tp-delete', firma: 'centrum', id: 99 }), /nebyl nalezen/);

console.log('salda.test.js OK');
