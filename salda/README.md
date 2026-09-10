# Salda — Centrum & Datec (dashboard)

Jednosouborový přehled sald dodavatelů a odběratelů pro Centrum (CLB) a Datec (`salda/index.html`).
Data čte **přímo z databáze „DATEC CONSULTING“ (Softr Database)** přes její REST API – Make scénáře
už nejsou potřeba.

## Nastavení
1. Otevřete `index.html`, zadejte přístupový klíč (stejný jako dřív).
2. Klikněte na **⚙ Databáze** a vložte API klíč Softr (Softr → Workspace settings → API keys), případně
   ověřte tlačítkem *Otestovat připojení* a uložte. Klíč se ukládá jen v prohlížeči (localStorage)
   a posílá se pouze na `tables-api.softr.io`.
3. Bez klíče nebo při výpadku se zobrazí vestavěný snapshot ze 14. 7. 2026 s upozorněním.

## Odkud se co bere
| Agenda | Tabulky Softr Database | Poznámka |
|---|---|---|
| Dodavatelé – faktury (SA) | `CLBSADO`, `DATECSADO` | Název, Saldo 1, Datum splatnosti; filtr podle zvoleného období |
| Dodavatelé – trvalé příkazy (TP / PR) | `TPCLB`, `TPDATEC` | rozepisují se podle frekvence (týdenní, 14 dní, měsíční, čtvrtletní, pololetní, roční, jednorázově) do období, počínaje dneškem; záporná částka = pravidelný příjem |
| Odběratelé | `CLBSAOD`, `DATECSAOD` | Název, Saldo 1, Datum splatnosti; po/ve splatnosti podle dnešního data |

Editor **Trvalé příkazy – editace** zapisuje (vytvoření, úprava, smazání) přímo do tabulek `TPCLB` /
`TPDATEC` a po uložení znovu načte tabulku, ověří zápis a obnoví přehled.

## Co se změnilo proti verzi s Make
- Odpadly webhooky „Salda dodavatelů — Dashboard“, „Salda odběratelů — Dashboard“ a „Trvalé příkazy — Údržba“
  i MCP most do Make.
- Kalendář plateb se **nepřepočítává na pozadí** (tlačítka *Přepočítat kalendář plateb* a *Zkontrolovat konzistenci*
  zmizela) – rozpis trvalých příkazů se počítá přímo v prohlížeči z tabulky TP, takže tabulky `CLBPLATBYKAL` /
  `DATECPLATBYKAL` ani SQL tabulka `dbo.Platby` už dashboard nepotřebuje.
- Trvalý příkaz se v období zobrazí **při každém svém termínu** (např. měsíční příkaz v období
  „tento + příští měsíc“ dvakrát), dřívější kalendář obsahoval jen nejbližší termín.
