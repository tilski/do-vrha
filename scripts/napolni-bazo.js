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
// GET po straneh; manjkajoča tabela (npr. ai_sopomenke pred ai-preverjanje.sql) → prazno, če neobvezna
async function beri(pot, neobvezno) {
  const out = [];
  for (let i = 0; ; i += 1000) {
    const r = await fetch(`${URL}/rest/v1/${pot}`, {
      headers: { apikey: KLJUC, ...(KLJUC.startsWith('sb_') ? {} : { Authorization: `Bearer ${KLJUC}` }), Range: `${i}-${i + 999}` },
    });
    if (!r.ok) { if (neobvezno) return null; throw new Error(`GET ${pot.split('?')[0]}: ${r.status} ${await r.text()}`); }
    const kos = await r.json(); out.push(...kos); if (kos.length < 1000) return out;
  }
}
const kosi = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const upsert = 'resolution=merge-duplicates,return=minimal';

(async () => {
  await rest('POST', 'kategorije', kategorije, upsert);
  console.log(`✓ kategorije (${kategorije.length})`);
  for (const k of kosi(vprasanja, 500)) await rest('POST', 'vprasanja', k, upsert);
  console.log(`✓ vprašanja (${vprasanja.length})`);
  // Odgovori, ki jih je sprejel AI (vir 'ai'), ostanejo. Če je isti odgovor medtem prišel v datoteke,
  // velja datoteka (AI vrstico izbrišemo), sopomenke, ki jih je dodal AI, pa se ohranijo.
  // Pred supabase/ai-preverjanje.sql stolpca vir še ni – takrat po starem (izbriši vse in naloži znova).
  const aiVrstice = await beri('odgovori?select=id,vprasanje_id,odgovor,sopomenke&vir=eq.ai', true);
  const imaVir = aiVrstice !== null;
  const ai = aiVrstice || [];
  const aiSop = (await beri('ai_sopomenke?select=vprasanje_id,odgovor,sopomenka', true)) || [];
  const poVpr = new Map();
  for (const o of odgovori) { if (!poVpr.has(o.vprasanje_id)) poVpr.set(o.vprasanje_id, []); poVpr.get(o.vprasanje_id).push(o); }
  const najdi = (vid, besedilo) => (poVpr.get(vid) || []).find((o) => [o.odgovor, ...o.sopomenke].some((z) => norm(z) === norm(besedilo)));
  const dodajSop = (o, z) => { if (o && ![o.odgovor, ...o.sopomenke].some((x) => norm(x) === norm(z))) o.sopomenke.push(z); };
  const brisi = [], ostanejo = [];
  for (const a of ai) {
    const f = najdi(a.vprasanje_id, a.odgovor);
    // enak zapis → velja datoteka; samo podoben zapis → AI vrstica ostane (igra ju združi, stare igre z njim ostanejo veljavne)
    if (f) a.sopomenke.forEach((z) => dodajSop(f, z));
    if (f && f.odgovor === a.odgovor) brisi.push(a.id); else ostanejo.push(a);
  }
  for (const s of aiSop) dodajSop(najdi(s.vprasanje_id, s.odgovor), s.sopomenka);
  for (const k of kosi(brisi, 200)) await rest('DELETE', `odgovori?id=in.(${k.join(',')})`);
  for (const k of kosi(vprasanja.map((v) => v.id), 100)) {
    const seznam = k.map((id) => `"${id}"`).join(',');
    await rest('DELETE', `odgovori?vprasanje_id=in.(${encodeURIComponent(seznam)})${imaVir ? '&vir=eq.rocno' : ''}`);
  }
  // AI odgovori ostanejo na koncu seznama (za odgovori iz datotek)
  for (const a of ostanejo) {
    const rang = (poVpr.get(a.vprasanje_id) || []).length + 1 + ostanejo.filter((x) => x.vprasanje_id === a.vprasanje_id && x.id < a.id).length;
    await rest('PATCH', `odgovori?id=eq.${a.id}`, { rang });
  }
  if (ai.length) console.log(`✓ AI odgovori: ${ostanejo.length} ohranjenih, ${brisi.length} jih je že v datotekah · ${aiSop.length} AI sopomenk`);
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
