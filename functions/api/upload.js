// Cloudflare Pages Function: POST /api/upload
// Commits an uploaded file (and optional link) into content/<section>/ on GitHub.
// Env vars (Pages > Settings > Variables and Secrets): ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO ("owner/repo"), GITHUB_BRANCH (optional, default "main")

const MAX_BYTES = 24 * 1024 * 1024; // Cloudflare Pages limit is 25 MiB per file
const enc = new TextEncoder();
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
const clean = s => String(s || '').replace(/[\\/:*?"<>|~\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim();

function same(a, b) {
  const x = enc.encode(a), y = enc.encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}
function b64(buf) {
  const u = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
const gh = (env, path, init = {}) =>
  fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'hymns-uploader', ...init.headers }
  });
const put = (env, path, content, message) =>
  gh(env, path, { method: 'PUT', body: JSON.stringify({ message, content, branch: env.GITHUB_BRANCH || 'main' }) });

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  if (!env.ADMIN_PASSWORD || !same(String(form.get('password') || ''), env.ADMIN_PASSWORD)) return json({ error: 'Wrong password.' }, 401);
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json({ error: 'GITHUB_TOKEN or GITHUB_REPO is not set in Cloudflare.' }, 500);

  const section = String(form.get('section') || '');
  if (!/^[\w-]+(\/[\w-]+)?$/.test(section)) return json({ error: 'Invalid section.' }, 400);

  const en = clean(form.get('title_en')), ar = clean(form.get('title_ar'));
  const name = en && ar ? `${en} - ${ar}` : en || ar;
  if (!name) return json({ error: 'Enter a title.' }, 400);

  const file = form.get('file');
  const ext = file && file.name ? (file.name.match(/\.(pdf|mp3|m4a|png|jpe?g)$/i) || [])[0] : '';
  if (!ext) return json({ error: 'Choose a PDF, MP3, M4A, PNG or JPG file.' }, 400);
  if (file.size > MAX_BYTES) return json({ error: 'File is over 24 MB. Host it elsewhere (e.g. Google Drive) and add it as a link.' }, 400);

  // next order number in this folder
  const list = await gh(env, `content/${section}`);
  if (!list.ok) return json({ error: `Section folder not found on GitHub (${list.status}).` }, 400);
  const nums = (await list.json()).map(f => +((f.name.match(/^(\d+)_/) || [])[1] || 0));
  const base = String(Math.max(0, ...nums) + 1).padStart(2, '0') + '_' + name;

  const r = await put(env, `content/${section}/${base}${ext.toLowerCase()}`, b64(await file.arrayBuffer()), `Add ${name}`);
  if (!r.ok) return json({ error: `GitHub rejected the upload (${r.status}). Check the token's permissions.` }, 502);

  const url = String(form.get('link_url') || '').trim();
  if (/^https?:\/\/\S+$/.test(url)) {
    const label = clean(form.get('link_label')) || 'Link';
    const r2 = await put(env, `content/${section}/${base}~${label}.url`, b64(enc.encode(url)), `Add ${label} link for ${name}`);
    if (!r2.ok) return json({ error: `File uploaded, but the link failed (${r2.status}).` }, 502);
  }
  return json({ ok: true });
}
