# Do vrha?

**Člana skupine:** Tilen Jaklin, _[ime sošolca]_ (4.TRB, Šolski center Velenje)

## Opis aplikacije

**Do vrha?** je dnevna igra: vsak dan 8 vprašanj iz baze 1000 vprašanj – 4 o Sloveniji in 4 o svetu (ljudje, kraji,
hrana, narava, šport, kultura …) – za vsako en odgovor. Bolj kot je odgovor redek, hitreje se
vzpenjaš od Aljaževega doma v Vratih (1015 m) čez Prag in Kredarico na vrh Triglava
(2864 m). Vzpon je prikazan na 3D modelu pravega terena (Copernicus DEM, three.js).

Aplikacija je izdelana z React Native in Expo (Expo Router). Začetni zaslon in navodila
sta nativna, 3D igra pa teče v komponenti `IgraPogled` (WebView).

## Struktura projekta

```
src/
  app/                       # zasloni (Expo Router)
    _layout.tsx              # navigacija (Stack)
    index.tsx                # začetni zaslon, današnje kategorije
    navodila.tsx             # pravila igre
    igra.tsx                 # 3D vzpon
  components/                # ponovno uporabne komponente
    gumb.tsx
    kartica-kategorije.tsx
    igra-pogled.tsx
  utils/                     # pomožne funkcije in podatki
    dnevne-kategorije.ts     # dnevni izbor 8 vprašanj
    baza.ts                  # branje vprašanj iz Supabase
  theme.ts                   # skupne barve in slogi
igra/                        # izvorna koda 3D igre (HTML, višinski podatki)
  baza/kategorije/*.json     # izvorne datoteke za uvoz vprašanj v bazo
assets/igra/igra-html.ts     # (zgrajeno) igra v eni datoteki za WebView
scripts/zgradi-igro.js       # zgradi igro: npm run igra
scripts/napolni-bazo.js      # naloži JSON v Supabase: npm run baza
supabase/shema.sql           # tabele in dovoljenja baze
.env.example                 # vzorec nastavitev (kopiraj v .env)
```

## Navodila za zagon

