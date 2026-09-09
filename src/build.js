// Inlines CodeMirror 5 (minified) into the editor template -> single self-contained HTML file.
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const ROOT = path.join(__dirname, '..');
const CM = path.join(ROOT, 'node_modules/codemirror');
const jsFiles = [
  'lib/codemirror.js',
  'mode/xml/xml.js',
  'mode/javascript/javascript.js',
  'mode/css/css.js',
  'mode/htmlmixed/htmlmixed.js',
  'addon/edit/matchbrackets.js',
  'addon/edit/closebrackets.js',
  'addon/edit/closetag.js',
  'addon/edit/matchtags.js',
  'addon/fold/xml-fold.js',
  'addon/fold/foldcode.js',
  'addon/fold/foldgutter.js',
  'addon/fold/brace-fold.js',
  'addon/fold/comment-fold.js',
  'addon/selection/active-line.js',
  'addon/lint/lint.js',
  'addon/search/searchcursor.js',
  'addon/search/search.js',
  'addon/search/jump-to-line.js',
  'addon/dialog/dialog.js',
  'addon/comment/comment.js',
];
const cssFiles = [
  'lib/codemirror.css',
  'addon/lint/lint.css',
  'addon/dialog/dialog.css',
  'addon/fold/foldgutter.css',
];

(async () => {
  let js = '';
  for (const f of jsFiles) {
    const src = fs.readFileSync(path.join(CM, f), 'utf8');
    const out = await minify(src, { compress: true, mangle: true });
    js += `/* ${f} */\n` + out.code + '\n';
  }
  let css = '';
  for (const f of cssFiles) css += `/* ${f} */\n` + fs.readFileSync(path.join(CM, f), 'utf8') + '\n';

  const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  if (!tpl.includes('/*__CM_JS__*/') || !tpl.includes('/*__CM_CSS__*/')) throw new Error('markers missing');
  const out = tpl.replace('/*__CM_CSS__*/', () => css).replace('/*__CM_JS__*/', () => js);
  const dest = path.join(ROOT, 'html-json-editor.html');
    fs.writeFileSync(dest, out);
  console.log('written', dest, (out.length / 1024).toFixed(0) + ' KB');
})();
