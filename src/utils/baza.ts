// Branje vprašanj iz Supabase (glej supabase/shema.sql).
// Naslov in javni ključ prideta iz .env (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY).
import { useCallback, useEffect, useState } from 'react';

/** Eno vprašanje: g = kategorija, s = 0 Slovenija / 1 svet, t = vprašanje, h = namig, n = število odgovorov. */
export type Kategorija = { id: string; g: string; s: number; t: string; h: string; n: number };

const URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const KLJUC = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

type Vrstica = {
  id: string;
  vprasanje: string;
  namig: string;
  slovenija: boolean;
  kategorije: { ime: string } | null;
  odgovori: { count: number }[];
};

// Supabase vrne največ 1000 vrstic naenkrat – beremo po straneh
async function beriVse<T>(pot: string): Promise<T[]> {
  if (!URL || !KLJUC) throw new Error('Baza ni nastavljena – izpolni .env (glej .env.example).');
  const vse: T[] = [];
  for (let od = 0; ; od += 1000) {
    const r = await fetch(`${URL}/rest/v1/${pot}`, {
      // novi ključi (sb_publishable_…) gredo samo v apikey, stari anon (JWT) tudi v Authorization
      headers: {
        apikey: KLJUC,
        ...(KLJUC.startsWith("sb_") ? {} : { Authorization: `Bearer ${KLJUC}` }),
        Range: `${od}-${od + 999}`,
      },
    });
    if (!r.ok) throw new Error(`Baza: ${r.status} ${await r.text()}`);
    const kos = (await r.json()) as T[];
    vse.push(...kos);
    if (kos.length < 1000) return vse;
  }
}

let predpomnilnik: Promise<Kategorija[]> | null = null;

/** Vsa aktivna vprašanja v enakem vrstnem redu, kot jih uporablja igra za dnevni izbor. */
export function naloziVprasanja(): Promise<Kategorija[]> {
  predpomnilnik ??= beriVse<Vrstica>(
    'vprasanja?select=id,vprasanje,namig,slovenija,kategorija_id,kategorije(ime),odgovori(count)' +
      '&aktivno=eq.true&order=vrstni_red,id'
  )
    .then((vrstice) =>
      vrstice.map((v) => ({
        id: v.id,
        g: v.kategorije?.ime ?? '?',
        s: v.slovenija ? 0 : 1,
        t: v.vprasanje,
        h: v.namig,
        n: v.odgovori?.[0]?.count ?? 0,
      }))
    )
    .catch((e) => {
      predpomnilnik = null; // naslednji poskus naj spet vpraša bazo
      throw e;
    });
  return predpomnilnik;
}

/** React hook: { vprasanja, napaka, nalaganje, znova }. */
export function useVprasanja() {
  const [vprasanja, setVprasanja] = useState<Kategorija[]>([]);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [nalaganje, setNalaganje] = useState(true);

  const nalozi = useCallback(() => {
    setNalaganje(true);
    setNapaka(null);
    naloziVprasanja()
      .then(setVprasanja)
      .catch((e: Error) => setNapaka(e.message))
      .finally(() => setNalaganje(false));
  }, []);

  useEffect(nalozi, [nalozi]);
  return { vprasanja, napaka, nalaganje, znova: nalozi };
}
