// One-time migration: downloads every PDF and image from the old Weebly site
// into ./content and ./public/img, using the folder layout the new site expects.
//   npm run migrate        (needs Node 18+)
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://coptic-hymn.weebly.com/uploads/1/5/4/0/154036384/';
const drive = id => `https://drive.google.com/file/d/${id}/view?usp=sharing`;
const failed = [];

async function save(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) return;
  if (process.env.DRY) return writeFileSync(dest, '%PDF-1.4\n');
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    console.log('ok  ', dest.replace(root, ''));
  } catch (e) { failed.push(`${url}  (${e.message})`); }
}
const writeJson = (dir, o) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, '_section.json'), JSON.stringify(o, null, 2)); };

// item = [ "English - Arabic", file | [[label, file], ...], { "Label": url } ]
const SECTIONS = [
  { dir: '01_vespers', meta: { title: 'Vespers', titleAr: 'عشية', image: '/img/vespers.png' }, items: [
    ['Intro to Doxologies - مقدمة الذوكصولوجيات', 'intro_to_doxologies__%D9%85%D9%82%D8%AF%D9%85%D8%A9_%D8%A7%D9%84%D8%B0%D9%88%D9%83%D8%B5%D9%88%D9%84%D9%88%D8%AC%D9%8A%D8%A7%D8%AA_251220_122155.pdf'],
    ['St. Mary Doxology - ذوكصولوجية للسيدة العذراء', '%D8%B0%D9%88%D9%83%D8%B5%D9%88%D9%84%D9%88%D8%AC%D9%8A%D8%A9_%D9%84%D9%84%D8%B3%D9%8A%D8%AF%D8%A9_%D8%A7%D9%84%D8%B9%D8%B0%D8%B1%D8%A7%D8%A1_%D8%AA%D9%82%D8%A7%D9%84_%D9%81%D9%8A_%D8%B1%D9%81%D8%B9_%D8%A8%D8%AE%D9%88%D8%B1_%D8%B9%D8%B4%D9%8A%D8%A9_251219_185505.pdf'],
    ['Doxologies Conclusion - ختام الذوكصولوجيات', 'conclusion_of_doxologies__%D8%AE%D8%AA%D8%A7%D9%85_%D8%A7%D9%84%D8%B0%D9%88%D9%83%D8%B5%D9%88%D9%84%D9%88%D8%AC%D9%8A%D8%A7%D8%AA_251222_153111.pdf']
  ] },
  { dir: '02_midnight-praises', meta: { title: 'Midnight Praises', titleAr: 'تسبحة', image: '/img/midnight-praises.jpg' }, items: [
    ['Tentheno - تين ثينو', 'tentheno_-_%D8%AA%D9%8A%D9%86_%D8%AB%D9%8A%D9%86%D9%88.pdf'],
    ['First Hos - الهوس الأول', '%D8%A7%D9%84%D9%87%D9%88%D8%B3_%D8%A7%D9%84%D8%A3%D9%88%D9%84_-_first_hos.pdf'],
    ['Khen Oushot - خين اوشوت', 'khen_oushot__%D8%AE%D9%8A%D9%86_%D8%A7%D9%88%D8%B4%D9%88%D8%AA__251218_165327.pdf'],
    ['Second Hos - الهوس الثاني', 'second_hos__%D8%A7%D9%84%D9%87%D9%88%D8%B3_%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A_251219_165407-compressed.pdf'],
    ['Maren Ouonh - مارين اوؤنه', 'maren_ouonh__%D9%85%D8%A7%D8%B1%D9%8A%D9%86_%D8%A7%D9%88%D8%A4%D9%86%D9%87_251220_134440.pdf'],
    ['Third Hos - الهوس الثالث', 'third_hos___%D8%A7%D9%84%D9%87%D9%88%D8%B3_%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB.pdf'],
    ['St. Mary Doxology - ذوكصولوجية للسيدة العذراء', '%D8%B0%D9%88%D9%83%D8%B5%D9%88%D9%84%D9%88%D8%AC%D9%8A%D8%A9_%D9%84%D9%84%D8%B9%D8%B0%D8%B1%D8%A7%D8%A1_%D8%AA%D8%B3%D8%A8%D8%AD%D8%A9_%D9%86%D8%B5%D9%81_%D8%A7%D9%84%D9%84%D9%8A%D9%84__st_mary_dox_251219_214149.pdf']
  ] },
  { dir: '03_matins', meta: { title: 'Matins', titleAr: 'باكر', image: '/img/matins.jpg' }, items: [
    ['Intro to Doxologies - مقدمة الذوكصولوجيات', 'intro_to_doxologies__%D9%85%D9%82%D8%AF%D9%85%D8%A9_%D8%A7%D9%84%D8%B0%D9%88%D9%83%D8%B5%D9%88%D9%84%D9%88%D8%AC%D9%8A%D8%A7%D8%AA_251220_122156.pdf'],
    ['St. Mary Doxology - ذوكصولوجية للسيدة العذراء', 'st_mary_matins__%D8%B0%D9%88%D9%83%D8%B5%D9%88%D9%84%D9%88%D8%AC%D9%8A%D8%A9_%D8%A7%D9%84%D8%B9%D8%AF%D8%B1%D8%A7_%D8%A8%D8%A7%D9%83%D8%B1_251222_132621.pdf'],
    ['Doxologies Conclusion - ختام الذوكصولوجيات', 'conclusion_of_doxologies__%D8%AE%D8%AA%D8%A7%D9%85_%D8%A7%D9%84%D8%B0%D9%88%D9%83%D8%B5%D9%88%D9%84%D9%88%D8%AC%D9%8A%D8%A7%D8%AA_251222_153112.pdf']
  ] },
  { dir: '04_liturgy', meta: { title: 'Liturgy', titleAr: 'قداس', image: '/img/liturgy.png', links: [{ label: 'Deacon Responses | مردات', url: '/deacon-responses/' }] }, subs: [
    { dir: '01_offering-of-the-lamb', meta: { title: 'Offering of the Lamb', titleAr: 'تقديم الحمل' }, items: [
      ['Ten Ouosht - تين اوؤشت', '%D8%AA%D9%8A%D9%86_%D8%A7%D9%88%D8%A4%D8%B4%D8%AA__ten_ouosht_251220_181809.pdf'],
      ['Shere Maria - شيري ماريا', 'shere_maria__%D8%B4%D9%8A%D8%B1%D9%8A_%D9%85%D8%A7%D8%B1%D9%8A%D8%A7_251218_161119.pdf'],
      ['Epouro - إبؤرو', 'epouro__%D8%A5%D8%A8%D8%A4%D8%B1%D9%88_251220_160032.pdf'],
      ['Alleluia Fai bepi - الليلويا فاي بيبي', 'alleluia_fai_bepi__%D8%A7%D9%84%D9%84%D9%8A%D9%84%D9%88%D9%8A%D8%A7_%D9%81%D8%A7%D9%8A_%D8%A8%D9%8A%D8%A8%D9%8A_251229_164212.pdf'],
      ['Alleluia Je-efmevi - الليلويا جي إفميفي', 'alleluia_je-efmevi__%D8%A7%D9%84%D9%84%D9%8A%D9%84%D9%88%D9%8A%D8%A7_%D8%AC%D9%8A_%D8%A5%D9%81%D9%85%D9%8A%D9%81%D9%8A_251220_161652.pdf'],
      ['Zoxa Batri - ذوكساباتري', 'zoxa_batri__%D8%B0%D9%88%D9%83%D8%B3%D8%A7%D8%A8%D8%A7%D8%AA%D8%B1%D9%8A_251220_162300.pdf']
    ] },
    { dir: '02_liturgy-of-the-word', meta: { title: 'Liturgy of the Word', titleAr: 'قداس الكلمة' }, items: [
      ['Tai Shouri - طاي شوري', 'tai_shouri__%D8%B7%D8%A7%D9%8A_%D8%B4%D9%88%D8%B1%D9%8A_251229_163146.pdf'],
      ['Tee-shouri - تي شوري', 'tee-shouri__%D8%AA%D9%8A_%D8%B4%D9%88%D8%B1%D9%8A_251220_164515.pdf'],
      ['Hitens - الهيتينيات', 'hitens__%D8%A7%D9%84%D9%87%D9%8A%D8%AA%D9%8A%D9%86%D9%8A%D8%A7%D8%AA_251220_165903.pdf'],
      ['Pi-ehmot Ghar - بي إهموت غار', 'pi-ehmot_gar__%D8%A8%D9%8A_%D8%A5%D9%87%D9%85%D9%88%D8%AA_%D8%BA%D8%A7%D8%B1_251220_170823.pdf'],
      ['Apetjeek Evol - ابيتجيك إيفول', 'apetjeek_evol__%D8%A7%D8%A8%D9%8A%D8%AA%D8%AC%D9%8A%D9%83_%D8%A5%D9%8A%D9%81%D9%88%D9%84_251230_001806.pdf'],
      ['Praxis Response - مرد الابركسيس', 'praxis_response__%D9%85%D8%B1%D8%AF_%D8%A7%D9%84%D8%A7%D8%A8%D8%B1%D9%83%D8%B3%D9%8A%D8%B3_251230_003640.pdf'],
      ['Agios - آجيوس', 'agios__%D8%A2%D8%AC%D9%8A%D9%88%D8%B3_251230_005525.pdf']
    ] },
    { dir: '03_liturgy-of-the-faithful', meta: { title: 'Liturgy of the Faithful', titleAr: 'قداس المؤمنين' }, items: [
      ['افرحي يا مريم - Ⲟⲩⲛⲟϥ', [['Ⲟⲩⲛⲟϥ', '%D8%A7%D9%81%D8%B1%D8%AD%D9%8A_%D9%8A%D8%A7_%D9%85%D8%B1%D9%8A%D9%85__%E2%B2%9E%E2%B2%A9%E2%B2%9B%E2%B2%9F%CF%A5_260711_175904.pdf'], ['افرحي يا مريم', '%D8%A7%D9%81%D8%B1%D8%AD%D9%8A_%D9%8A%D8%A7_%D9%85%D8%B1%D9%8A%D9%85.pdf']]],
      ['لحن انا اعرف - ϯⲥⲱⲟⲩⲛ', '%D9%84%D8%AD%D9%86_%D8%A7%D9%86%D8%A7_%D8%A7%D8%B9%D8%B1%D9%81_%CF%AF%E2%B2%A5%E2%B2%B1%E2%B2%9F%E2%B2%A9%E2%B2%9B.pdf'],
      ['ايها الرب - Ⲡ̀ϭⲟⲓⲥ', '%D8%A7%D9%8A%D9%87%D8%A7_%D8%A7%D9%84%D8%B1%D8%A8__%E2%B2%A0%CC%80%CF%AD%E2%B2%9F%E2%B2%93%E2%B2%A5_260711_151559.pdf'],
      ['Amen Amen Amen - آمين آمين آمين', 'amen_amen_amen__%D8%A2%D9%85%D9%8A%D9%86_%D8%A2%D9%85%D9%8A%D9%86_%D8%A2%D9%85%D9%8A%D9%86_260713_225854.pdf'],
      ['Psalm 150 - مزمور ١٥٠', 'psalm_150_-_hazzat_260718_155529.pdf'],
      ['Piwik - Ⲡⲓⲱⲓⲕ', 'piwik_-_hazzat.pdf']
    ] }
  ] },
  { dir: '05_deacon-responses', meta: { title: 'Deacon Responses', titleAr: 'مردات', image: '/img/deacon.jpg' }, items: [
    ['Thanksgiving Prayer - صلاة الشكر', 'thanksgiving_prayer__%D8%B5%D9%84%D8%A7%D8%A9_%D8%A7%D9%84%D8%B4%D9%83%D8%B1_251230_012919.pdf', { Recording: drive('1mCLOPj3X03KxeYbJK0dNyoCzJubEYUn6') }],
    ['Litany of The Departed - اوشية الراقدين', 'litany_of_the_departed__%D8%A7%D9%88%D8%B4%D9%8A%D8%A9_%D8%A7%D9%84%D8%B1%D8%A7%D9%82%D8%AF%D9%8A%D9%86_251230_014503.pdf', { Recording: drive('1zpYdgQPDanOGW433G3OAhOsKFv5Jzd_y') }],
    ['Litany of The Sick - اوشية المرضى', 'litany_of_the_sick__%D8%A7%D9%88%D8%B4%D9%8A%D8%A9_%D8%A7%D9%84%D9%85%D8%B1%D8%B6%D9%89__251230_014957.pdf', { Recording: drive('1PqqQnBAlro4aLRXP0MM7Nt1UhNqOAkUu') }],
    ['Litany of The Travelers - اوشية المسافرين', 'litany_of_the_travelers__%D8%A7%D9%88%D8%B4%D9%8A%D8%A9_%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D9%81%D8%B1%D9%8A%D9%86_251230_015831.pdf', { Recording: drive('1rM--zp_O31ObbBamga5ZquqzvoHWYWnf') }],
    ['Litany of the Oblations - اوشية القرابين', 'litany_of_the_oblations__%D8%A7%D9%88%D8%B4%D9%8A%D8%A9_%D8%A7%D9%84%D9%82%D8%B1%D8%A7%D8%A8%D9%8A%D9%86_251230_020214.pdf', { Recording: drive('1vj-gxyObAHVrshxd0ifcgwO-BfrdjTzj') }],
    ['Litany of The Gospel - اوشية الانجيل', 'litany_of_the_gospel__%D8%A7%D9%88%D8%B4%D9%8A%D8%A9_%D8%A7%D9%84%D8%A7%D9%86%D8%AC%D9%8A%D9%84_251230_021902.pdf']
  ] },
  // These two PDFs had no title on the Weebly page; titles taken from their file names.
  { dir: '06_doxologies', meta: { title: 'Doxologies', titleAr: 'الذوكصولوجيات' }, items: [
    ['St. Mary Doxology - ذوكصولوجية للسيدة العذراء', '%D8%B0%D9%88%D9%83%D8%B5%D9%88%D9%84%D9%88%D8%AC%D9%8A%D8%A9_%D9%84%D9%84%D8%B9%D8%B0%D8%B1%D8%A7%D8%A1_%D8%AA%D8%B3%D8%A8%D8%AD%D8%A9_%D9%86%D8%B5%D9%81_%D8%A7%D9%84%D9%84%D9%8A%D9%84__st_mary_dox_251219_214150.pdf'],
    ['Tentheno - تين ثينو', 'tentheno_-_%D8%AA%D9%8A%D9%86_%D8%AB%D9%8A%D9%86%D9%88_1.pdf']
  ] }
];

