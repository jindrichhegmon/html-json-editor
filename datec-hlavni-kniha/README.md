# Hlavní kniha — Centrum & Datec

Nová samostatná aplikace (kopie dashboardu `hlavnikihaclbdatec.netlify.app`), která čte účetní deník
**přímo z Heliosu** – Helios005 = Centrum, Helios004 = Datec. Bez Make, bez Softru, bez tabulek
`CLBHlavniKniha` / `DATECHlavniKniha` a bez exportů do Excelu. Stejná architektura jako aplikace Salda
(`DATE-CLB-SALDA`).

- **Frontend:** `public/index.html` (jeden soubor, bez knihoven) – Porovnání let (třídy 5 a 6 po měsících,
  skupiny účtů, ± % proti loňsku) a Průzkumník účtů (KPI, graf po měsících, obraty účtů, rozklik na zápisy).
- **Backend:** `server.mjs` (Node, VPS) → `src/api.mjs` (HTTP vrstva) → `src/kniha.mjs` (dotazy) → `src/db.mjs` (mssql pool).
  Frontend i API běží na stejné adrese, CORS se neřeší.
- **Přístup:** bez přihlášení a bez klíče (data nejsou tajná). Hesla k Heliosu jsou jen v `.env` na serveru,
  aplikace umí Helios pouze číst.

## Data
| Co | Zdroj | Poznámka |
|---|---|---|
| Obraty účtů za období | `dbo.TabDenik` | `SUM(CastkaMD)`, `SUM(CastkaDAL)`, počet řádků podle `DatumPripad` (datum případu), všechny řádky deníku |
| Náklady / výnosy po měsících | `dbo.TabDenik` | účty tříd 5 a 6 |
| Porovnání let | `dbo.TabDenik` | šestimístné účty tříd 5/6, hodnota DAL − MD po měsících, aktuální a předchozí rok |
| Zápisy na účtu | `dbo.TabDenik` + `dbo.TabCisOrg` | datum, DUD (`Sbornik`), číslo dokladu, text (`Popis`), protistrana, MD, DAL – max 400 od nejnovějších |
| Názvy účtů | `dbo.TabCisUctDef` | název z nejnovějšího účetního období, ve kterém je účet definován |

Ověřeno proti dřívějším tabulkám CLB1: součty MD/DAL po účtech pro rok 2026 jsou shodné.

## API
```
GET /api/health
GET /api/diag
GET /api/prehled?firma=centrum|datec&od=RRRR-MM-DD&do=RRRR-MM-DD[&rok=2026]   → { ucty, mesice, porovnani, roky }
GET /api/detail?firma=&ucet=&od=&do=[&limit=400]                                → { zapisy }
```

## Nasazení

### Varianta A – VPS 95.216.201.2 (doporučeno: pevná IP, kterou firewall SQL Serveru pouští)
Aplikace běží jako samostatný Node server (`server.mjs`, port 3092) za Caddy, vedle jhn-apps a Salda.
1. Jednorázově na VPS:
   ```
   mkdir -p /opt/datec-hlavni-kniha
   { grep -E "^SQL_(SERVER|PORT|ENCRYPT|TRUST_CERT|TIMEOUT_MS)=" /opt/datec-salda/.env; grep -E "^DB_HELIOS00[45]_" /opt/jhn-apps/.env; echo PORT=3092; echo HOST=127.0.0.1; } > /opt/datec-hlavni-kniha/.env
   ```
   Do `/etc/caddy/Caddyfile` přidat blok z `deploy/Caddyfile.snippet` a `systemctl reload caddy`.
2. Z Macu ve složce projektu: `./deploy/vps-deploy.sh` (rsync, `npm install`, pm2 start/restart, kontrola `/api/health`).
3. Web: `https://kniha.95-216-201-2.sslip.io`; kontrola dat: `https://kniha.95-216-201-2.sslip.io/api/diag`.

### Varianta B – Netlify jako průčelí
Netlify nemá pevnou odchozí IP a firewall SQL Serveru ho nepustí, proto Netlify jen servíruje `public/`
a volání `/api/*` přeposílá na VPS (`[[redirects]]` v `netlify.toml`). Stačí propojit Netlify projekt
s tímto repozitářem; žádné proměnné prostředí na Netlify nejsou potřeba.

## Vývoj a testy
```
npm install
npm test                      # API + datová vrstva s mockem Heliosu
node test/dev-server.mjs      # http://127.0.0.1:8788, data z mocku (bez SQL Serveru)
npm start                     # samostatný server proti Heliosu (vyžaduje .env), http://127.0.0.1:3092
```
