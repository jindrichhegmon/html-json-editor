// Mock Heliosu pro testy a lokální dev server – rozpoznává dotazy datové vrstvy podle textu a vrací pevná data.
export function mockHelios(name, denik, nazvy) {
  const calls = [];
  const inRange = (r, p) => r.d >= p.od && r.d < p.doNext;
  return {
    name, calls,
    async query(sqlText, params = {}) {
      calls.push({ sql: sqlText.replace(/\s+/g, ' ').trim(), params });
      if (/SELECT DB_NAME\(\)/.test(sqlText)) return [{ db: name, server: 'MOCK', login: 'ro' }];
      if (/COUNT\(\*\) AS n, CONVERT/.test(sqlText)) return [{ n: denik.length, od: denik.map(r => r.d).sort()[0], do_: denik.map(r => r.d).sort().at(-1) }];
      if (/COUNT\(DISTINCT CisloUcet\)/.test(sqlText)) return [{ n: Object.keys(nazvy).length }];
      if (/FROM dbo\.TabCisUctDef d/.test(sqlText)) return Object.entries(nazvy).map(([u, nazev]) => ({ u, nazev }));
      if (/GROUP BY CisloUcet\s+ORDER BY CisloUcet/.test(sqlText)) {                       // obraty
        const m = new Map();
        for (const r of denik.filter(r => inRange(r, params))) { const o = m.get(r.u) || { u: r.u, md: 0, dal: 0, n: 0 }; o.md += r.md; o.dal += r.dal; o.n++; m.set(r.u, o); }
        return [...m.values()].sort((a, b) => a.u.localeCompare(b.u));
      }
      if (/FORMAT\(DatumPripad, 'yyyy-MM'\)/.test(sqlText)) {                                // měsíce tříd 5/6
        const m = new Map();
        for (const r of denik.filter(r => inRange(r, params) && '56'.includes(r.u[0]))) { const k = r.d.slice(0, 7) + '|' + r.u[0]; const o = m.get(k) || { mes: r.d.slice(0, 7), tr: r.u[0], md: 0, dal: 0 }; o.md += r.md; o.dal += r.dal; m.set(k, o); }
        return [...m.values()];
      }
      if (/YEAR\(DatumPripad\) AS rok/.test(sqlText)) {                                       // porovnání let
        const m = new Map();
        for (const r of denik.filter(r => inRange(r, params) && '56'.includes(r.u[0]) && r.u.length === 6)) { const k = r.u + '|' + r.d.slice(0, 7); const o = m.get(k) || { u: r.u, rok: Number(r.d.slice(0, 4)), mes: Number(r.d.slice(5, 7)), v: 0 }; o.v += r.dal - r.md; m.set(k, o); }
        return [...m.values()];
      }
      if (/SELECT TOP \(@limit\)/.test(sqlText)) {                                           // detail
        return denik.filter(r => r.u === params.ucet && inRange(r, params)).sort((a, b) => b.d.localeCompare(a.d)).slice(0, params.limit)
          .map(r => ({ d: r.d, dud: r.dud || 'FV', dok: r.dok || 1, txt: r.txt || '', naz: r.naz || '', md: r.md, dal: r.dal }));
      }
      throw new Error('mock ' + name + ': neočekávaný dotaz ' + sqlText);
    },
    async exec() { throw new Error('do Heliosu se nezapisuje'); },
  };
}

const Y = new Date().getFullYear();
export const NAZVY = { '221100': 'Bankovní účet', '321100': 'Dodavatelé', '518310': 'Nájemné', '521100': 'Mzdy', '602103': 'Tržby z prodeje služeb - pojišťovny za výkony', '602200': 'Tržby - samoplátci' };
export const DENIK_CENTRUM = [
  { d: `${Y}-01-05`, u: '518310', md: 25000, dal: 0, dud: 'FP', dok: 26001, txt: 'Nájem leden', naz: 'Reality s.r.o.' },
  { d: `${Y}-01-05`, u: '321100', md: 0, dal: 25000, dud: 'FP', dok: 26001, txt: 'Nájem leden', naz: 'Reality s.r.o.' },
  { d: `${Y}-01-31`, u: '521100', md: 300000, dal: 0, dud: 'MZ', dok: 1, txt: 'Mzdy 01' },
  { d: `${Y}-01-31`, u: '602103', md: 0, dal: 800000, dud: 'FV', dok: 260010, txt: 'VZP výkony 01', naz: 'VZP ČR' },
  { d: `${Y}-02-03`, u: '518310', md: 25000, dal: 0, dud: 'FP', dok: 26002, txt: 'Nájem únor', naz: 'Reality s.r.o.' },
  { d: `${Y}-02-28`, u: '602103', md: 0, dal: 650000, dud: 'FV', dok: 260020, txt: 'VZP výkony 02', naz: 'VZP ČR' },
  { d: `${Y}-02-28`, u: '602200', md: 0, dal: 12000, dud: 'PP', dok: 5, txt: 'Samoplátci' },
  { d: `${Y}-02-28`, u: '221100', md: 812000, dal: 0, dud: 'BV', dok: 40, txt: 'Příjem' },
  { d: `${Y - 1}-01-10`, u: '518310', md: 22000, dal: 0, dud: 'FP', dok: 25001, txt: 'Nájem leden (loni)' },
  { d: `${Y - 1}-01-31`, u: '602103', md: 0, dal: 700000, dud: 'FV', dok: 250010, txt: 'VZP výkony (loni)' },
  { d: `${Y - 1}-06-30`, u: '521100', md: 280000, dal: 0, dud: 'MZ', dok: 6, txt: 'Mzdy 06 (loni)' },
];
export const DENIK_DATEC = [
  { d: `${Y}-01-15`, u: '518310', md: 9000, dal: 0, dud: 'FP', dok: 1, txt: 'Nájem Datec', naz: 'Pronajímatel a.s.' },
  { d: `${Y}-01-20`, u: '602200', md: 0, dal: 45000, dud: 'FV', dok: 2, txt: 'Služby', naz: 'Klient s.r.o.' },
  { d: `${Y - 1}-03-01`, u: '602200', md: 0, dal: 40000, dud: 'FV', dok: 3, txt: 'Služby (loni)' },
];
export const mockDbs = () => ({ helios005: mockHelios('Helios005', DENIK_CENTRUM, NAZVY), helios004: mockHelios('Helios004', DENIK_DATEC, NAZVY) });