Potrebuješ: [Node.js LTS](https://nodejs.org), [Git](https://git-scm.com) in aplikacijo **Expo Go** na telefonu.

```bash
git clone https://github.com/<uporabnik>/do-vrha.git
cd do-vrha
npm install
cp .env.example .env        # vpiši podatke za Supabase (glej spodaj)
npm run igra
npx expo start
```

V terminalu se prikaže QR koda. Na Androidu jo skeniraj v aplikaciji Expo Go, na iPhonu
pa s kamero. Telefon in računalnik morata biti v istem omrežju (če ne gre, poženi
`npx expo start --tunnel`). Telefon potrebuje internet (three.js in pisave se naložijo s CDN).

Ko spremeniš igro v `igra/src.html` ali nastavitve v `.env`, poženi `npm run igra`.

## Viri podatkov

- Relief: Copernicus DEM GLO-30 (ESA), AWS Terrain Tiles
- Pot in vrhovi: © OpenStreetMap contributors
- 3D: three.js 0.160 (CDN jsDelivr)

## Baza (Supabase)

Vprašanja, odgovori in odigrane igre so v spletni bazi [Supabase](https://supabase.com) (brezplačen paket).
Igra ob zagonu naloži samo današnjih 8 vprašanj z odgovori, zato je aplikacija majhna, vprašanja pa lahko
spreminjaš brez nove verzije.

| Tabela | Vsebina |
|---|---|
| `kategorije` | `id`, `ime` – npr. `kraji-slo`, »Kraji v Sloveniji« |
| `vprasanja` | `id`, `kategorija_id`, `vprasanje`, `namig`, `slovenija`, `odstrani`, `vrstni_red`, `aktivno` |
| `odgovori` | `vprasanje_id`, `rang` (1 = najpogostejši), `odgovor`, `sopomenke` (drugi sprejeti zapisi) |
| `igre` | `datum`, `uid`, `vm` (višinski metri), `odgovori`, `koncano` – iz njih se računa redkost odgovorov |

### Prva nastavitev (enkrat)

1. Na [supabase.com](https://supabase.com) ustvari nov projekt.
2. **SQL Editor** › New query › prilepi vsebino `supabase/shema.sql` › **Run**.
3. **Authentication › Sign In / Providers** › vklopi **Allow anonymous sign-ins** (vsak igralec dobi svoj id brez gesla).
4. **Project Settings › API**: v `.env` (kopija `.env.example`) vpiši `EXPO_PUBLIC_SUPABASE_URL`,
   javni ključ `EXPO_PUBLIC_SUPABASE_ANON_KEY` in skrivni `SUPABASE_SERVICE_ROLE_KEY`.
5. `npm run baza` – naloži 1000 vprašanj iz `igra/baza/kategorije/*.json` v bazo.
6. `npm run igra` – vgradi naslov baze v igro.

Skrivni `service_role` ključ uporablja samo `npm run baza` na tvojem računalniku – nikoli ga ne daj v aplikacijo.
`.env` je v `.gitignore`.

### Urejanje vprašanj

V Supabase odpri **Table Editor** in urejaj tabele neposredno – sprememba velja takoj (igralci, ki so danes
že odprli igro, imajo današnja vprašanja shranjena do polnoči).

- `slovenija`: `true` za vprašanja o Sloveniji, `false` za vprašanja o svetu.
- `rang`: od najpogostejšega (1) do najredkejšega – igra iz tega oceni redkost.
- `sopomenke`: drugi zapisi, npr. `{makedonija}` za »Severna Makedonija« (šumniki in velike črke niso pomembni).
- `odstrani`: besede, ki jih igralec lahko doda (npr. `{kitarist}` → »kitarist Slash«).
- `aktivno = false` skrije vprašanje iz igre.
- Dnevni izbor (4 o Sloveniji, 4 o svetu, največ 2 iz iste kategorije) je odvisen od seznama vprašanj
  po `vrstni_red`. Novim vprašanjem daj številko, večjo od obstoječih – vsako dodano ali skrito vprašanje
  spremeni izbor za prihodnje dni.

Vprašanja lahko urejaš tudi v datotekah `igra/baza/kategorije/*.json` (format: `"odgovori": ["Severna Makedonija|makedonija", …]`)
in jih znova naložiš z `npm run baza`. **Pozor:** to prepiše odgovore teh vprašanj v bazi, zato ne
uporabljaj obeh načinov hkrati. `npm run baza -- --suho` datoteke samo preveri.

## Viri podatkov

- Relief: Copernicus DEM GLO-30 (ESA), AWS Terrain Tiles
- Pot in vrhovi: © OpenStreetMap contributors
- 3D: three.js 0.160 (CDN jsDelivr)

## Urejanje baze vprašanj

Baza ima **50 kategorij po 20 vprašanj** (skupaj 1000). Vsaka kategorija je ena datoteka
v `igra/baza/kategorije/`, npr. `glasbeniki.json`:

```json
{
  "kategorija": "Glasbeniki sveta",
  "vprasanja": [
    {
      "id": "kitarist",
      "vprasanje": "Znan kitarist",
      "namig": "Npr. Jimi Hendrix",
      "slovenija": false,
      "odstrani": ["kitarist"],
      "odgovori": ["Jimi Hendrix", "Eric Clapton", "Slash", "..."]
    }
  ]
}
```

- `slovenija`: `true` za vprašanja o Sloveniji, `false` za vprašanja o svetu.
- `odgovori`: od **najpogostejšega do najredkejšega** – igra iz vrstnega reda oceni redkost.
  Za `|` so dovoljeni drugi zapisi, npr. `"Severna Makedonija|makedonija"` (šumniki in velike črke niso pomembni).
- `odstrani` (neobvezno): besede, ki jih igralec lahko doda (npr. »kitarist Slash«).
- Odgovor ne sme vsebovati `;` ali `?`.

Po spremembi poženi `npm run igra`. Skripta preveri bazo (podvojeni odgovori, manjkajoča polja,
enaka vprašanja v več kategorijah), opozori na kategorije, ki nimajo 20 vprašanj, in na vprašanja
z manj kot 20 odgovori, nato zgradi igro. Vsak dan igra izbere 4 vprašanja o Sloveniji in 4 o svetu
(največ 2 iz iste kategorije).

`igra/baza/seznam-kategorij.csv` je seznam 1000 idej, iz katerega so nastala vprašanja.
