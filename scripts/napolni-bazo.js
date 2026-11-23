// Naloži vprašanja iz igra/baza/kategorije/*.json v Supabase.
//
//   npm run baza -- --suho   samo preveri datoteke, nič ne pošlje
//   npm run baza             preveri in naloži (potrebuje SUPABASE_SERVICE_ROLE_KEY v .env)
//
// Kategorije in vprašanja se posodobijo (upsert), odgovori naloženih vprašanj pa se zamenjajo
// s tistimi iz datotek. Vprašanj, ki obstajajo samo v bazi, skripta ne briše.
// POZOR: če si odgovore medtem urejal v Supabase, jih ta skripta prepiše z vsebino datotek.
const fs = require('fs');
const path = require('path');
const beriEnv = require('./env');

const suho = process.argv.includes('--suho');
const mapa = path.join(__dirname, '..', 'igra/baza/kategorije');

const norm = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- 1) preberi in preveri ----------
const kategorije = [];
const vprasanja = [];
const odgovori = [];
const napake = [];
const opozorila = [];
const naslovi = new Map();

for (const f of fs.readdirSync(mapa).filter((f) => f.endsWith('.json')).sort()) {
  const kid = f.replace(/\.json$/, '');
  let k;
  try {
    k = JSON.parse(fs.readFileSync(path.join(mapa, f), 'utf8'));
  } catch (e) {
    napake.push(`${f}: neveljaven JSON (${e.message})`);
    continue;
  }
  if (!k.kategorija || !Array.isArray(k.vprasanja)) {
    napake.push(`${f}: manjka "kategorija" ali "vprasanja"`);
    continue;
  }
  kategorije.push({ id: kid, ime: k.kategorija });
  if (k.vprasanja.length !== 20) opozorila.push(`${f}: ${k.vprasanja.length} vprašanj (cilj 20)`);

  for (const q of k.vprasanja) {
    const kje = `${f} › ${q.id}`;
    if (!q.id || !q.vprasanje || !q.namig) napake.push(`${kje}: manjka id, vprasanje ali namig`);
    if (!Array.isArray(q.odgovori) || q.odgovori.length < 10) napake.push(`${kje}: premalo odgovorov`);
    else if (q.odgovori.length < 20) opozorila.push(`${kje}: samo ${q.odgovori.length} odgovorov`);
    const t = norm(q.vprasanje || '');
    if (naslovi.has(t)) napake.push(`${kje}: enako vprašanje že v ${naslovi.get(t)}`);
    naslovi.set(t, kje);

    const vid = `${kid}-${q.id}`;
    vprasanja.push({
      id: vid,
      kategorija_id: kid,
      vprasanje: q.vprasanje,
      namig: q.namig,
      slovenija: !!q.slovenija,
      odstrani: q.odstrani || [],
      vrstni_red: vprasanja.length + 1, // enak vrstni red kot prej → enak dnevni izbor
      aktivno: true,
    });

    const videni = new Set();
    (q.odgovori || []).forEach((o, i) => {
      if (o.includes(';') || o.includes('?')) napake.push(`${kje}: nedovoljen znak v "${o}"`);
      const [odgovor, ...sopomenke] = o.split('|').map((s) => s.trim()).filter(Boolean);
      const ime = norm(odgovor || '');
      if (videni.has(ime)) napake.push(`${kje}: podvojen odgovor "${odgovor}"`);
      videni.add(ime);
      odgovori.push({ vprasanje_id: vid, rang: i + 1, odgovor, sopomenke });
    });
  }
}

if (opozorila.length) console.warn('Opozorila:\n  ' + opozorila.join('\n  '));
if (napake.length) {
  console.error('Napake v datotekah:\n  ' + napake.join('\n  '));
  process.exit(1);
}
const povzetek =
  `${kategorije.length} kategorij · ${vprasanja.length} vprašanj ` +
  `(${vprasanja.filter((v) => v.slovenija).length} Slovenija, ${vprasanja.filter((v) => !v.slovenija).length} svet) · ` +
  `${odgovori.length} odgovorov`;

if (suho) {
  console.log(`Datoteke so v redu: ${povzetek}. (--suho: nič ni bilo poslano)`);
  process.exit(0);
}

// ---------- 2) naloži v Supabase ----------
const env = beriEnv();
const URL = (env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const KLJUC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KLJUC) {
  console.error('V .env manjka EXPO_PUBLIC_SUPABASE_URL ali SUPABASE_SERVICE_ROLE_KEY (glej .env.example).');
  process.exit(1);
}

async function rest(metoda, pot, telo, prefer) {
  const r = await fetch(`${URL}/rest/v1/${pot}`, {
    method: metoda,
    headers: {
      apikey: KLJUC,
      // novi ključi (sb_secret_…) niso JWT – gredo samo v apikey; stari service_role tudi v Authorization
      ...(KLJUC.startsWith("sb_") ? {} : { Authorization: `Bearer ${KLJUC}` }),
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=minimal',
    },
    body: telo ? JSON.stringify(telo) : undefined,
  });
  if (!r.ok) throw new Error(`${metoda} ${pot.split('?')[0]}: ${r.status} ${await r.text()}`);
}
const kosi = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const upsert = 'resolution=merge-duplicates,return=minimal';

(async () => {
  await rest('POST', 'kategorije', kategorije, upsert);
  console.log(`✓ kategorije (${kategorije.length})`);
  for (const k of kosi(vprasanja, 500)) await rest('POST', 'vprasanja', k, upsert);
  console.log(`✓ vprašanja (${vprasanja.length})`);
  for (const k of kosi(vprasanja.map((v) => v.id), 100)) {
    const seznam = k.map((id) => `"${id}"`).join(',');
    await rest('DELETE', `odgovori?vprasanje_id=in.(${encodeURIComponent(seznam)})`);
  }
  let n = 0;
  for (const k of kosi(odgovori, 1000)) {
    await rest('POST', 'odgovori', k);
    n += k.length;
    process.stdout.write(`\r✓ odgovori (${n}/${odgovori.length})`);
  }
  console.log(`\nBaza naložena: ${povzetek}`);
})().catch((e) => {
  console.error('\nNalaganje ni uspelo:', e.message, e.cause ? '(' + (e.cause.code || e.cause.message) + ')' : '');
  process.exit(1);
});
