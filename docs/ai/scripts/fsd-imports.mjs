#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, relative, dirname, extname, sep } from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const ROOT = process.cwd();
const srcAbs = resolve(ROOT, opt('src', 'src'));
const OUT = resolve(ROOT, opt('out', 'docs/ai/reports/generated'));

const RANK = { shared: 1, entities: 2, features: 3, widgets: 4, pages: 5, processes: 5.5, app: 6 };
const SLICED = new Set(['entities', 'features', 'widgets', 'pages', 'processes']);
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

const walk = (d, o = []) => {
  for (const n of readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p, o) : EXT.has(extname(p)) && o.push(p);
  }
  return o;
};
const stripExt = (p) => p.replace(/\.(d\.)?(tsx?|jsx?|mjs|cjs)$/, '');
const readJsonc = (p) => {
  try {
    const t = readFileSync(p, 'utf8')
      .replace(/("(?:\\.|[^"\\])*")|\/\/.*|\/\*[\s\S]*?\*\//g, (m, s) => s || '')
      .replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(t);
  } catch { return null; }
};

function loadAliases() {
  const list = [];
  const manual = opt('alias', null);
  if (manual) for (const a of manual.split(',')) { const [k, v] = a.split('='); list.push([k, resolve(ROOT, v)]); }
  for (const f of ['tsconfig.json', 'tsconfig.app.json', 'jsconfig.json']) {
    const co = readJsonc(join(ROOT, f))?.compilerOptions;
    if (!co?.paths) continue;
    const base = resolve(ROOT, co.baseUrl ?? '.');
    for (const [k, v] of Object.entries(co.paths)) list.push([k.replace(/\*$/, ''), resolve(base, v[0].replace(/\*$/, ''))]);
  }
  const fallback = !list.length;
  if (fallback) list.push(['@/', srcAbs]);
  return { list: list.sort((a, b) => b[0].length - a[0].length), fallback };
}
const { list: ALIASES, fallback } = loadAliases();

const resolveSpec = (file, raw) => {
  const spec = raw.split('?')[0];
  if (spec.startsWith('.')) return resolve(dirname(file), spec);
  for (const [k, dir] of ALIASES) if (spec === k.replace(/\/$/, '') || spec.startsWith(k)) return join(dir, spec.slice(k.length));
  return null;
};
const pkgName = (s) => (s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]);

function locate(absNoExt, isSource = false) {
  const parts = relative(srcAbs, absNoExt).split(sep);
  if (parts[0].startsWith('..') || parts.length < 2) return null;
  const layer = parts[0];
  if (!(layer in RANK)) return { layer, slice: null, rest: parts.slice(1), id: `?${layer}`, rank: -1 };
  if (!SLICED.has(layer)) return { layer, slice: null, rest: parts.slice(1), id: layer, rank: RANK[layer] };
  if (parts.length === 2 && isSource) return { layer, slice: '(root)', rest: parts.slice(1), id: `${layer}/(root)`, rank: RANK[layer] };
  return { layer, slice: parts[1], rest: parts.slice(2), id: `${layer}/${parts[1]}`, rank: RANK[layer] };
}

const RE = /(?:import|export)\s+(type\s+)?(?:[^'"`;]*?\sfrom\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
const files = walk(srcAbs);
const nodes = {};
const node = (l) => (nodes[l.id] ??= { id: l.id, layer: l.layer, slice: l.slice, rank: l.rank, files: 0, segments: new Set(), hasPublicApi: false, fanIn: new Set(), fanOut: new Set() });
const edges = {};
const violations = [];
const externals = {};

for (const f of files) {
  const from = locate(stripExt(f), true);
  const rel = relative(ROOT, f).split(sep).join('/');
  if (from) {
    const n = node(from);
    n.files++;
    if (from.rest.length > 1) n.segments.add(from.rest[0]);
    if (from.rest.length === 1 && from.rest[0] === 'index') n.hasPublicApi = true;
  }
  const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const m of code.matchAll(RE)) {
    const typeOnly = !!m[1];
    const spec = m[2] ?? m[3];
    const abs = resolveSpec(f, spec);
    if (!abs) {
      if (from) { const e = (externals[from.layer] ??= {}); e[pkgName(spec)] = (e[pkgName(spec)] || 0) + 1; }
      continue;
    }
    const to = locate(stripExt(abs));
    if (!from || !to || from.id === to.id) continue;
    node(to);
    const key = `${from.id} -> ${to.id}`;
    const e = (edges[key] ??= { from: from.id, to: to.id, count: 0, typeOnly: 0 });
    e.count++; if (typeOnly) e.typeOnly++;
    nodes[from.id].fanOut.add(to.id); nodes[to.id].fanIn.add(from.id);
    const v = (kind, note) => violations.push({ kind, from: rel, to: `${to.id}/${to.rest.join('/')}`.replace(/\/$/, ''), spec, note });
    const viaX = to.rest[0] === '@x';
    if (to.layer === 'processes') v('deprecated-layer', 'processes layer is deprecated');
    if (to.rank > from.rank) v('layer-upward', `${from.layer} imports from the higher-level ${to.layer}`); 
    else if (to.rank === from.rank && SLICED.has(to.layer) && !viaX) v('cross-slice', `slices of the same layer (${to.layer}) import each other`); 
    if (SLICED.has(to.layer) && to.rest.length && !(to.rest.length === 1 && to.rest[0] === 'index') && !viaX)
    v('non-public-api', 'import bypassing index (slice Public API)');
  }
}

const adj = Object.fromEntries(Object.values(nodes).map((n) => [n.id, [...n.fanOut]]));
let idx = 0; const st = [], on = new Set(), I = {}, L = {}, cycles = [];
const dfs = (v) => {
  I[v] = L[v] = idx++; st.push(v); on.add(v);
  for (const w of adj[v] ?? []) { if (I[w] === undefined) { dfs(w); L[v] = Math.min(L[v], L[w]); } else if (on.has(w)) L[v] = Math.min(L[v], I[w]); }
  if (L[v] === I[v]) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1) cycles.push(c.sort()); }
};
for (const v of Object.keys(adj)) if (I[v] === undefined) dfs(v);

