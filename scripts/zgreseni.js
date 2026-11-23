// Izpiše odgovore, ki jih igralci pišejo, a jih ni na seznamu (tabela zgreseni).
//   npm run zgreseni            vsi
//   npm run zgreseni -- 7       samo zadnjih 7 dni
//   npm run zgreseni -- --novi  samo še nepregledani (id večji od igra/baza/zgreseni-stanje.json)
//   npm run zgreseni -- --novi --oznaci   isto, nato zapiše zadnji id kot pregledan
// Potrebuje SUPABASE_SERVICE_ROLE_KEY v .env (ali v okolju).
const fs = require('fs');
const path = require('path');
const beriEnv = require('./env');
const env = beriEnv();
const URL = (env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const KLJUC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KLJUC) {
  console.error('V .env manjka EXPO_PUBLIC_SUPABASE_URL ali SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const args = process.argv.slice(2);
const novi = args.includes('--novi');
const oznaci = args.includes('--oznaci');
const dni = Number(args.find((a) => /^\d+$/.test(a))) || 0;
const stanjeF = path.join(__dirname, '..', 'igra/baza/zgreseni-stanje.json');
const zadnji = novi && fs.existsSync(stanjeF) ? JSON.parse(fs.readFileSync(stanjeF, 'utf8')).zadnji_id || 0 : 0;
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const vrstice = [];
  const od = (dni ? `&datum=gte.${new Date(Date.now() - dni * 864e5).toISOString().slice(0, 10)}` : '')
    + (novi ? `&id=gt.${zadnji}` : '');
  for (let i = 0; ; i += 1000) {
    const r = await fetch(`${URL}/rest/v1/zgreseni?select=id,vprasanje_id,vnos${od}&order=id`, {
      headers: { apikey: KLJUC, ...(KLJUC.startsWith('sb_') ? {} : { Authorization: `Bearer ${KLJUC}` }), Range: `${i}-${i + 999}` },
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const kos = await r.json();
    vrstice.push(...kos);
    if (kos.length < 1000) break;
  }
  if (!vrstice.length) return console.log(novi ? `Ni novih zgrešenih odgovorov (po id ${zadnji}).` : 'Ni zgrešenih odgovorov.');
  const maxId = Math.max(...vrstice.map((v) => v.id));
  const po = {};
  for (const { vprasanje_id, vnos } of vrstice) {
    const k = norm(vnos);
    ((po[vprasanje_id] ??= {})[k] ??= { vnos, n: 0 }).n++;
  }
  for (const [vid, vnosi] of Object.entries(po).sort()) {
    const s = Object.values(vnosi).sort((a, b) => b.n - a.n);
    console.log(`\n${vid}`);
    for (const { vnos, n } of s) console.log(`  ${String(n).padStart(3)} × ${vnos}`);
  }
  console.log(`\nSkupaj ${vrstice.length} zgrešenih vnosov (id ${vrstice[0].id}–${maxId}).`);
  if (oznaci) {
    fs.writeFileSync(stanjeF, JSON.stringify({ zadnji_id: maxId, pregledano: new Date().toISOString() }, null, 2) + '\n');
    console.log(`Označeno kot pregledano do id ${maxId}.`);
  }
})().catch((e) => {
  console.error('Branje ni uspelo:', e.message);
  process.exit(1);
});
