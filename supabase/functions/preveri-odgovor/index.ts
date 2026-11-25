// Supabase Edge Function: preveri vnos, ki ga ni na seznamu odgovorov, z Google Gemini.
// Objava:   npx supabase functions deploy preveri-odgovor --no-verify-jwt --project-ref <ref>
// Skrivnost: npx supabase secrets set GEMINI_API_KEY=… --project-ref <ref>
//   (neobvezno GEMINI_MODELI = seznam z vejicami; AI_DNEVNA_MEJA, privzeto 40)
// Prijavo preverimo sami (getUser), zato --no-verify-jwt.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { ocistiVnos, kljuciOdgovorov, presodi, vprasajAI } from './logika.mjs';

const IZVORI = ['https://dovrha.top', 'https://www.dovrha.top', 'https://tilski.github.io', 'http://localhost:8765', 'http://127.0.0.1:8765'];
// Veriga modelov (prvi je glavni); vsak ima na brezplačni ravni svojo omejitev klicev na minuto.
const MODELI = (Deno.env.get('GEMINI_MODELI') || 'gemini-3.5-flash-lite,gemini-3.6-flash,gemini-3.5-flash,gemini-2.5-flash,gemini-flash-lite-latest').split(',').map((m) => m.trim()).filter(Boolean);
const KLJUC = Deno.env.get('GEMINI_API_KEY') || '';
const MEJA = Number(Deno.env.get('AI_DNEVNA_MEJA')) || 40;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const pocakaj = (ms: number) => new Promise((r) => setTimeout(r, ms));

function odgovor(req: Request, telo: unknown, status = 200) {
  const izvor = req.headers.get('origin') || '';
  return new Response(JSON.stringify(telo), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': IZVORI.includes(izvor) ? izvor : IZVORI[0],
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      Vary: 'Origin',
    },
  });
}

async function preberiPresojo(vid: string, kljuc: string) {
  const { data } = await db.from('ai_presoje').select('stanje,odgovor,vrsta,razlog').eq('vprasanje_id', vid).eq('kljuc', kljuc).maybeSingle();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return odgovor(req, 'ok');
  if (req.method !== 'POST') return odgovor(req, { napaka: 'samo POST' }, 405);

  // 1) prijavljen igralec (tudi anonimni) – drugače nič
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: u } = jwt ? await db.auth.getUser(jwt) : { data: null };
  const uid = u?.user?.id;
  if (!uid) return odgovor(req, { stanje: 'napaka', razlog: 'prijava' }, 401);

  // 2) vnos
  let telo: { vprasanje_id?: string; vnos?: string };
  try { telo = await req.json(); } catch { return odgovor(req, { stanje: 'napaka', razlog: 'zahteva' }, 400); }
  const vid = String(telo.vprasanje_id || '').slice(0, 100);
  const cist = ocistiVnos(telo.vnos);
  if (!vid || !cist) return odgovor(req, { stanje: 'zavrnjeno', razlog: 'Prazen ali predolg odgovor.' });
  const { vnos, kljuc } = cist;

  // 3) vprašanje in obstoječi odgovori (iz baze, ne od igralca)
  const { data: vpr } = await db.from('vprasanja').select('id,vprasanje,namig,aktivno').eq('id', vid).maybeSingle();
  if (!vpr || !vpr.aktivno) return odgovor(req, { stanje: 'napaka', razlog: 'vprasanje' }, 400);
  const { data: odg, error: eo } = await db.from('odgovori').select('odgovor,sopomenke').eq('vprasanje_id', vid).order('rang');
  if (eo || !odg) return odgovor(req, { stanje: 'napaka', razlog: 'baza' }, 500);

  // 4) že na seznamu (npr. ga je medtem dodal drug igralec) → brez AI
  const obst = kljuciOdgovorov(odg).get(kljuc);
  if (obst) return odgovor(req, { stanje: 'sprejeto', odgovor: obst, vrsta: 'sopomenka' });

  // 5) zaklep: isti vnos presodimo samo enkrat, tudi ob sočasnih zahtevah
  const { data: zac, error: ez } = await db.rpc('ai_zacni', { p_vid: vid, p_kljuc: kljuc, p_vnos: vnos, p_uid: uid });
  if (ez) return odgovor(req, { stanje: 'napaka', razlog: 'baza' }, 500);
  if (zac !== 'nov') {
    for (let i = 0; i < 16; i++) {
      const p = await preberiPresojo(vid, kljuc);
      if (p && p.stanje !== 'v_teku') return odgovor(req, { stanje: p.stanje, odgovor: p.odgovor, vrsta: p.vrsta, razlog: p.razlog });
      await pocakaj(500);
    }
    return odgovor(req, { stanje: 'napaka', razlog: 'zasedeno' });
  }

  // 6) omejitev klicev AI na igralca (zadnjih 24 h)
  const { count } = await db.from('ai_presoje').select('kljuc', { count: 'exact', head: true })
    .eq('uid', uid).gte('ustvarjeno', new Date(Date.now() - 864e5).toISOString());
  if (!KLJUC || (count ?? 0) > MEJA) {
    await db.rpc('ai_sprosti', { p_vid: vid, p_kljuc: kljuc });
    return odgovor(req, { stanje: 'napaka', razlog: KLJUC ? 'omejitev' : 'ni_kljuca' });
  }

  // 7) AI presoja + varovala; ob napaki ali časovni omejitvi NE sprejmemo
  let p;
  try {
    const { ai } = await vprasajAI({ kljuc: KLJUC, modeli: MODELI, vpr, odgovori: odg, vnos, rokMs: 9000 });
    p = presodi(ai, odg, vnos);
  } catch (e) {
    console.error('AI napaka', vid, String(e));
    await db.rpc('ai_sprosti', { p_vid: vid, p_kljuc: kljuc });
    return odgovor(req, { stanje: 'napaka', razlog: 'ai' });
  }

  const { error: ew } = await db.rpc('ai_zapisi', {
    p_vid: vid, p_kljuc: kljuc, p_stanje: p.stanje, p_odgovor: p.odgovor, p_vrsta: p.vrsta, p_sopomenka: p.sopomenka, p_razlog: p.razlog,
  });
  if (ew) {
    console.error('zapis', ew.message);
    await db.rpc('ai_sprosti', { p_vid: vid, p_kljuc: kljuc });
    return odgovor(req, { stanje: 'napaka', razlog: 'baza' }, 500);
  }
  return odgovor(req, { stanje: p.stanje, odgovor: p.odgovor, vrsta: p.vrsta, razlog: p.razlog });
});

