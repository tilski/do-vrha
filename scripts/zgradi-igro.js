// Zgradi igro iz mape igra/ v obliko, ki jo aplikacija lahko naloži.
// Zaženi: npm run igra
const fs = require('fs');
const path = require('path');

const koren = path.join(__dirname, '..');
const igra = (f) => path.join(koren, 'igra', f);

const src = fs.readFileSync(igra('src.html'), 'utf8');
const cats = fs.readFileSync(igra('cats.js'), 'utf8');
const png = (f) => 'data:image/png;base64,' + fs.readFileSync(igra(f)).toString('base64');

// 1) celotna igra kot en HTML (kategorije + višinski podatki vgrajeni)
let html = src.replace('/*CATS*/', cats);
fs.writeFileSync(igra('index.html'), html); // za zagon v brskalniku
html = html.replace("'dem_core.png'", `'${png('dem_core.png')}'`).replace("'dem_ring.png'", `'${png('dem_ring.png')}'`);
fs.mkdirSync(path.join(koren, 'assets/igra'), { recursive: true });
fs.writeFileSync(
  path.join(koren, 'assets/igra/igra-html.ts'),
  '// SAMODEJNO ZGRAJENO s scripts/zgradi-igro.js – ne urejaj ročno\nconst igraHtml: string = ' + JSON.stringify(html) + ';\nexport default igraHtml;\n'
);

// 2) kategorije za nativne zaslone
const ts =
  '// SAMODEJNO ZGRAJENO iz igra/cats.js – ne urejaj ročno\n' +
  'export type Kategorija = { id: string; g: string; t: string; h: string; a: string; strip?: string[] };\n\n' +
  cats.replace('const CATS = [', 'export const CATS: Kategorija[] = [') + '\n';
fs.writeFileSync(path.join(koren, 'src/utils/kategorije.ts'), ts);

console.log('Igra zgrajena:', (html.length / 1e6).toFixed(2), 'MB');
