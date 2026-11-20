import { StyleSheet, Text, View } from 'react-native';

import { barve, razmik } from '@/theme';

type KarticaKategorijeProps = {
  stevilka: number;
  skupina: string;
  naslov: string;
  namig: string;
};

// Ena kategorija iz današnjega vzpona
export default function KarticaKategorije({ stevilka, skupina, naslov, namig }: KarticaKategorijeProps) {
  return (
    <View style={slogi.kartica}>
      <View style={slogi.krog}>
        <Text style={slogi.stevilka}>{stevilka}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={slogi.skupina}>{skupina.toUpperCase()}</Text>
        <Text style={slogi.naslov}>{naslov}</Text>
        <Text style={slogi.namig}>{namig}</Text>
      </View>
    </View>
  );
}

const slogi = StyleSheet.create({
  kartica: {
    flexDirection: 'row',
    gap: razmik.m,
    backgroundColor: barve.povrsina,
    borderRadius: 18,
    padding: razmik.m,
    alignItems: 'center',
  },
  krog: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: barve.noc,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stevilka: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  skupina: { color: barve.primarna, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  naslov: { color: barve.besedilo, fontSize: 16, fontWeight: '700' },
  namig: { color: barve.besediloSibko, fontSize: 13 },
});
