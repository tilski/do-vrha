# Do vrha?

**Člana skupine:** Tilen Jaklin, _[ime sošolca]_ (4.TRB, Šolski center Velenje)

## Opis aplikacije

**Do vrha?** je dnevna igra o Sloveniji: vsak dan 8 slovenskih kategorij (ljudje, kraji,
hrana, kultura, znamke), za vsako en odgovor. Bolj kot je odgovor redek, hitreje se
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
    dnevne-kategorije.ts     # dnevni izbor 8 kategorij
    kategorije.ts            # (zgrajeno iz igra/cats.js)
  theme.ts                   # skupne barve in slogi
igra/                        # izvorna koda 3D igre (HTML, kategorije, višinski podatki)
assets/igra/igra-html.ts     # (zgrajeno) igra v eni datoteki za WebView
scripts/zgradi-igro.js       # zgradi igro: npm run igra
```

## Navodila za zagon

Potrebuješ: [Node.js LTS](https://nodejs.org), [Git](https://git-scm.com) in aplikacijo **Expo Go** na telefonu.

```bash
git clone https://github.com/<uporabnik>/do-vrha.git
cd do-vrha
npm install
npx expo start
```

V terminalu se prikaže QR koda. Na Androidu jo skeniraj v aplikaciji Expo Go, na iPhonu
pa s kamero. Telefon in računalnik morata biti v istem omrežju (če ne gre, poženi
`npx expo start --tunnel`). Telefon potrebuje internet (three.js in pisave se naložijo s CDN).

Ko spremeniš kategorije v `igra/cats.js` ali igro v `igra/src.html`, poženi `npm run igra`.

## Viri podatkov

- Relief: Copernicus DEM GLO-30 (ESA), AWS Terrain Tiles
- Pot in vrhovi: © OpenStreetMap contributors
- 3D: three.js 0.160 (CDN jsDelivr)
