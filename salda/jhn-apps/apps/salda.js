/**
 * Salda Centrum & Datec – backend dashboardu (Netlify web saldododavatele), náhrada Make scénářů
 * „Salda dodavatelů — Dashboard (webhook)", „Salda odběratelů — Dashboard (webhook)" a „Trvalé příkazy — Údržba (webhook)".
 *
 * Zdroje:
 *   CLB1: dbo.CLBSaldoDO / dbo.DATECSaldoDO  … neuhrazené faktury dodavatelů (závazky) – jen čtení
 *         dbo.CLBSaldoOD / dbo.DATECSaldoOD  … pohledávky za odběrateli – jen čtení
 *         dbo.Salda_TrvalePrikazy            … trvalé příkazy a pravidelné příjmy (sql/salda.sql), dřív Softr TPCLB / TPDATEC
 *
 * akce = 'prehled'   → faktury (+ odběratelé) obou firem + trvalé příkazy; cast = dodavatele | odberatele | vse
 * akce = 'tp-list'   → jen trvalé příkazy
 * akce = 'tp-create' | 'tp-update' | 'tp-delete' → údržba trvalých příkazů (firma, id, popis, frekvence, castka, datum)
 *
 * Kalendář plateb (rozpis trvalých příkazů podle frekvence do období) si počítá frontend – tady se jen čtou data.
 */
import { z } from 'zod';

const FIRMY = {
  centrum: { kod: 'CLB',   sado: 'dbo.CLBSaldoDO',   saod: 'dbo.CLBSaldoOD' },
  datec:   { kod: 'DATEC', sado: 'dbo.DATECSaldoDO', saod: 'dbo.DATECSaldoOD' },
};
const TP = 'dbo.Salda_TrvalePrikazy';

/* saldokonto: [Datum splatnosti (DMR)] je text "MM/DD/YYYY hh:mm:ss" → ISO datum */
const SALDO_SQL = (table) => `
  SELECT RTRIM(LTRIM(ISNULL([Název], N''))) AS nazev,
         [Saldo 1] AS saldo,
         CONVERT(char(10), TRY_CONVERT(datetime, [Datum splatnosti (DMR)], 101), 23) AS splatnost,
         [Č# org#] AS corg,
         [Párovací znak] AS parovaci
  FROM ${table}
  WHERE [Saldo 1] IS NOT NULL AND [Saldo 1] <> 0
  ORDER BY TRY_CONVERT(datetime, [Datum splatnosti (DMR)], 101), [Název]`;

const TP_SELECT = `
  SELECT Id AS id, Firma AS firma, Popis AS popis, Frekvence AS frekvence, Castka AS castka,
         CONVERT(char(10), DatumPlatby, 23) AS datum, Vytvoreno AS vytvoreno, Zmeneno AS zmeneno
  FROM ${TP}`;

const num = (v) => (v === null || v === undefined ? null : Number(v));
const mapSaldo = (r) => ({ nazev: r.nazev, castka: num(r.saldo), splatnost: r.splatnost, corg: r.corg == null ? null : String(r.corg), parovaci: r.parovaci || null });
const mapTp = (r) => ({ id: r.id, firma: r.firma, popis: r.popis, frekvence: r.frekvence, castka: num(r.castka), datum: r.datum });

async function tpList(ctx) {
  const rows = await ctx.db('clb1').query(`${TP_SELECT} ORDER BY Firma, Popis`);
  const out = { centrum: [], datec: [] };
  for (const r of rows) {
    const key = r.firma === 'DATEC' ? 'datec' : 'centrum';
    out[key].push(mapTp(r));
  }
  return out;
}

function tpValidate(input) {
  const popis = String(input.popis || '').trim();
  const frekvence = String(input.frekvence || '').trim();
  const castka = Number(input.castka);
  const datum = String(input.datum || '').trim();
  if (!popis) throw new Error('Vyplňte popis.');
  if (popis.length > 300) throw new Error('Popis je příliš dlouhý (max. 300 znaků).');
  if (!frekvence) throw new Error('Vyplňte frekvenci.');
  if (!Number.isFinite(castka) || castka === 0) throw new Error('Zadejte nenulovou částku (kladná = výdaj, záporná = příjem).');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || isNaN(Date.parse(datum))) throw new Error('Datum platby musí být ve tvaru RRRR-MM-DD.');
  return { popis, frekvence, castka: Math.round(castka * 100) / 100, datum };
}

