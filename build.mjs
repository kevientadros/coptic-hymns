// Builds the static site into ./dist from ./content (folders + PDFs) and ./public.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const contentDir = join(root, 'content');
const out = join(root, 'dist');
const site = JSON.parse(readFileSync(join(root, 'site.json'), 'utf8'));

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stripOrder = s => s.replace(/^\d+_/, '');
const orderOf = s => { const m = s.match(/^(\d+)_/); return m ? +m[1] : Infinity; };
const byOrder = (a, b) => orderOf(a) - orderOf(b) || a.localeCompare(b, 'en', { numeric: true });
const readJson = p => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {});
const prettify = s => stripOrder(s).replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const isLink = ext => ext === '.url' || ext === '.link';
const ext_ = href => (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '');

// ---- read content -------------------------------------------------------
function readItems(dir, rel) {
  const groups = new Map();
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isFile() || e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const ext = extname(e.name).toLowerCase();
    if (!ext) continue;
    const stem = e.name.slice(0, -ext.length);
    const i = stem.lastIndexOf('~');
    const base = i < 0 ? stem : stem.slice(0, i);
    const label = i < 0 ? '' : stem.slice(i + 1);
    const key = stripOrder(base);
    const g = groups.get(key) || { title: key, order: Infinity, files: [] };
    g.order = Math.min(g.order, orderOf(base));

    let href;
    if (isLink(ext)) {
      href = (readFileSync(join(dir, e.name), 'utf8').match(/https?:\/\/\S+/) || [''])[0];
      if (!href) continue;
    } else {
      const parts = [...rel.map(stripOrder), stripOrder(e.name)];
      mkdirSync(join(out, 'files', ...parts.slice(0, -1)), { recursive: true });
      copyFileSync(join(dir, e.name), join(out, 'files', ...parts));
      href = '/files/' + parts.map(encodeURIComponent).join('/');
    }
    g.files.push({ href, primary: !label, label: label || (isLink(ext) ? 'Link' : ext.slice(1).toUpperCase()) });
    groups.set(key, g);
  }
  for (const g of groups.values()) g.files.sort((a, b) => b.primary - a.primary || a.label.localeCompare(b.label));
  return [...groups.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'en', { numeric: true }));
}

function readSection(dirName) {
  const dir = join(contentDir, dirName);
  const meta = readJson(join(dir, '_section.json'));
  const subs = readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name).sort(byOrder);
  return {
    slug: stripOrder(dirName), dirName,
    title: meta.title || prettify(dirName), titleAr: meta.titleAr || '', image: meta.image || '', links: meta.links || [],
    items: readItems(dir, [dirName]),
    groups: subs.map(s => {
      const m = readJson(join(dir, s, '_section.json'));
      return { dirName: `${dirName}/${s}`, title: m.title || prettify(s), titleAr: m.titleAr || '', items: readItems(join(dir, s), [dirName, s]) };
    })
  };
}

// ---- html ---------------------------------------------------------------
const bilingual = (en, ar) => (ar ? `<bdi>${esc(en)}</bdi> <i>|</i> <bdi>${esc(ar)}</bdi>` : `<bdi>${esc(en)}</bdi>`);
const titleHtml = t => { const i = t.indexOf(' - '); return i < 0 ? `<bdi>${esc(t)}</bdi>` : bilingual(t.slice(0, i), t.slice(i + 3)); };

const itemHtml = g => `<li class="item"><a class="t" href="${esc((g.files.find(f => f.primary) || g.files[0]).href)}"${ext_((g.files.find(f => f.primary) || g.files[0]).href)}>${titleHtml(g.title)}</a><span class="chips">${g.files.map(f => `<a href="${esc(f.href)}"${ext_(f.href)}>${esc(f.label)}</a>`).join('')}</span></li>`;
const listHtml = items => (items.length ? `<ul class="list">${items.map(itemHtml).join('')}</ul>` : '');

const page = (title, body, sections, active = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta property="og:title" content="${esc(title)}"><link rel="icon" href="${site.logo}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Noto+Naskh+Arabic:wght@400;600&family=Noto+Sans+Coptic&display=swap">
<link rel="stylesheet" href="/style.css"></head><body>
<header class="site"><div class="wrap top"><a class="brand" href="/"><img src="${site.logo}" alt="${esc(site.title)}"></a>
<nav aria-label="Sections"><a href="/"${active === '' ? ' aria-current="page"' : ''}>Home</a>${sections.map(s => `<a href="/${s.slug}/"${active === s.slug ? ' aria-current="page"' : ''}>${esc(s.title)}</a>`).join('')}</nav></div></header>
${body}
<footer class="wrap">${site.links.map(l => `<a href="${esc(l.url)}"${ext_(l.url)}>${esc(l.label)}</a>`).join('')}</footer></body></html>`;

// ---- build --------------------------------------------------------------
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
if (existsSync(join(root, 'public'))) cpSync(join(root, 'public'), out, { recursive: true });
if (!existsSync(contentDir)) mkdirSync(contentDir);

const sections = readdirSync(contentDir, { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name).sort(byOrder).map(readSection);
const write = (p, html) => { mkdirSync(dirname(join(out, p)), { recursive: true }); writeFileSync(join(out, p), html); };

write('index.html', page(site.title, `<main class="wrap"><h1 class="sr">${esc(site.title)}</h1><div class="tiles">${sections.map(s => `<a class="tile" href="/${s.slug}/">${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy">` : `<div class="ph" aria-hidden="true">${esc(s.title[0])}</div>`}<h2>${bilingual(s.title, s.titleAr)}</h2></a>`).join('')}</div></main>`, sections));

for (const s of sections) {
  const body = `<main class="wrap"><h1>${bilingual(s.title, s.titleAr)}</h1>
${s.links.length ? `<p class="related">${s.links.map(l => `<a href="${esc(l.url)}"${ext_(l.url)}>${esc(l.label)}</a>`).join('')}</p>` : ''}
${listHtml(s.items)}
${s.groups.map(g => `<section><h2>${bilingual(g.title, g.titleAr)}</h2>${listHtml(g.items)}</section>`).join('\n')}</main>`;
  write(`${s.slug}/index.html`, page(`${s.title} - ${site.title}`, body, sections, s.slug));
}

// list of upload targets for /admin
const targets = sections.flatMap(s => (s.groups.length ? s.groups.map(g => ({ path: g.dirName, label: `${s.title} › ${g.title}` })) : [{ path: s.dirName, label: s.title }]));
write('sections.json', JSON.stringify(targets));

const count = sections.reduce((n, s) => n + s.items.length + s.groups.reduce((m, g) => m + g.items.length, 0), 0);
console.log(`Built ${sections.length} sections, ${count} items -> dist/`);
