# Objava v Google Play in App Store

## 1. Pred prvim buildom (enkrat)

- [ ] V Supabase › SQL Editor zaženi celoten `supabase/shema.sql` (doda tabelo `zgreseni` in zaščito pred goljufanjem).
- [ ] V `src/utils/zasebnost.ts` in `docs/zasebnost.html` zamenjaj `[tvoj e-naslov]` s pravim kontaktom.
- [ ] Objavi `docs/zasebnost.html` na javnem naslovu (npr. GitHub Pages: Settings › Pages › Branch `main`, mapa `/docs`
      → `https://<uporabnik>.github.io/do-vrha/zasebnost.html`). Ta naslov vpišeš v obe trgovini.
- [ ] Preveri ime paketa v `app.json`: `com.tilski.dovrha` (po prvi objavi ga ni več mogoče spremeniti).
- [ ] Supabase: brezplačen projekt se po 7 dneh brez uporabe zaustavi – za javno igro razmisli o plačljivem paketu (Pro).
- [ ] Preizkusi aplikacijo na telefonu (`npx expo start` + Expo Go): začetni zaslon, igra, lestvica, zasebnost.

## 2. Računi

| | Google Play | App Store |
|---|---|---|
| Račun | Google Play Console – 25 $ enkratno | Apple Developer Program – 99 $ na leto |
| Build | `npx eas-cli build -p android --profile production` | `npx eas-cli build -p ios --profile production` (potreben Mac ni) |
| Oddaja | `npx eas-cli submit -p android` | `npx eas-cli submit -p ios` |
| Testiranje | Novi osebni računi: zaprto testiranje z vsaj 12 testerji 14 dni pred javno objavo | TestFlight |

Pred prvim buildom: `npx eas-cli login` in `npx eas-cli init` (poveže projekt z Expo računom).

## 3. Besedila za trgovino

**Ime:** Do vrha?

**Kratek opis (do 80 znakov):**
Dnevna besedna igra: bolj redek odgovor, hitreje na vrh Triglava.

**Polni opis:**
Vsak dan 8 novih vprašanj – 4 o Sloveniji in 4 o svetu. Za vsako napišeš en odgovor. Bolj kot je tvoj odgovor redek
med vsemi igralci, več višinskih metrov dobiš in hitreje se vzpenjaš od Aljaževega doma v Vratih čez Prag in Kredarico
na vrh Triglava.

• 1000 vprašanj v 50 kategorijah – od glasbe in športa do zgodovine, hrane in slovenskih krajev
• Vsak dan enaka vprašanja za vse – primerjaj se s prijatelji
• 3D pot na Triglav po pravem reliefu
• Hitrost šteje: hitrejši odgovor prinese do 20 % več metrov
• Brez registracije, brez oglasov

**Kategorija:** Igre › Besedne igre (Google) / Games › Word (Apple)

**Posnetki zaslona:** telefon (vsaj 2, priporočeno 4–8): začetni zaslon, vprašanje, predlog odgovora, rezultat na vrhu.
Apple zahteva posnetke za 6,9" iPhone (1320 × 2868), Google pa vsaj 1080 px na krajši stranici.

## 4. Obrazec o podatkih

**Google Play › Data safety**
- Ali aplikacija zbira ali deli podatke? **Da, zbira.** Deli s tretjimi osebami: **ne** (Supabase je obdelovalec).
- Šifrirano med prenosom: **da** (HTTPS). Uporabnik lahko zahteva izbris: **da** (e-pošta).
- Zbrani podatki:
  - *Osebni podatki › ID-ji uporabnikov* – anonimni ID; namen: delovanje aplikacije.
  - *Dejavnost v aplikaciji › Druga vsebina, ki jo ustvari uporabnik* – odgovori na vprašanja; namen: delovanje aplikacije.
  - *Dejavnost v aplikaciji › Drugi ukrepi* – dosežena višina; namen: delovanje aplikacije.
- Oglasi: **ne**. Ciljna skupina: 13+ (igra ni namenjena otrokom; tako se izogneš programu Families).

**App Store › App Privacy**
- Tracking: **No**.
- Data Not Linked to You: *Identifiers › User ID*, *User Content › Other User Content*, *Usage Data › Product Interaction* – vse za *App Functionality*.

**Ocena vsebine (IARC / Apple):** odgovori iskreno – vprašanja omenjajo alkoholne pijače (npr. »Žganje ali liker«),
nasilja, igralništva z denarjem ali nakupov ni.

## 5. Znane omejitve

- Odgovori so napisani po spominu – po prvih igralcih zaženi `npm run zgreseni` in dodaj manjkajoče.
- Igra potrebuje internet (three.js in supabase-js se naložita s CDN).
- Lestvica nima vzdevkov (vsi so »Planinec«).