export default {
  name: 'salda',
  description: 'Data pro dashboard Salda Centrum & Datec: neuhrazené faktury dodavatelů a pohledávky odběratelů ze saldokonta CLB1 (tabulky CLBSaldoDO/OD, DATECSaldoDO/OD) a údržba trvalých příkazů (tabulka Salda_TrvalePrikazy v CLB1).',
  // Volání z prohlížeče (web saldododavatele.netlify.app) – jako Make webhook s tajnou URL; origin webu musí být v CORS_ORIGINS.
  publicToken: 'salda-19a958511fd856d6',
  input: {
    akce: z.enum(['prehled', 'tp-list', 'tp-create', 'tp-update', 'tp-delete']).default('prehled').describe('prehled = saldokonto + trvalé příkazy; tp-* = údržba trvalých příkazů'),
    cast: z.enum(['dodavatele', 'odberatele', 'vse']).default('vse').describe('Která část přehledu se má načíst'),
    firma: z.enum(['centrum', 'datec']).optional().describe('Firma pro tp-create/update/delete'),
    id: z.coerce.number().int().positive().optional().describe('Id trvalého příkazu (tp-update, tp-delete)'),
    popis: z.string().optional(),
    frekvence: z.string().optional().describe('Měsíční, Čtvrtletní, Pololetní, Roční, Týdenní, 14 dní, Jednorázově'),
    castka: z.coerce.number().optional().describe('Kladná = výdaj, záporná = pravidelný příjem'),
    datum: z.string().optional().describe('Datum platby RRRR-MM-DD'),
  },
  async run(input, ctx) {
    const akce = input.akce;

    if (akce === 'prehled') {
      const firmy = {};
      await Promise.all(Object.entries(FIRMY).map(async ([key, f]) => {
        const [fakt, odb] = await Promise.all([
          input.cast === 'odberatele' ? [] : ctx.db('clb1').query(SALDO_SQL(f.sado)),
          input.cast === 'dodavatele' ? [] : ctx.db('clb1').query(SALDO_SQL(f.saod)),
        ]);
        firmy[key] = { kod: f.kod, faktury: fakt.map(mapSaldo), odberatele: odb.map(mapSaldo), tp: [] };
      }));
      if (input.cast !== 'odberatele') {
        const tp = await tpList(ctx);
        firmy.centrum.tp = tp.centrum;
        firmy.datec.tp = tp.datec;
      }
      return { generovano: new Date().toISOString(), cast: input.cast, firmy };
    }

    if (akce === 'tp-list') return { tp: await tpList(ctx) };

    // údržba trvalých příkazů
    if (!input.firma) throw new Error('Chybí firma (centrum | datec).');
    const kod = FIRMY[input.firma].kod;
    const d = ctx.db('clb1');

    if (akce === 'tp-create') {
      const v = tpValidate(input);
      const rows = await d.query(
        `INSERT INTO ${TP} (Firma, Popis, Frekvence, Castka, DatumPlatby) OUTPUT INSERTED.Id AS id VALUES (@firma, @popis, @frekvence, @castka, @datum)`,
        { firma: kod, popis: v.popis, frekvence: v.frekvence, castka: v.castka, datum: v.datum });
      const id = rows[0]?.id;
      ctx.log(`tp-create ${kod} #${id} ${v.popis}`);
      const saved = await d.query(`${TP_SELECT} WHERE Id = @id`, { id });
      return { ok: true, id, zaznam: saved[0] ? mapTp(saved[0]) : null };
    }

    if (!input.id) throw new Error('Chybí id trvalého příkazu.');

    if (akce === 'tp-update') {
      const v = tpValidate(input);
      const n = await d.exec(
        `UPDATE ${TP} SET Popis = @popis, Frekvence = @frekvence, Castka = @castka, DatumPlatby = @datum, Zmeneno = SYSDATETIME() WHERE Id = @id AND Firma = @firma`,
        { id: input.id, firma: kod, popis: v.popis, frekvence: v.frekvence, castka: v.castka, datum: v.datum });
      if (!n) throw new Error(`Trvalý příkaz #${input.id} (${kod}) nebyl nalezen.`);
      ctx.log(`tp-update ${kod} #${input.id} ${v.popis}`);
      const saved = await d.query(`${TP_SELECT} WHERE Id = @id`, { id: input.id });
      return { ok: true, id: input.id, zaznam: saved[0] ? mapTp(saved[0]) : null };
    }

    if (akce === 'tp-delete') {
      const n = await d.exec(`DELETE FROM ${TP} WHERE Id = @id AND Firma = @firma`, { id: input.id, firma: kod });
      if (!n) throw new Error(`Trvalý příkaz #${input.id} (${kod}) nebyl nalezen.`);
      ctx.log(`tp-delete ${kod} #${input.id}`);
      return { ok: true, id: input.id, smazano: true };
    }

    throw new Error(`Neznámá akce "${akce}".`);
  },
};
