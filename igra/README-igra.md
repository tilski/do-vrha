# Do vrha? – dnevna igra vzpona na Triglav

## Datoteke
- `index.html` – celotna igra (HTML, CSS, JS, kategorije in pot)
- `dem_core.png` – višinski podatki Triglava (10 m mreža, Copernicus DEM)
- `dem_ring.png` – okolica Julijskih Alp (150 m mreža) za obzorje
- `vir/` – izvorni deli za urejanje:
  - `src.html` – igra brez kategorij (mesto `/*CATS*/`)
  - `cats.js` – vse kategorije in sprejeti odgovori
  - `terrain_meta.json` – meje terena, pot iz OpenStreetMap, vrhovi

## Zagon na računalniku
Igra nalaga PNG datoteke, zato je ne moreš odpreti z dvoklikom (brskalnik blokira `file://`).
V tej mapi zaženi lokalni strežnik in odpri http://localhost:8000:

    python3 -m http.server 8000

ali `npx serve .`

Lokalno igra deluje v celoti, le lestvica in štetje odgovorov drugih igralcev
delujeta samo na claude.ai (tam redkost oceni iz vgrajene ocene pogostosti).

## Urejanje kategorij
Uredi `vir/cats.js`, nato ga vstavi v `vir/src.html` namesto `/*CATS*/` in shrani kot `index.html`:

    python3 -c "s=open('vir/src.html').read();c=open('vir/cats.js').read();open('index.html','w').write(s.replace('/*CATS*/',c))"

Format odgovora: `Ime|alias1|alias2;Naslednji` – prvi odgovori na seznamu veljajo za pogostejše.

## Viri podatkov
- Relief: Copernicus DEM GLO-30 (ESA), AWS Terrain Tiles
- Pot in vrhovi: © OpenStreetMap contributors
- 3D: three.js 0.160 (CDN jsDelivr)
