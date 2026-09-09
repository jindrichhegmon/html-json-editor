# HTML a JSON editor

Jednoduchý editor HTML a JSON v jednom souboru (`html-json-editor.html`, ~330 KB, funguje offline – CodeMirror 5 je vložen přímo do souboru).

- Online: **https://html-json-editor.netlify.app** (nasazuje se automaticky z větve `main`)
- Repozitář: https://github.com/jindrichhegmon/html-json-editor

## Použití
Otevřete `html-json-editor.html` (lokálně dvojklikem, nebo online adresu výše) v Chromu nebo Edge. V těchto prohlížečích funguje přímý zápis na disk (File System Access API): **Uložit** přepíše původní soubor, **Uložit jako…** otevře systémový dialog, **Nedávné** nabídne naposledy otevřené soubory. V Safari/Firefoxu editor běží také, jen se ukládá stažením souboru.

## Co umí
- Zvýraznění syntaxe HTML (vč. vloženého CSS/JS) a JSON, světlý/tmavý motiv, zalamování, odsazení 2/4, skládání bloků, párování závorek a tagů, hledání (⌘/Ctrl+F).
- Kontrola syntaxe za psaní – JSON: přebývající/chybějící čárky, jednoduché uvozovky, klíče bez uvozovek, `True`/`None`, neukončené řetězce, komentáře, duplicitní klíče. HTML: neuzavřené, křížené a přebývající tagy, neuzavřené uvozovky, duplicitní atributy, chybějící DOCTYPE, neukončené komentáře. Chybné řádky jsou podbarvené, panel „Problémy" dole – klik skočí na chybu.
- Živý náhled HTML vedle editoru (roztažitelný oddělovač) nebo v novém okně.
- Formátovat: JSON pretty-print / Minifikovat; HTML přeodsazení podle vnoření (obsah `<pre>`, `<script>`, `<style>` se nemění).
- Drag & drop souboru do okna, obnova rozepsaného dokumentu po zavření prohlížeče (localStorage), varování při zavření s neuloženými změnami.

## Zkratky
| Akce | Mac | Windows |
|---|---|---|
| Otevřít | ⌘O | Ctrl+O |
| Uložit | ⌘S | Ctrl+S |
| Uložit jako | ⇧⌘S | Ctrl+Shift+S |
| Náhled HTML | ⌘E | Ctrl+E |
| Formátovat | ⇧⌘F | Ctrl+Shift+F |
| Komentář | ⌘/ | Ctrl+/ |
| Sbalit blok | Ctrl+Q | Ctrl+Q |
| Skok na párový tag | ⌘J | Ctrl+J |

## Struktura repozitáře
```
html-json-editor.html   hotový editor (jediný soubor, který je potřeba)
src/template.html       zdroj: UI + vlastní logika (lint, ukládání, náhled)
src/build.js            vloží minifikovaný CodeMirror do šablony
package.json            npm run build
netlify.toml            nasazení na Netlify (adresa / otevře editor)
```

## Sestavení ze zdrojů
```
npm install
npm run build        # přegeneruje html-json-editor.html v kořeni
```
Úpravy dělejte v `src/template.html` (druhý `<script>` blok obsahuje veškerou logiku) a pak spusťte build. Drobné úpravy lze dělat i přímo v hotovém `html-json-editor.html`.
