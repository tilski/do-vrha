// Izpiše, koliko igralcev je igralo vsak dan (samo zate: potrebuje service role ključ iz .env).
//   npm run igralci           zadnjih 30 dni
//   npm run igralci -- 7      zadnjih 7 dni
//   npm run igralci -- vse    od začetka
const beriEnv = require('./env');
const env = beriEnv();
const URL = (env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const KLJUC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KLJUC) {
  console.error('V .env manjka EXPO_PUBLIC_SUPABASE_URL ali SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const arg = process.argv[2];
const dni = arg === 'vse' ? 0 : Number(arg) || 30;
const danes = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Ljubljana' });
const odDatuma = dni ? new Date(Date.parse(danes) - (dni - 1) * 864e5).toISOString().slice(0, 10) : null;

(async () => {
  // Vse igre preberemo (tudi starejše), da vemo, kdo je nov igralec.
  const igre = [];
  for (let i = 0; ; i += 1000) {
    const r = await fetch(`${URL}/rest/v1/igre?select=datum,uid,koncano&order=datum,uid`, {
      headers: { apikey: KLJUC, ...(KLJUC.startsWith('sb_') ? {} : { Authorization: `Bearer ${KLJUC}` }), Range: `${i}-${i + 999}` },
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const kos = await r.json();
    igre.push(...kos);
    if (kos.length < 1000) break;
  }
  if (!igre.length) return console.log('V bazi še ni nobene igre.');

  const prviDan = new Map();
  const poDnevih = new Map();
  for (const { datum, uid, koncano } of igre) {
    if (!prviDan.has(uid) || datum < prviDan.get(uid)) prviDan.set(uid, datum);
    const d = poDnevih.get(datum) ?? { igralci: 0, koncali: 0, novi: 0 };
    d.igralci++;
    if (koncano) d.koncali++;
    poDnevih.set(datum, d);
  }
  for (const dan of prviDan.values()) poDnevih.get(dan).novi++;

  const prvi = [...poDnevih.keys()].sort()[0];
  const zacetek = odDatuma && odDatuma > prvi ? odDatuma : prvi;
  const vrstice = [];
  for (let t = Date.parse(zacetek); t <= Date.parse(danes); t += 864e5) {
    const datum = new Date(t).toISOString().slice(0, 10);
    vrstice.push([datum, poDnevih.get(datum) ?? { igralci: 0, koncali: 0, novi: 0 }]);
  }
  const max = Math.max(1, ...vrstice.map(([, d]) => d.igralci));
  const dnevi = ['ned', 'pon', 'tor', 'sre', 'čet', 'pet', 'sob'];

  console.log('\n datum          igralci  končali  novi');
  for (const [datum, d] of vrstice) {
    const dan = dnevi[new Date(datum).getUTCDay()];
    const stolpec = '█'.repeat(Math.round((d.igralci / max) * 30));
    console.log(` ${datum} ${dan}  ${String(d.igralci).padStart(6)}  ${String(d.koncali).padStart(7)}  ${String(d.novi).padStart(4)}  ${stolpec}`);
  }
  const vObdobju = vrstice.reduce((s, [, d]) => s + d.igralci, 0);
  console.log(`\nPovprečno ${(vObdobju / vrstice.length).toFixed(1)} igralcev na dan v zadnjih ${vrstice.length} dneh.`);
  console.log(`Vseh različnih igralcev od začetka: ${prviDan.size}.`);
  console.log('(Igralec = ena naprava ali račun. Nekdo, ki igra na telefonu in računalniku brez Google prijave, šteje dvakrat.)\n');
})().catch((e) => {
  console.error('Branje ni uspelo:', e.message);
  process.exit(1);
});
