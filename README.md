# HTML a JSON editor

Jednoduchý editor HTML a JSON v jednom souboru (`html-json-editor.html`, ~330 KB, funguje offline – CodeMirror 5 je vložen přímo do souboru).

## Použití
Otevřete `html-json-editor.html` v Chromu nebo Edge (dvojklik na soubor). V těchto prohlížečích funguje přímý zápis na disk (File System Access API): **Uložit** přepíše původní soubor, **Uložit jako…** otevře systémový dialog, **Nedávné** nabídne naposledy otevřené soubory. V Safari/Firefoxu editor běží také, jen se ukládá stažením souboru.

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

## Sestavení ze zdrojů (složka `src/`)
```
cd src
npm install codemirror@5 terser
node build.js        # vytvoří dist/html-json-editor.html
```
`template.html` obsahuje celé UI a vlastní logiku (lint, ukládání, náhled) ve druhém `<script>` bloku; `build.js` do ní vloží minifikovaný CodeMirror. Drobné úpravy lze dělat i přímo v hotovém `html-json-editor.html`.
