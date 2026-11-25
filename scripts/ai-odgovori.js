// Pregled odločitev AI (funkcija preveri-odgovor) – za nočni pregled ali ročno.
//   npm run ai-odgovori                         še nepregledane presoje (sprejete in zavrnjene)
//   npm run ai-odgovori -- --vse                vse presoje
//   npm run ai-odgovori -- --oznaci             izpiše, označi kot pregledane in POTRDI sprejete nove odgovore
//        (nepotrjen AI odgovor ima v igri nevtralno začetno redkost) – napačne pred tem odstrani z --odstrani
//   npm run ai-odgovori -- --odstrani <vprasanje_id> "<odgovor>"
//        napačen NOV odgovor, ki ga je sprejel AI: izbriše ga (samo vir 'ai') in vse vnose, ki so vodili do njega,
//        označi kot zavrnjene. Ne izbriše, če ga je kdo izbral v igri včeraj ali danes (njegova igra se ne bi več shranila).
//   npm run ai-odgovori -- --odstrani-sop <vprasanje_id> "<odgovor>" "<sopomenka>"
//        napačna SOPOMENKA (AI je združil različna pojma): odstrani jo; vnos označi kot zavrnjen.
// Odgovorov iz datotek (vir 'rocno') ta skripta nikoli ne spreminja.
const beriEnv = require('./env');
const env = beriEnv();
const URL = (env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const KLJUC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KLJUC) { console.error('V .env manjka EXPO_PUBLIC_SUPABASE_URL ali SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1); }
const H = { apikey: KLJUC, ...(KLJUC.startsWith('sb_') ? {} : { Authorization: `Bearer ${KLJUC}` }), 'Content-Type': 'application/json' };
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const enc = encodeURIComponent;

async function api(metoda, pot, telo) {
  const r = await fetch(`${URL}/rest/v1/${pot}`, { method: metoda, headers: { ...H, Prefer: 'return=representation' }, body: telo ? JSON.stringify(telo) : undefined });
  if (!r.ok) throw new Error(`${metoda} ${pot.split('?')[0]}: ${r.status} ${await r.text()}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function beri(pot) {
  const out = [];
  for (let i = 0; ; i += 1000) {
    const r = await fetch(`${URL}/rest/v1/${pot}`, { headers: { ...H, Range: `${i}-${i + 999}` } });
    if (!r.ok) throw new Error(`GET ${pot.split('?')[0]}: ${r.status} ${await r.text()}`);
    const k = await r.json(); out.push(...k); if (k.length < 1000) return out;
  }
}

const args = process.argv.slice(2);

async function odstrani(vid, odg) {
  const vrst = await beri(`odgovori?select=id,odgovor,vir&vprasanje_id=eq.${enc(vid)}&odgovor=eq.${enc(odg)}`);
  if (!vrst.length) throw new Error(`Odgovora »${odg}« pri ${vid} ni.`);
  if (vrst[0].vir !== 'ai') throw new Error(`»${odg}« je iz datotek (vir ${vrst[0].vir}) – te skripta ne spreminja. Uredi JSON in zaženi npm run baza.`);
  const vceraj = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  const igre = await beri(`igre?select=uid&datum=gte.${vceraj}&odgovori->>${enc(vid)}=eq.${enc(odg)}`);
  if (igre.length) throw new Error(`»${odg}« je v zadnjih dneh izbralo ${igre.length} igralcev – odstrani ga čez dva dni, da se njihove igre še shranijo.`);
  await api('DELETE', `odgovori?id=eq.${vrst[0].id}&vir=eq.ai`);
  await api('DELETE', `ai_sopomenke?vprasanje_id=eq.${enc(vid)}&odgovor=eq.${enc(odg)}`);
  const p = await api('PATCH', `ai_presoje?vprasanje_id=eq.${enc(vid)}&odgovor=eq.${enc(odg)}`, { stanje: 'zavrnjeno', odgovor: null, vrsta: null, razlog: 'odstranjeno ob pregledu', pregledano: true });
  console.log(`Odstranjeno: ${vid} › ${odg} (${p.length} vnosov označenih kot zavrnjeni).`);
}

async function odstraniSop(vid, odg, sop) {
  const vrst = await beri(`odgovori?select=id,odgovor,sopomenke&vprasanje_id=eq.${enc(vid)}&odgovor=eq.${enc(odg)}`);
  if (!vrst.length) throw new Error(`Odgovora »${odg}« pri ${vid} ni.`);
  const ai = await beri(`ai_sopomenke?select=sopomenka&vprasanje_id=eq.${enc(vid)}&odgovor=eq.${enc(odg)}`);
  const cilj = ai.find((a) => norm(a.sopomenka) === norm(sop));
  if (!cilj) throw new Error(`»${sop}« ni sopomenka, ki jo je dodal AI – sopomenke iz datotek uredi v JSON.`);
  await api('PATCH', `odgovori?id=eq.${vrst[0].id}`, { sopomenke: vrst[0].sopomenke.filter((s) => s !== cilj.sopomenka) });
  await api('DELETE', `ai_sopomenke?vprasanje_id=eq.${enc(vid)}&odgovor=eq.${enc(odg)}&sopomenka=eq.${enc(cilj.sopomenka)}`);
  await api('PATCH', `ai_presoje?vprasanje_id=eq.${enc(vid)}&kljuc=eq.${enc(norm(sop))}`, { stanje: 'zavrnjeno', odgovor: null, vrsta: null, razlog: 'odstranjeno ob pregledu', pregledano: true });
  console.log(`Odstranjena sopomenka: ${vid} › ${odg} ✕ ${cilj.sopomenka}`);
}

(async () => {
  if (args[0] === '--odstrani') return odstrani(args[1], args[2]);
  if (args[0] === '--odstrani-sop') return odstraniSop(args[1], args[2], args[3]);
  const vse = args.includes('--vse');
  const p = await beri(`ai_presoje?select=vprasanje_id,kljuc,vnos,stanje,odgovor,vrsta,razlog,ustvarjeno${vse ? '' : '&pregledano=eq.false'}&stanje=neq.v_teku&order=vprasanje_id,ustvarjeno`);
  if (!p.length) return console.log(vse ? 'AI še ni presodil nobenega odgovora.' : 'Ni novih AI presoj.');
  const vpr = new Map((await beri(`vprasanja?select=id,vprasanje&id=in.(${[...new Set(p.map((x) => `"${x.vprasanje_id}"`))].join(',')})`)).map((v) => [v.id, v.vprasanje]));
  let zad = '';
  for (const x of p) {
    if (x.vprasanje_id !== zad) { zad = x.vprasanje_id; console.log(`\n${x.vprasanje_id} — ${vpr.get(x.vprasanje_id) || '?'}`); }
    const kaj = x.stanje === 'sprejeto' ? (x.vrsta === 'nov' ? `✚ NOV  »${x.odgovor}«` : `≈ SOP  → »${x.odgovor}«`) : '✕ ZAVRNJEN';
    console.log(`  ${kaj.padEnd(34)} vnos: ${x.vnos}   (${x.razlog || ''})`);
  }
  const s = p.filter((x) => x.stanje === 'sprejeto');
  console.log(`\n${p.length} presoj: ${s.filter((x) => x.vrsta === 'nov').length} novih, ${s.filter((x) => x.vrsta === 'sopomenka').length} sopomenk, ${p.length - s.length} zavrnjenih.`);
  if (args.includes('--oznaci')) {
    for (const x of p) await api('PATCH', `ai_presoje?vprasanje_id=eq.${enc(x.vprasanje_id)}&kljuc=eq.${enc(x.kljuc)}`, { pregledano: true });
    // presoje, ki so še ostale sprejete kot nov odgovor, so prestale pregled → odgovor je potrjen
    let n = 0;
    for (const x of p.filter((y) => y.stanje === 'sprejeto' && y.vrsta === 'nov' && y.odgovor)) {
      n += (await api('PATCH', `odgovori?vprasanje_id=eq.${enc(x.vprasanje_id)}&odgovor=eq.${enc(x.odgovor)}&vir=eq.ai&potrjeno=eq.false`, { potrjeno: true })).length;
    }
    console.log(`Označeno kot pregledano · potrjenih novih odgovorov: ${n}.`);
  }
})().catch((e) => { console.error('Napaka:', e.message); process.exit(1); });
