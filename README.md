# HTML a JSON editor

Jednoduchý editor HTML, JSON, CSV, Pythonu a prostého textu v jednom souboru (`html-json-editor.html`, ~430 KB, funguje offline – CodeMirror 5 je vložen přímo do souboru). Obsahuje panel **Claude** pro dotazy na kód a návrhy změn, i hromadně nad soubory ve složce (vyžaduje vlastní API klíč Anthropic).

- Online: **https://htmledit.hegmonfamily.com** (alias https://html-json-editor.netlify.app; nasazuje se automaticky z větve `main`)
- Repozitář: https://github.com/jindrichhegmon/html-json-editor

## Použití
Otevřete `html-json-editor.html` (lokálně dvojklikem, nebo online adresu výše) v Chromu nebo Edge. V těchto prohlížečích funguje přímý zápis na disk (File System Access API):

- **Uložit** přepíše původní soubor (ten, ze kterého byl dokument otevřen).
- **Uložit jako…** otevře systémový dialog, kde vyberete složku i název – dialog se otevírá ve složce původního souboru, případně v pracovní složce.
- **Složka** – pracovní složka na disku: „Vybrat složku…", pak „Uložit do této složky" (pod stejným nebo jiným názvem; před přepsáním existujícího souboru se editor zeptá) a seznam souborů ve složce k přímému otevření. Vybraná složka se pamatuje i po zavření prohlížeče (při dalším použití prohlížeč jen požádá o potvrzení přístupu).
- **Nedávné** nabídne naposledy otevřené soubory. V Safari/Firefoxu editor běží také, jen se ukládá stažením souboru.

## Podporované formáty
| Typ | Přípony | Zvýraznění | Kontrola |
|---|---|---|---|
| HTML | .html .htm .xhtml .svg .xml | tagy, atributy, vložené CSS/JS | neuzavřené/křížené tagy, uvozovky, atributy, DOCTYPE |
| JSON | .json | klíče, řetězce, čísla, true/false/null | úplný parser – čárky, uvozovky, klíče, duplicitní klíče… |
| CSV | .csv .tsv | každý sloupec jinou barvou, hlavička tučně; oddělovač `,` `;` TAB `\|` se pozná automaticky | počet sloupců vs. hlavička, neuzavřené uvozovky; stavový řádek ukazuje rozměr tabulky |
| Python | .py .pyw | klíčová slova, řetězce, dekorátory… | závorky, neukončené řetězce, chybějící/neočekávané odsazení, smíšené tabulátory a mezery |
| Text | .txt .log .md a vše ostatní | bez zvýraznění | – |

Typ se pozná podle přípony (u souboru bez přípony podle obsahu) a jde přepnout ručně v liště. „Formátovat" u CSV znamená vyčištění: ořez mezer, sjednocení uvozovek, odstranění prázdných řádků.

## Co umí
- Zvýraznění syntaxe HTML (vč. vloženého CSS/JS), JSON, CSV a Pythonu, světlý/tmavý motiv, zalamování, odsazení 2/4, skládání bloků, párování závorek a tagů, hledání (⌘/Ctrl+F).
- Kontrola syntaxe za psaní – JSON: přebývající/chybějící čárky, jednoduché uvozovky, klíče bez uvozovek, `True`/`None`, neukončené řetězce, komentáře, duplicitní klíče. HTML: neuzavřené, křížené a přebývající tagy, neuzavřené uvozovky, duplicitní atributy, chybějící DOCTYPE, neukončené komentáře. Chybné řádky jsou podbarvené, panel „Problémy" dole – klik skočí na chybu.
- Živý náhled HTML vedle editoru (roztažitelný oddělovač) nebo v novém okně.
- Formátovat: JSON pretty-print / Minifikovat; HTML přeodsazení podle vnoření (obsah `<pre>`, `<script>`, `<style>` se nemění).
- Drag & drop souboru do okna, obnova rozepsaného dokumentu po zavření prohlížeče (localStorage), varování při zavření s neuloženými změnami.
- **Claude** (⌘K / Ctrl+K) – panel s AI asistentem: zadáte pokyn a Claude ho provede nad otevřeným dokumentem, nad vybraným textem, nebo hromadně nad zaškrtnutými soubory z pracovní složky. Viz níže.