const IMAGES = [
  ['published/coptic-hymns-library.png', 'logo.png'],
  ['published/vespers.png', 'vespers.png'],
  ['editor/midnight-praises.jpg', 'midnight-praises.jpg'],
  ['published/matins.jpg', 'matins.jpg'],
  ['editor/liturgy.png', 'liturgy.png'],
  ['published/deacon.jpg', 'deacon.jpg']
];

async function items(dir, list) {
  for (const [i, [title, file, extra = {}]] of list.entries()) {
    const name = String(i + 1).padStart(2, '0') + '_' + title;
    const files = Array.isArray(file) ? file : [['', file]];
    for (const [label, f] of files) await save(BASE + f, join(dir, name + (label ? '~' + label : '') + '.pdf'));
    for (const [label, url] of Object.entries(extra)) writeFileSync(join(dir, `${name}~${label}.url`), url);
  }
}

for (const s of SECTIONS) {
  const dir = join(root, 'content', s.dir);
  writeJson(dir, s.meta);
  if (s.items) await items(dir, s.items);
  for (const sub of s.subs || []) {
    const subDir = join(dir, sub.dir);
    writeJson(subDir, sub.meta);
    await items(subDir, sub.items);
  }
}
for (const [src, dest] of IMAGES) await save(BASE + src, join(root, 'public', 'img', dest));

console.log(failed.length ? `\n${failed.length} download(s) failed:\n` + failed.join('\n') : '\nAll files downloaded.');
