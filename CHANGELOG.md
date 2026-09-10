# Changelog

## 1.4.0 – 2026-09-10
- Nové tlačítko **✦ Claude** (⌘K / Ctrl+K): panel s AI asistentem vedle editoru – zadáte pokyn a Claude ho provede nad otevřeným dokumentem, vybraným textem, nebo hromadně nad zaškrtnutými soubory z pracovní složky (stejný princip jako v JHN SSL Studio)
- Dva úkoly: **Dotaz / analýza** (odpověď s odkazy na čísla řádků) a **Navrhnout změny** (celý upravený soubor, barevný diff, „Použít do editoru“ / „Nahradit výběr“ / „Uložit do souboru“ / „Otevřít v editoru s návrhem“)
- Nastavení ⚙: API klíč Anthropic (jen v prohlížeči), model (Opus 5 výchozí, Sonnet 5, Haiku 4.5), úsilí; streamované odpovědi, počet tokenů, zastavení dávky, historie posledních pokynů
- Zkratka ⌘⏎ / Ctrl+Enter odešle pokyn; stav panelu se pamatuje

## 1.3.0 – 2026-09-09
- Volba cílové složky při ukládání: nové menu **Složka** – vybrat pracovní složku na disku, uložit do ní aktuální soubor (pod stejným nebo jiným názvem, s dotazem před přepsáním) a otevřít z ní libovolný soubor; složka se pamatuje i po zavření prohlížeče
- „Uložit jako…" otevírá dialog ve složce původního souboru (nebo v pracovní složce)
- Zkratka ⇧⌘D / Ctrl+Shift+D = uložit do pracovní složky

## 1.2.0 – 2026-09-09
- Nové typy dokumentů: prostý text (TXT), Python a CSV – v menu Nový, ve výběru typu i automaticky podle přípony
- Python: zvýraznění, kontrola závorek, neukončených řetězců a odsazení bloků; výchozí odsazení 4
- CSV: barevné sloupce, automatická detekce oddělovače, kontrola počtu sloupců a uvozovek, rozměr tabulky ve stavovém řádku, „Formátovat" = vyčištění CSV

## 1.1.0 – 2026-09-09
- Ikona aplikace (favicon i v záhlaví), dialog „O aplikaci" (klik na název nebo na verzi ve stavovém řádku)
- Číslo verze se přebírá z `package.json` a vkládá při buildu; copyright © Jindřich Hegmon ve stavovém řádku i v hlavičce souboru

## 1.0.0 – 2026-09-09
- První verze: zvýraznění HTML/JSON, kontrola syntaxe, panel Problémy, živý náhled HTML, ukládání přes File System Access API, formátování, světlý/tmavý motiv, nedávné soubory, obnova konceptu
