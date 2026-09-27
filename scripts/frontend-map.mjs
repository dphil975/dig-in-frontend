#!/usr/bin/env node
/* frontend-map — which files under src/ are actually loaded by the app?

   Walks the static import graph from src/main.jsx (import, export-from,
   import('…'), CSS @import) and reports every file nothing reaches. This is
   what src/ARCHITECTURE.md's "live vs. unwired" numbers come from.

     node scripts/frontend-map.mjs           human-readable report
     node scripts/frontend-map.mjs --json    the same data as JSON

   Read-only. Only relative imports are followed; npm packages are ignored.
   A file that is only reached through `import(\`…${x}\`)` or import.meta.glob
   would be reported as unwired — the script warns if either pattern exists. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const ENTRY = path.join(SRC, 'main.jsx');
const TRY = ['', '.js', '.jsx', '.mjs', '.json', '.css', '/index.js', '/index.jsx'];
const IMPORTS = [
  /(?:^|[;\s])import\s+(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /(?:^|[;\s])export\s+(?:\*|\{[^}]*\})(?:\s+as\s+\w+)?\s+from\s+['"]([^'"]+)['"]/g,
  /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  /@import\s+(?:url\()?['"]([^'"]+)['"]/g,
];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (e.name === '.DS_Store' || e.name === 'node_modules') return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});

const files = walk(SRC);
const known = new Set(files);
const rel = (p) => path.relative(SRC, p);
const lineCount = (f) => fs.readFileSync(f, 'utf8').split('\n').length;

function resolveImport(from, spec) {
  if (!spec.startsWith('.')) return null;                       // npm package
  const base = path.resolve(path.dirname(from), spec);
  return TRY.map((x) => base + x).find((c) => known.has(c)) ?? undefined;
}

const edges = new Map();
const unresolved = [];
const warnings = [];
for (const f of files.filter((x) => /\.(m?jsx?|css)$/.test(x))) {
  const src = fs.readFileSync(f, 'utf8');
  const out = new Set();
  for (const re of IMPORTS) {
    re.lastIndex = 0;
    for (let m; (m = re.exec(src));) {
      const r = resolveImport(f, m[1]);
      if (r) out.add(r); else if (r === undefined) unresolved.push(`${rel(f)} -> ${m[1]}`);
    }
  }
  if (/import\(\s*`/.test(src) || /import\.meta\.glob/.test(src)) warnings.push(rel(f));
  edges.set(f, out);
}

const reached = new Set([ENTRY]);
for (const stack = [ENTRY]; stack.length;) {
  for (const t of edges.get(stack.pop()) ?? []) if (!reached.has(t)) { reached.add(t); stack.push(t); }
}

// A "shim" is a file whose only content is `export … from '…'`.
const isShim = (f) => {
  if (!/\.m?jsx?$/.test(f)) return false;
  const body = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
  return body !== '' && body.split('\n').every((l) => l.trim() === '' || /^\s*export\b.*\bfrom\b/.test(l));
};

const unwired = files
  .filter((f) => /\.(m?jsx?|css)$/.test(f) && !reached.has(f))
  .map((f) => ({ file: rel(f), lines: lineCount(f), shim: isShim(f) }))
  .sort((a, b) => a.file.localeCompare(b.file));

const report = {
  entry: rel(ENTRY),
  totals: {
    files: files.length,
    live: reached.size,
    liveJsLines: [...reached].filter((f) => /\.m?jsx?$/.test(f)).reduce((n, f) => n + lineCount(f), 0),
    liveCssLines: [...reached].filter((f) => f.endsWith('.css')).reduce((n, f) => n + lineCount(f), 0),
    unwiredCode: unwired.filter((u) => !u.file.endsWith('.css')).length,
    unwiredCss: unwired.filter((u) => u.file.endsWith('.css')).length,
  },
  unwired,
  unresolved,
  warnings,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const t = report.totals;
  console.log(`src/ walked from ${report.entry}`);
  console.log(`  ${t.files} files · ${t.live} live (${t.liveJsLines} JS/JSX lines, ${t.liveCssLines} CSS lines) · ${t.unwiredCode} unwired code · ${t.unwiredCss} unwired css`);
  for (const [title, pick] of [['Unwired code', (u) => !u.file.endsWith('.css')], ['Unwired css', (u) => u.file.endsWith('.css')]]) {
    console.log(`\n${title}:`);
    for (const u of unwired.filter(pick)) console.log(`  ${u.file}  (${u.lines}L${u.shim ? ', re-export shim' : ''})`);
  }
  if (unresolved.length) console.log(`\nUnresolved relative imports (${unresolved.length}):\n  ${unresolved.join('\n  ')}`);
  if (warnings.length) console.log(`\nWarning — dynamic imports this script can't follow:\n  ${warnings.join('\n  ')}`);
}
