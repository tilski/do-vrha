// Preizkus iskanja odgovorov na celotni bazi (igra/baza/kategorije/*.json).
//   node scripts/test-iskanje.js            povzetek
//   node scripts/test-iskanje.js --podrobno  izpiše tudi primere napak
// Kodo iskanja vzame iz igra/src.html (med oznakama ===ISKANJE===), zato preizkuša točno to, kar teče v igri.
const fs = require('fs');
const path = require('path');
const koren = path.join(__dirname, '..');
const podrobno = process.argv.includes('--podrobno');

const src = fs.readFileSync(path.join(koren, 'igra/src.html'), 'utf8');
const m = src.match(/\/\* ===ISKANJE===[^\n]*\n([\s\S]*?)\/\* ===\/ISKANJE=== \*\//);
if (!m) throw new Error('V igra/src.html ni oznak ===ISKANJE===');
const I = new Function(m[1] + '\nreturn {norm,prep,match,suggest};')();

const cats = [];
const mapa = path.join(koren, 'igra/baza/kategorije');
for (const f of fs.readdirSync(mapa).filter((f) => f.endsWith('.json')).sort()) {
  const kid = f.replace(/\.json$/, '');
  for (const q of JSON.parse(fs.readFileSync(path.join(mapa, f), 'utf8')).vprasanja) {
    const c = { id: `${kid}-${q.id}`, g: kid, t: q.vprasanje, strip: q.odstrani || [],
      ans: q.odgovori.map((a) => { const [o, ...s] = a.split('|'); return { o, s }; }) };
    I.prep(c); cats.push(c);
  }
}

let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];

// različice odgovora, kot bi jih vpisal igralec
const sklanjaj = (w) => {
  const out = [];
  if (w.length < 4) return out;
  if (/[aeiou]$/.test(w)) { const st = w.slice(0, -1); for (const k of ['a', 'e', 'i', 'o', 'u']) if (k !== w.slice(-1)) out.push(st + k); }
  else for (const k of ['a', 'e', 'i', 'u', 'om']) out.push(w + k);
  return out;
};
const tipkaj = (w) => {
  if (w.length < 5) return [];
  const i = 1 + Math.floor(rnd() * (w.length - 2));
  return [w.slice(0, i) + w.slice(i + 1), w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2), w.slice(0, i) + w[i] + w.slice(i)];
};

const S = {};
const add = (k, v) => { S[k] ??= { ok: 0, predlog: 0, nic: 0, narobe: 0, primeri: [] }; S[k][v.r]++; if (v.r !== 'ok' && S[k].primeri.length < 25) S[k].primeri.push(v.p); };
const oceni = (c, vnos, prav) => {
  const it = I.match(c, vnos);
  if (it) return { r: it === prav ? 'ok' : 'narobe', p: `${c.t}: »${vnos}« → ${it.canon} (prav: ${prav.canon})` };
  const sg = I.suggest(c, vnos);
  if (sg) return { r: sg === prav ? 'predlog' : 'narobe', p: `${c.t}: »${vnos}« → predlog ${sg.canon} (prav: ${prav.canon})` };
  return { r: 'nic', p: `${c.t}: »${vnos}« → nič (prav: ${prav.canon})` };
};

for (const c of cats) {
  for (const it of c.items) {
    for (const k of it.keys) add('1 zapisi s seznama', oceni(c, k, it));
    const n = I.norm(it.canon); const w = n.split(' ');
    if (w.length === 1) for (const v of sklanjaj(n)) add('2 sklanjatve (ena beseda)', oceni(c, v, it));
    if (w.length > 1) add('3 brez presledkov', oceni(c, w.join(''), it));
    if (w.length > 1 && w[0] !== 'the') add('4 z »the« spredaj', oceni(c, 'the ' + n, it));
    for (const v of tipkaj(n)) add('5 tipkarske napake', oceni(c, v, it));
  }
}
// napačni odgovori: odgovori z drugih vprašanj, ki jih na tem seznamu ni
const vsi = cats.flatMap((c) => c.items.map((it) => it.canon));
const neg = { sprejet: 0, predlog: 0, nic: 0, primeri: [], predlogi: [] };
for (const c of cats) {
  const ima = new Set(c.items.flatMap((it) => it.keys));
  for (let i = 0; i < 40; i++) {
    const v = pick(vsi); if (ima.has(I.norm(v))) continue;
    const it = I.match(c, v);
    if (it) { neg.sprejet++; if (neg.primeri.length < 40) neg.primeri.push(`${c.t}: »${v}« sprejet kot ${it.canon}`); continue; }
    const sg = I.suggest(c, v);
    if (sg) { neg.predlog++; if (neg.predlogi.length < 40) neg.predlogi.push(`${c.t}: »${v}« → predlog ${sg.canon}`); } else neg.nic++;
  }
}

const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '0') + ' %';
console.log(`Vprašanj: ${cats.length}\n`);
console.log('PRAVI ODGOVORI         sprejeto   predlog    nič   napačen');
for (const [k, v] of Object.entries(S).sort()) {
  const n = v.ok + v.predlog + v.nic + v.narobe;
  console.log(`${k.padEnd(26)} ${pct(v.ok, n).padStart(7)} ${pct(v.predlog, n).padStart(8)} ${pct(v.nic, n).padStart(7)} ${pct(v.narobe, n).padStart(8)}   (${n})`);
}
const nn = neg.sprejet + neg.predlog + neg.nic;
console.log(`\nNAPAČNI ODGOVORI (z drugih vprašanj, ${nn})`);
console.log(`  pomotoma sprejeti: ${pct(neg.sprejet, nn)}   predlagan napačen odgovor: ${pct(neg.predlog, nn)}   pravilno zavrnjeni: ${pct(neg.nic, nn)}`);
if (podrobno) {
  for (const [k, v] of Object.entries(S).sort()) if (v.primeri.length) console.log(`\n## ${k}\n  ` + v.primeri.join('\n  '));
  console.log('\n## pomotoma sprejeti\n  ' + neg.primeri.join('\n  '));
  console.log('\n## napačni predlogi\n  ' + neg.predlogi.join('\n  '));
}
