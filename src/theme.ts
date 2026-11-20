import { StyleSheet } from 'react-native';

// Skupne barve aplikacije (iste kot v 3D igri)
export const barve = {
  ozadje: '#E9F1F6', // led
  povrsina: '#FFFFFF',
  obroba: '#CFDBE5',
  besedilo: '#0F1A24', // ink
  besediloSibko: '#6F7D89', // mute
  besediloSrednje: '#3D4B58', // ink2
  primarna: '#E0312D', // rdeča
  primarnaTemna: '#B8211E',
  noc: '#13202C', // temna kartica z višino
  nocBesedilo: '#9FB3C4',
};

// Skupni razmiki
export const razmik = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

export const MIN_VISINA = 1015; // Aljažev dom v Vratih
export const VISINA_VRHA = 2864; // Triglav

// Skupni slogi, ki jih uporabljajo vsi zasloni
export const skupniSlogi = StyleSheet.create({
  zaslon: {
    flex: 1,
    backgroundColor: barve.ozadje,
  },
  vsebina: {
    padding: razmik.l,
    gap: razmik.m,
  },
  oznaka: {
    color: barve.besediloSibko,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  naslov: {
    color: barve.besedilo,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  podnaslov: {
    color: barve.besediloSrednje,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '500',
  },
  besedilo: {
    color: barve.besedilo,
    fontSize: 15,
    lineHeight: 22,
  },
  kartica: {
    backgroundColor: barve.povrsina,
    borderRadius: 22,
    padding: razmik.m,
    gap: razmik.s,
  },
});
