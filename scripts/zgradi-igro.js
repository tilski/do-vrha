// Zgradi igro iz mape igra/ v obliko, ki jo aplikacija lahko naloži.
// Zaženi: npm run igra
//
// Vprašanja niso več v kodi – igra jih ob zagonu naloži iz Supabase (glej supabase/shema.sql).
// Sem se vgradita samo naslov baze in javni ključ iz .env.
const fs = require('fs');
const path = require('path');
const beriEnv = require('./env');

const koren = path.join(__dirname, '..');
const igra = (f) => path.join(koren, 'igra', f);

const env = beriEnv();
const url = env.EXPO_PUBLIC_SUPABASE_URL || '';
const kljuc = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
if (!url || !kljuc) console.warn('Opozorilo: v .env manjka EXPO_PUBLIC_SUPABASE_URL ali EXPO_PUBLIC_SUPABASE_ANON_KEY – igra ne bo mogla naložiti vprašanj.');
const supa = url && kljuc ? JSON.stringify({ url: url.replace(/\/$/, ''), key: kljuc }) : 'null';

const src = fs.readFileSync(igra('src.html'), 'utf8');
if (!src.includes('/*SUPA*/null')) throw new Error('igra/src.html: manjka oznaka /*SUPA*/null');
const png = (f) => 'data:image/png;base64,' + fs.readFileSync(igra(f)).toString('base64');
let html = src.replace('/*SUPA*/null', () => supa);
fs.writeFileSync(igra('index.html'), html); // za zagon v brskalniku
html = html.replace("'dem_core.png'", `'${png('dem_core.png')}'`).replace("'dem_ring.png'", `'${png('dem_ring.png')}'`);
fs.mkdirSync(path.join(koren, 'assets/igra'), { recursive: true });
fs.writeFileSync(
  path.join(koren, 'assets/igra/igra-html.ts'),
  '// SAMODEJNO ZGRAJENO s scripts/zgradi-igro.js – ne urejaj ročno\nconst igraHtml: string = ' + JSON.stringify(html) + ';\nexport default igraHtml;\n'
);

console.log(`Igra zgrajena: ${(html.length / 1e6).toFixed(2)} MB · baza: ${url || '(ni nastavljena)'}`);
