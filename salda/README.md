# Salda — Centrum & Datec (dashboard)

Jednosouborový přehled sald dodavatelů a odběratelů pro Centrum (CLB) a Datec (`salda/index.html`,
nasazuje se jako web `saldododavatele.netlify.app` z repozitáře `DATEC-saldododavatele`).

Data čte **přímo z SQL** přes aplikační server **jhn-apps** (stejný model jako SQL Studio):
`GET/POST https://95-216-201-2.sslip.io/api/apps/salda?token=…`. Make scénáře ani Softr už nejsou potřeba.

## Odkud se co bere
| Agenda | Zdroj | Poznámka |
|---|---|---|
| Dodavatelé – faktury (SA) | CLB1 `dbo.CLBSaldoDO`, `dbo.DATECSaldoDO` | Název, Saldo 1, Datum splatnosti (DMR); filtr podle zvoleného období |
| Dodavatelé – trvalé příkazy (TP / PR) | CLB1 `dbo.Salda_TrvalePrikazy` | rozepisují se v prohlížeči podle frekvence (týdenní, 14 dní, měsíční, čtvrtletní, pololetní, roční, jednorázově) do období, počínaje dneškem; záporná částka = pravidelný příjem |
| Odběratelé | CLB1 `dbo.CLBSaldoOD`, `dbo.DATECSaldoOD` | Název, Saldo 1, Datum splatnosti; po/ve splatnosti podle dnešního data |

Editor **Trvalé příkazy – editace** zapisuje (vytvoření, úprava, smazání) přes aplikaci `salda` do tabulky
`Salda_TrvalePrikazy`, po uložení tabulku znovu načte, zápis ověří a obnoví přehled.

## Serverová část (repozitář `jhn-apps`)
Soubory jsou v `salda/jhn-apps/` (kopie k přenesení do repozitáře jhn-apps):

- `apps/salda.js` – aplikace `salda` (`publicToken: 'salda-19a958511fd856d6'`, stejný token je v `index.html`).
  Akce: `prehled` (`cast=dodavatele|odberatele|vse`), `tp-list`, `tp-create`, `tp-update`, `tp-delete`.
- `sql/salda.sql` – DDL tabulky `dbo.Salda_TrvalePrikazy` v **CLB1** + jednorázový seed 45 záznamů
  (stav Softr TPCLB/TPDATEC k 10. 9. 2026). Idempotentní; seed se vloží jen do prázdné tabulky.
- `test/salda.test.js` – test aplikace s mockem `ctx` (bez databáze): `node test/salda.test.js`.

### Nasazení (kroky, které je nutné udělat ručně)
1. V jhn-apps přidat `apps/salda.js`, `sql/salda.sql`, `test/salda.test.js` a spustit `npm run gen`.
2. Spustit `sql/salda.sql` na databázi **CLB1** (např. v SQL Studiu, spojení `clb1`) – založí tabulku a naplní ji.
3. Do `.env` na serveru přidat do `CORS_ORIGINS` origin webu: `https://saldododavatele.netlify.app` (a případně
   vlastní doménu). Pak `./deploy/vps-deploy.sh` (nebo `pm2 restart jhn-apps`).
4. Ověřit: `https://95-216-201-2.sslip.io/api/apps/salda?token=salda-19a958511fd856d6&akce=tp-list`.
5. Nahrát nový `index.html` do repozitáře `DATEC-saldododavatele` (větev `main` se nasazuje na Netlify).

Přístupová brána dashboardu (32znakový klíč) zůstává beze změny.

## Co se změnilo proti verzi s Make
- Odpadly webhooky „Salda dodavatelů — Dashboard“, „Salda odběratelů — Dashboard“ a „Trvalé příkazy — Údržba“,
  MCP most do Make i Softr tabulky CLBSADO/CLBSAOD/…/TPCLB/TPDATEC (zrcadlo SQL).
- Kalendář plateb se **nepřepočítává na pozadí** (tlačítka *Přepočítat kalendář plateb* a *Zkontrolovat konzistenci*
  zmizela) – rozpis trvalých příkazů se počítá v prohlížeči, takže tabulky CLBPLATBYKAL / DATECPLATBYKAL ani SQL
  tabulka `dbo.Platby` už dashboard nepotřebuje.
- Trvalý příkaz se v období zobrazí **při každém svém termínu** (např. měsíční příkaz v období
  „tento + příští měsíc“ dvakrát); dřívější kalendář obsahoval jen nejbližší termín.
- Při výpadku serveru se zobrazí vestavěný snapshot ze 14. 7. 2026 s diagnostikou.
