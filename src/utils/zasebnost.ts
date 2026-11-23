// Politika zasebnosti – isto besedilo je v docs/zasebnost.html (javni URL za Google Play in App Store).
// Pred objavo izpolni KONTAKT in preveri regijo strežnika v Supabase (Project Settings › General).

export const KONTAKT = '[tvoj e-naslov]';
export const VELJA_OD = '23. 11. 2026';

export const ZASEBNOST: { naslov: string; besedilo: string }[] = [
  {
    naslov: 'Na kratko',
    besedilo:
      'Do vrha? ne zahteva registracije in ne zbira tvojega imena, e-pošte, telefonske številke, lokacije ali stikov. ' +
      'Ni oglasov, ni sledenja za oglaševanje in podatkov ne prodajamo.',
  },
  {
    naslov: 'Katere podatke shranimo',
    besedilo:
      '• Naključni anonimni identifikator, ki ga ob prvem zagonu ustvari naš ponudnik baze (Supabase). Z njim ločimo igre različnih igralcev; ne vsebuje podatkov o tebi.\n' +
      '• Tvoje odgovore na dnevna vprašanja, doseženo višino in datum igre.\n' +
      '• Odgovore, ki jih igra ni našla na seznamu – z njimi izboljšujemo vprašanja.\n' +
      '• V tvoji napravi: napredek današnje igre in današnja vprašanja (da igra deluje tudi ob slabi povezavi).',
  },
  {
    naslov: 'Zakaj',
    besedilo:
      'Samo za delovanje igre: iz odgovorov vseh igralcev izračunamo, kako redek je posamezen odgovor (od tega je odvisno, ' +
      'koliko metrov dobiš), prikažemo dnevno lestvico in najpogostejše odgovore ter dopolnjujemo sezname odgovorov.',
  },
  {
    naslov: 'Kdo vidi podatke',
    besedilo:
      'Drugi igralci na lestvici vidijo doseženo višino in najpogostejše odgovore dneva, vendar brez imen – vsak igralec je prikazan kot »Planinec«. ' +
      'Podatki so shranjeni pri ponudniku Supabase (Supabase Inc.), ki jih obdeluje v našem imenu. ' +
      'Knjižnice za igro se naložijo s storitve jsDelivr, pisave pa z Google Fonts; ti ponudniki pri tem vidijo tvoj naslov IP, kot pri obisku katere koli spletne strani.',
  },
  {
    naslov: 'Hramba in izbris',
    besedilo:
      'Podatke iger hranimo, dokler je igra na voljo. Ker so anonimni, jih ne moremo povezati s tabo; ko odstraniš aplikacijo, se izgubi tudi povezava ' +
      'med tvojo napravo in tvojimi igrami. Če želiš, da izbrišemo podatke, nam piši na ' + KONTAKT + '.',
  },
  {
    naslov: 'Tvoje pravice',
    besedilo:
      'Po Splošni uredbi o varstvu podatkov (GDPR) imaš pravico do dostopa, popravka in izbrisa podatkov ter do ugovora. ' +
      'Za vprašanja nam piši na ' + KONTAKT + '. Pritožbo lahko vložiš pri Informacijskem pooblaščencu Republike Slovenije (www.ip-rs.si).',
  },
  {
    naslov: 'Spremembe',
    besedilo: 'Če politiko spremenimo, bo nova različica objavljena v aplikaciji in na spletni strani. Velja od ' + VELJA_OD + '.',
  },
];
