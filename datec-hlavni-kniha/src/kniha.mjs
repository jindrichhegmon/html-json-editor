/**
 * Datová vrstva Hlavní knihy – čte účetní deník Heliosu (jen čtení).
 * Funkce dostávají `dbs` = { helios005, helios004 } (každé { query }), aby šly testovat bez databáze.
 *
 *   dbo.TabDenik      … řádky účetního deníku: CisloUcet, CastkaMD / CastkaDAL, DatumPripad (datum případu),
 *                       Sbornik (= DUD), CisloDokladu, Popis (text), CisloOrg (protistrana), Zaknihovano
 *   dbo.TabCisUctDef  … účtová osnova po obdobích (NazevUctu) – bere se název z nejnovějšího období
 *   dbo.TabCisOrg     … organizace (Nazev)
 *
 * Stejně jako dřívější tabulky CLBHlavniKniha / DATECHlavniKniha se počítají všechny řádky deníku
 * (zaúčtované i dosud nezaúčtované).
 */

export const FIRMY = {
  centrum: { nazev: 'Centrum', helios: 'helios005' },
  datec:   { nazev: 'Datec',   helios: 'helios004' },
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const bad = (m) => Object.assign(new Error(m), { status: 400 });

export function firmaKey(v) {
  const k = String(v || '').toLowerCase();
  if (!FIRMY[k]) throw bad('Neznámá firma – použijte centrum nebo datec.');
  return k;
}
export function obdobi(od, do_) {
  od = String(od || '').trim(); do_ = String(do_ || '').trim();
  if (!ISO.test(od) || !ISO.test(do_) || Number.isNaN(Date.parse(od)) || Number.isNaN(Date.parse(do_))) throw bad('Období musí být ve tvaru RRRR-MM-DD.');
  if (od > do_) throw bad('Datum „od“ je za datem „do“.');
  const d = new Date(do_ + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1);
  return { od, doVcetne: do_, doNext: d.toISOString().slice(0, 10) };   // interval <od, doNext)
}

const num = (v) => (v === null || v === undefined ? 0 : Number(v));
const clean = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();

/* názvy účtů: z nejnovějšího období, ve kterém je účet definován */
const NAZVY_SQL = `
  SELECT d.CisloUcet AS u, d.NazevUctu AS nazev
  FROM dbo.TabCisUctDef d
  JOIN (SELECT CisloUcet, MAX(IdObdobi) AS IdObdobi FROM dbo.TabCisUctDef GROUP BY CisloUcet) m
    ON m.CisloUcet = d.CisloUcet AND m.IdObdobi = d.IdObdobi`;

const OBRATY_SQL = `
  SELECT CisloUcet AS u, SUM(ISNULL(CastkaMD, 0)) AS md, SUM(ISNULL(CastkaDAL, 0)) AS dal, COUNT(*) AS n
  FROM dbo.TabDenik
  WHERE DatumPripad >= @od AND DatumPripad < @doNext AND CisloUcet IS NOT NULL AND CisloUcet <> ''
  GROUP BY CisloUcet
  ORDER BY CisloUcet`;

const MESICE_SQL = `
  SELECT FORMAT(DatumPripad, 'yyyy-MM') AS mes, LEFT(CisloUcet, 1) AS tr, SUM(ISNULL(CastkaMD, 0)) AS md, SUM(ISNULL(CastkaDAL, 0)) AS dal
  FROM dbo.TabDenik
  WHERE DatumPripad >= @od AND DatumPripad < @doNext AND LEFT(CisloUcet, 1) IN ('5', '6')
  GROUP BY FORMAT(DatumPripad, 'yyyy-MM'), LEFT(CisloUcet, 1)
  ORDER BY mes, tr`;

const POROVNANI_SQL = `
  SELECT CisloUcet AS u, YEAR(DatumPripad) AS rok, MONTH(DatumPripad) AS mes, SUM(ISNULL(CastkaDAL, 0) - ISNULL(CastkaMD, 0)) AS v
  FROM dbo.TabDenik
  WHERE DatumPripad >= @od AND DatumPripad < @doNext AND LEFT(CisloUcet, 1) IN ('5', '6') AND LEN(CisloUcet) = 6
  GROUP BY CisloUcet, YEAR(DatumPripad), MONTH(DatumPripad)`;

const DETAIL_SQL = `
  SELECT TOP (@limit) CONVERT(char(10), d.DatumPripad, 23) AS d, ISNULL(d.Sbornik, '') AS dud, d.CisloDokladu AS dok,
         ISNULL(d.Popis, '') AS txt, ISNULL(o.Nazev, '') AS naz, ISNULL(d.CastkaMD, 0) AS md, ISNULL(d.CastkaDAL, 0) AS dal
  FROM dbo.TabDenik d
  LEFT JOIN dbo.TabCisOrg o ON o.CisloOrg = d.CisloOrg
  WHERE d.CisloUcet = @ucet AND d.DatumPripad >= @od AND d.DatumPripad < @doNext
  ORDER BY d.DatumPripad DESC, d.Id DESC`;

async function nazvy(db) {
  const map = new Map();
  for (const r of await db.query(NAZVY_SQL)) map.set(clean(r.u), clean(r.nazev));
  return map;
}

/** Přehled pro jednu firmu a období: obraty účtů, měsíce tříd 5/6 a porovnání dvou let (aktuální a předchozí) */
export async function prehled(dbs, firma, od, do_, rokPorovnani) {
  const f = FIRMY[firmaKey(firma)];
  const db = dbs[f.helios];
  const o = obdobi(od, do_);
  const y1 = Number(rokPorovnani) || new Date().getFullYear();
  const y0 = y1 - 1;
  const [jmena, obraty, mesice, porovnani] = await Promise.all([
    nazvy(db),
    db.query(OBRATY_SQL, { od: o.od, doNext: o.doNext }),
    db.query(MESICE_SQL, { od: o.od, doNext: o.doNext }),
    db.query(POROVNANI_SQL, { od: `${y0}-01-01`, doNext: `${y1 + 1}-01-01` }),
  ]);
  const ucty = obraty.map(r => { const u = clean(r.u); const md = num(r.md), dal = num(r.dal); return { u, name: jmena.get(u) || '', md, dal, z: md - dal, n: Number(r.n) || 0, cls: u.charAt(0) }; });
  const mes = mesice.map(r => ({ mes: r.mes, tr: String(r.tr), md: num(r.md), dal: num(r.dal) }));
  const piv = new Map();
  for (const r of porovnani) {
    const u = clean(r.u); const key = u + '|' + r.rok;
    if (!piv.has(key)) piv.set(key, { u, name: jmena.get(u) || '', rok: Number(r.rok), m: new Array(12).fill(0), cls: u.charAt(0) });
    piv.get(key).m[Number(r.mes) - 1] += num(r.v);
  }
  const cmp = [...piv.values()].sort((a, b) => a.u < b.u ? -1 : a.u > b.u ? 1 : a.rok - b.rok);
  return { firma: firmaKey(firma), od: o.od, do: o.doVcetne, roky: [y0, y1], ucty, mesice: mes, porovnani: cmp, generovano: new Date().toISOString() };
}

/** Jednotlivé zápisy na účtu v období (od nejnovějších, max. `limit`) */
export async function detail(dbs, firma, ucet, od, do_, limit = 400) {
  const f = FIRMY[firmaKey(firma)];
  const u = String(ucet || '').replace(/[^0-9A-Za-z]/g, '');
  if (!u) throw bad('Chybí číslo účtu.');
  const o = obdobi(od, do_);
  const lim = Math.min(Math.max(Number(limit) || 400, 1), 2000);
  const rows = await dbs[f.helios].query(DETAIL_SQL, { ucet: u, od: o.od, doNext: o.doNext, limit: lim });
  return { firma: firmaKey(firma), ucet: u, od: o.od, do: o.doVcetne, limit: lim,
    zapisy: rows.map(r => ({ d: r.d, dud: clean(r.dud), dok: r.dok == null ? '' : String(r.dok), txt: clean(r.txt), naz: clean(r.naz), md: num(r.md), dal: num(r.dal) })) };
}

/** Diagnostika spojení a rozsahu dat */
export async function diagnostika(dbs) {
  const out = {};
  for (const [key, f] of Object.entries(FIRMY)) {
    try {
      const i = (await dbs[f.helios].query('SELECT DB_NAME() AS db, @@SERVERNAME AS server, SUSER_SNAME() AS login'))[0] || {};
      const r = (await dbs[f.helios].query('SELECT COUNT(*) AS n, CONVERT(char(10), MIN(DatumPripad), 23) AS od, CONVERT(char(10), MAX(DatumPripad), 23) AS do_ FROM dbo.TabDenik'))[0] || {};
      const uc = (await dbs[f.helios].query('SELECT COUNT(DISTINCT CisloUcet) AS n FROM dbo.TabCisUctDef'))[0] || {};
      out[key] = { ok: true, spojeni: f.helios, ...i, denik: { radku: Number(r.n || 0), od: r.od, do: r.do_ }, uctu: Number(uc.n || 0) };
    } catch (e) { out[key] = { ok: false, spojeni: f.helios, chyba: e.originalError?.message || e.message }; }
  }
  return out;
}
