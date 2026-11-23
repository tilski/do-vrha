import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Gumb from "@/components/gumb";
import KarticaKategorije from "@/components/kartica-kategorije";
import { barve, MIN_VISINA, razmik, skupniSlogi, VISINA_VRHA } from "@/theme";
import { useVprasanja } from "@/utils/baza";
import {
  danes,
  dnevneKategorije,
  formatDatuma,
  oznakaKategorije,
  stevilkaVzpona,
} from "@/utils/dnevne-kategorije";

// Začetni zaslon
export default function ZacetniZaslon() {
  const [pokaziKategorije, setPokaziKategorije] = useState(false);

  const datum = danes();
  const { vprasanja, napaka, nalaganje, znova } = useVprasanja();
  const kategorije = vprasanja.length ? dnevneKategorije(datum, vprasanja) : [];

  return (
    <SafeAreaView style={skupniSlogi.zaslon}>
      <ScrollView contentContainerStyle={skupniSlogi.vsebina}>
        <Text style={skupniSlogi.oznaka}>DNEVNA IGRA · 8 VPRAŠANJ</Text>
        <Text style={skupniSlogi.naslov}>
          Do vrha<Text style={{ color: barve.primarna }}>?</Text>
        </Text>
        <Text style={skupniSlogi.podnaslov}>
          Vsak dan 8 vprašanj – 4 o Sloveniji in 4 o svetu – za vsako en
          odgovor. Bolj kot je tvoj odgovor redek, hitreje se vzpenjaš od
          Aljaževega doma čez Prag in Kredarico na vrh Triglava.
        </Text>

        <View
          style={{
            backgroundColor: barve.noc,
            borderRadius: 22,
            padding: razmik.m,
            gap: 4,
          }}
        >
          <Text
            style={{
              color: barve.nocBesedilo,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1.5,
            }}
          >
            DO VRHA #{stevilkaVzpona(datum)} · {formatDatuma(datum)}
          </Text>
          <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800" }}>
            {MIN_VISINA} m → {VISINA_VRHA} m
          </Text>
          <Text style={{ color: "#CFE0EC", fontSize: 13 }}>
            Aljažev dom v Vratih → Triglav
          </Text>
        </View>

        <Gumb naslov="Na pot" onPress={() => router.push("/igra")} />
        <Gumb
          naslov="Kako se igra"
          varianta="obroba"
          onPress={() => router.push("/navodila")}
        />

        <Gumb
          naslov={
            pokaziKategorije
              ? "Skrij današnje kategorije"
              : "Pokaži današnje kategorije"
          }
          varianta="obroba"
          onPress={() => setPokaziKategorije(!pokaziKategorije)}
        />

        {pokaziKategorije && nalaganje && (
          <ActivityIndicator color={barve.primarna} />
        )}
        {pokaziKategorije && napaka && (
          <>
            <Text style={skupniSlogi.besedilo}>
              Kategorij ni bilo mogoče naložiti: {napaka}
            </Text>
            <Gumb naslov="Poskusi znova" varianta="obroba" onPress={znova} />
          </>
        )}
        {pokaziKategorije &&
          kategorije.map((k, i) => (
            <KarticaKategorije
              key={k.id}
              stevilka={i + 1}
              skupina={oznakaKategorije(k)}
              naslov={k.t}
              namig={k.h}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
