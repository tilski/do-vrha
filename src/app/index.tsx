import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Gumb from '@/components/gumb';
import KarticaKategorije from '@/components/kartica-kategorije';
import { barve, MIN_VISINA, razmik, skupniSlogi, VISINA_VRHA } from '@/theme';
import { danes, dnevneKategorije, formatDatuma, SKUPINE, stevilkaVzpona } from '@/utils/dnevne-kategorije';

// Začetni zaslon
export default function ZacetniZaslon() {
  const [pokaziKategorije, setPokaziKategorije] = useState(false);

  const datum = danes();
  const kategorije = dnevneKategorije(datum);

  return (
    <SafeAreaView style={skupniSlogi.zaslon}>
      <ScrollView contentContainerStyle={skupniSlogi.vsebina}>
        <Text style={skupniSlogi.oznaka}>DNEVNA IGRA · 8 VPRAŠANJ</Text>
        <Text style={skupniSlogi.naslov}>
          Do vrha<Text style={{ color: barve.primarna }}>?</Text>
        </Text>
        <Text style={skupniSlogi.podnaslov}>
          Vsak dan 8 slovenskih kategorij, za vsako en odgovor. Bolj kot je tvoj odgovor redek, hitreje
          se vzpenjaš od Aljaževega doma čez Prag in Kredarico na vrh Triglava.
        </Text>

        <View style={{ backgroundColor: barve.noc, borderRadius: 22, padding: razmik.m, gap: 4 }}>
          <Text style={{ color: barve.nocBesedilo, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
            DO VRHA #{stevilkaVzpona(datum)} · {formatDatuma(datum)}
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '800' }}>
            {MIN_VISINA} m → {VISINA_VRHA} m
          </Text>
          <Text style={{ color: '#CFE0EC', fontSize: 13 }}>Aljažev dom v Vratih → Triglav</Text>
        </View>

        <Gumb naslov="Na pot" onPress={() => router.push('/igra')} />
        <Gumb naslov="Kako se igra" varianta="obroba" onPress={() => router.push('/navodila')} />

        <Gumb
          naslov={pokaziKategorije ? 'Skrij današnje kategorije' : 'Pokaži današnje kategorije'}
          varianta="obroba"
          onPress={() => setPokaziKategorije(!pokaziKategorije)}
        />

        {pokaziKategorije &&
          kategorije.map((k, i) => (
            <KarticaKategorije
              key={k.id}
              stevilka={i + 1}
              skupina={SKUPINE[k.g] ?? k.g}
              naslov={k.t}
              namig={k.h}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