const sl = Object.values(nodes)
  .map((n) => ({ ...n, segments: [...n.segments].sort(), fanIn: n.fanIn.size, fanOut: n.fanOut.size }))
  .sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id));
const edgeList = Object.values(edges).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
const byKind = violations.reduce((a, v) => ((a[v.kind] = (a[v.kind] || 0) + 1), a), {});

mkdirSync(OUT, { recursive: true });
writeFileSync(
  join(OUT, 'imports.json'),
  JSON.stringify({ aliases: ALIASES.map(([k, d]) => [k, relative(ROOT, d)]), aliasFallback: fallback, slices: sl, edges: edgeList, cycles, violations, externalsByLayer: externals }, null, 2),
);

const layerEdges = {};
for (const e of edgeList) {
  const a = e.from.split('/')[0], b = e.to.split('/')[0];
  if (a !== b) layerEdges[`${a}|${b}`] = (layerEdges[`${a}|${b}`] || 0) + e.count;
}
const md = [];
md.push('# Auto-scanning imports (generated by fsd-imports.mjs)', '');
md.push(`Files scanned: ${files.length}. Aliases: ${ALIASES.map(([k, d]) => `\`${k}\`→\`${relative(ROOT, d) || '.'}\``).join(', ')}${fallback ? ' (**FALLBACK: paths not found in tsconfig; check aliases in vite.config!**)' : ''}`, '');
md.push('## Slices', '', '| id | files | segments | Public API (index) | fan-in | fan-out |', '|---|---|---|---|---|---|');
for (const n of sl) md.push(`| ${n.id} | ${n.files} | ${n.segments.join(', ') || '-'} | ${SLICED.has(n.layer) ? (n.hasPublicApi ? 'yes' : '**NO**') : 'n/a'} | ${n.fanIn} | ${n.fanOut} |`);
md.push('', '## Violations', '', Object.keys(byKind).length ? Object.entries(byKind).map(([k, c]) => `- ${k}: ${c}`).join('\n') : 'None found.');
if (cycles.length) md.push('', '## Cycles between slices', '', ...cycles.map((c) => `- ${c.join(' <-> ')}`));
for (const k of Object.keys(byKind)) {
md.push('', `### ${k}`, '', '| from (file) | to | import |', '|---|---|---|'); 
for (const v of violations.filter((x) => x.kind === k)) md.push(`| ${v.from} | ${v.to} | \`${v.spec}\` |`); }
md.push('', '## Layer graph (import count)', '', '```mermaid', 'graph TD', ...Object.entries(layerEdges).map(([k, c]) => { const [a, b] = k.split('|'); return `  ${a} -->|${c}| ${b}`; }), '```');
if (edgeList.length <= 80) md.push('', '## Slice graph', '', '```mermaid', 'graph LR', ...edgeList.map((e) => `  ${e.from.replace(/\W/g, '_')}["${e.from}"] --> ${e.to.replace(/\W/g, '_')}["${e.to}"]`), '```');
else md.push('', `Slice graph not drawn: ${edgeList.length} edges (exceeds 80). Data in imports.json; visualize by layer.`);
writeFileSync(join(OUT, 'slices.md'), md.join('\n') + '\n');
console.log(`OK: ${files.length} files, ${sl.length} slices, ${edgeList.length} edges, violations: ${violations.length}, cycles: ${cycles.length}. Report: ${relative(ROOT, OUT)}/`);