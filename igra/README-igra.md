# Do vrha? – dnevna igra vzpona na Triglav

## Datoteke
- `index.html` – celotna igra (HTML, CSS, JS in pot); vprašanja naloži iz Supabase
- `dem_core.png` – višinski podatki Triglava (10 m mreža, Copernicus DEM)
- `dem_ring.png` – okolica Julijskih Alp (150 m mreža) za obzorje
- `src.html` – izvorna koda igre (mesto `/*SUPA*/null` za nastavitve baze)
- `terrain_meta.json` – meje terena, pot iz OpenStreetMap, vrhovi

## Zagon na računalniku
Igra nalaga PNG datoteke, zato je ne moreš odpreti z dvoklikom (brskalnik blokira `file://`).
V tej mapi zaženi lokalni strežnik in odpri http://localhost:8000:

    python3 -m http.server 8000

ali `npx serve .`

Vprašanja, lestvica in odgovori drugih igralcev pridejo iz Supabase, zato potrebuješ internet
in izpolnjen `.env` (glej glavni README.md). Brez povezave igra pokaže napako in gumb »Poskusi znova«.

## Urejanje vprašanj
Vprašanja so v Supabase (tabele `kategorije`, `vprasanja`, `odgovori`). `baza/kategorije/*.json` so izvorne
datoteke za uvoz z `npm run baza`. Po spremembi `src.html` ali `.env` iz korena projekta poženi `npm run igra`.

## Viri podatkov
- Relief: Copernicus DEM GLO-30 (ESA), AWS Terrain Tiles
- Pot in vrhovi: © OpenStreetMap contributors
- 3D: three.js 0.160 (CDN jsDelivr)