## Claude – dotazy na kód a návrhy změn
Tlačítko **✦ Claude** otevře panel vpravo vedle editoru (stejný princip jako v JHN SSL Studio):

1. V nastavení ⚙ vložte svůj API klíč Anthropic (získáte v [Anthropic Console](https://console.anthropic.com/settings/keys)). Klíč se ukládá jen v prohlížeči (localStorage) a posílá se přímo na `api.anthropic.com`; použití jde na váš účet Anthropic. Volitelně zvolte model (výchozí Claude Opus 5; dále Sonnet 5, Haiku 4.5) a úsilí.
2. Napište pokyn („Najdi chyby a navrhni opravu“, „Přidej ke všem obrázkům atribut alt“, „Vysvětli, co skript dělá“…). Posledních 12 pokynů se pamatuje jako klikací historie – hodí se pro opakované hromadné zpracování.
3. Zvolte **rozsah**: aktuální dokument · jen vybraný text · soubory z pracovní složky (zaškrtnete, které; zpracovávají se postupně s průběhem).
4. Zvolte **úkol**:
   - **Dotaz / analýza** – Claude odpoví (řádky posílá očíslované, takže se odkazuje na konkrétní čísla řádků).
   - **Navrhnout změny** – Claude vrátí celý upravený soubor. Panel zobrazí shrnutí, barevný diff (+/−) a tlačítka **Použít do editoru** (vrátit lze ⌘Z), **Nahradit výběr**, u souborů ze složky **Uložit do souboru** (po potvrzení přepíše soubor na disku) nebo **Otevřít v editoru s návrhem**.
5. Odeslat = tlačítko nebo ⌘⏎ / Ctrl+Enter; běžící dávku lze zastavit. Odpovědi se streamují, u každé je počet vstupních/výstupních tokenů.

Bez API klíče panel funguje jen jako nastavení; editor sám zůstává plně offline.

## Zkratky
| Akce | Mac | Windows |
|---|---|---|
| Otevřít | ⌘O | Ctrl+O |
| Uložit | ⌘S | Ctrl+S |
| Uložit jako | ⇧⌘S | Ctrl+Shift+S |
| Uložit do pracovní složky | ⇧⌘D | Ctrl+Shift+D |
| Náhled HTML | ⌘E | Ctrl+E |
| Formátovat | ⇧⌘F | Ctrl+Shift+F |
| Komentář | ⌘/ | Ctrl+/ |
| Sbalit blok | Ctrl+Q | Ctrl+Q |
| Skok na párový tag | ⌘J | Ctrl+J |
| Panel Claude | ⌘K | Ctrl+K |
| Odeslat pokyn Claude (v panelu) | ⌘⏎ | Ctrl+Enter |

## Struktura repozitáře
```
html-json-editor.html   hotový editor (jediný soubor, který je potřeba)
src/template.html       zdroj: UI + vlastní logika (lint, ukládání, náhled)
src/build.js            vloží minifikovaný CodeMirror, ikonu a číslo verze do šablony
src/icon.svg            ikona aplikace (favicon, záhlaví, dialog O aplikaci)
package.json            npm run build; pole "version" = verze aplikace
CHANGELOG.md            historie verzí
netlify.toml            nasazení na Netlify (adresa / otevře editor)
```

## Sestavení ze zdrojů
```
npm install
npm run build        # přegeneruje html-json-editor.html v kořeni
```
Úpravy dělejte v `src/template.html` (druhý `<script>` blok obsahuje veškerou logiku) a pak spusťte build. Drobné úpravy lze dělat i přímo v hotovém `html-json-editor.html`.

## Verzování
Verze aplikace je jen na jednom místě – v `package.json` (`"version"`). Build ji vloží do stavového řádku, dialogu „O aplikaci" (klik na název nebo na verzi vpravo dole) a do komentáře v hlavičce souboru spolu s datem sestavení. Při změně: zvýšit verzi v `package.json`, doplnit `CHANGELOG.md`, `npm run build`, commit a push (Netlify nasadí automaticky).

© 2026 Jindřich Hegmon. Obsahuje CodeMirror 5 (MIT License).
