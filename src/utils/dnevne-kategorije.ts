// Pomožne funkcije za dnevni izbor kategorij.
// Algoritem je enak kot v igri (igra/src.html), zato aplikacija pokaže iste kategorije.

import { CATS, Kategorija } from './kategorije';

export const SKUPINE: Record<string, string> = {
  ljudje: 'Ljudje',
  kraji: 'Kraji',
  hrana: 'Hrana in pijača',
  kultura: 'Kultura',
  znamke: 'Znamke in klubi',
};

/** Današnji datum v obliki 2026-11-20 (po slovenskem času). */
export function danes(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Ljubljana' });
}

/** Datum 2026-11-20 → "20. 11. 2026". */
export function formatDatuma(datum: string): string {
  const [l, m, d] = datum.split('-');
  return `${+d}. ${+m}. ${l}`;
}

/** Zaporedna številka dnevnega vzpona (prvi je bil 13. 11. 2026). */
export function stevilkaVzpona(datum: string): number {
  return Math.max(1, Math.round((Date.parse(datum) - Date.parse('2026-11-13')) / 864e5) + 1);
}

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vrne 8 kategorij za izbrani dan (največ 3 iz ljudi/krajev, 2 iz ostalih skupin). */
export function dnevneKategorije(datum: string): Kategorija[] {
  const r = rng(hash('dovrha-' + datum));
  const a = CATS.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  const izbor: Kategorija[] = [];
  const stevec: Record<string, number> = {};
  for (const c of a) {
    if (izbor.length >= 8) break;
    const meja = c.g === 'ljudje' || c.g === 'kraji' ? 3 : 2;
    if ((stevec[c.g] || 0) >= meja) continue;
    stevec[c.g] = (stevec[c.g] || 0) + 1;
    izbor.push(c);
  }
  return izbor;
}
