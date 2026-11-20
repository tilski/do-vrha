import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import Gumb from '@/components/gumb';
import { razmik, skupniSlogi } from '@/theme';
import { CATS } from '@/utils/kategorije';
import { SKUPINE } from '@/utils/dnevne-kategorije';

const PRAVILA = [
  ['⏱️', '25 s za vsako kategorijo; čas začne teči 5 sekund po tem, ko vidiš vprašanje.'],
  ['%', 'Metri so odvisni od deleža igralcev z istim odgovorom – redek odgovor da več metrov.'],
  ['↻', 'Če odgovora ni na seznamu, poskusi znova, dokler teče čas.'],
  ['⚡', 'Hitreje ko odgovoriš, več metrov (do ×1,2).'],
  ['🌫️', 'Brez odgovora: megla, ostaneš na mestu.'],
  ['📅', 'Vprašanja so vsak dan enaka za vse, nova pot ob polnoči.'],
];

// Zaslon s pravili igre
export default function NavodilaZaslon() {
  const stevilo = Object.keys(SKUPINE).map((g) => [SKUPINE[g], CATS.filter((c) => c.g === g).length] as const);

  return (
    <ScrollView style={skupniSlogi.zaslon} contentContainerStyle={skupniSlogi.vsebina}>
      <View style={skupniSlogi.kartica}>
        {PRAVILA.map(([ikona, besedilo]) => (
          <View key={besedilo} style={{ flexDirection: 'row', gap: razmik.s }}>
            <Text style={{ width: 26, fontSize: 16 }}>{ikona}</Text>
            <Text style={[skupniSlogi.besedilo, { flex: 1 }]}>{besedilo}</Text>
          </View>
        ))}
      </View>

      <Text style={skupniSlogi.oznaka}>KATEGORIJE V IGRI ({CATS.length})</Text>
      <View style={skupniSlogi.kartica}>
        {stevilo.map(([ime, n]) => (
          <View key={ime} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={skupniSlogi.besedilo}>{ime}</Text>
            <Text style={[skupniSlogi.besedilo, { fontWeight: '800' }]}>{n}</Text>
          </View>
        ))}
      </View>

      <Gumb naslov="Na pot" onPress={() => router.replace('/igra')} />
    </ScrollView>
  );
}
