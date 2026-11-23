import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import Gumb from "@/components/gumb";
import { barve, razmik, skupniSlogi } from "@/theme";
import { useVprasanja } from "@/utils/baza";
import { OBSEGI } from "@/utils/dnevne-kategorije";

const PRAVILA = [
  [
    "⏱️",
    "25 s za vsako kategorijo; čas začne teči 5 sekund po tem, ko vidiš vprašanje.",
  ],
  [
    "%",
    "Metri so odvisni od deleža igralcev z istim odgovorom – redek odgovor da več metrov.",
  ],
  ["↻", "Če odgovora ni na seznamu, poskusi znova, dokler teče čas."],
  ["⚡", "Hitreje ko odgovoriš, več metrov (do ×1,2)."],
  ["🌫️", "Brez odgovora: megla, ostaneš na mestu."],
  ["🌍", "Vsak dan 4 kategorije o Sloveniji in 4 o svetu."],
  ["📅", "Vprašanja so vsak dan enaka za vse, nova pot ob polnoči."],
];

// Zaslon s pravili igre
export default function NavodilaZaslon() {
  const { vprasanja: CATS, napaka, nalaganje, znova } = useVprasanja();
  // ena vrstica na kategorijo: ime in število vprašanj
  const kategorije = [...new Set(CATS.map((c) => c.g))];
  const stevilo = kategorije.map(
    (g) => [g, CATS.filter((c) => c.g === g).length] as const,
  );
  const poObsegu = OBSEGI.map(
    (obseg, s) =>
      `${CATS.filter((c) => c.s === s).length} ${obseg === "Slovenija" ? "o Sloveniji" : "o svetu"}`,
  );
  const odgovorov = CATS.reduce((vsota, c) => vsota + c.n, 0);

  return (
    <ScrollView
      style={skupniSlogi.zaslon}
      contentContainerStyle={skupniSlogi.vsebina}
    >
      <View style={skupniSlogi.kartica}>
        {PRAVILA.map(([ikona, besedilo]) => (
          <View key={besedilo} style={{ flexDirection: "row", gap: razmik.s }}>
            <Text style={{ width: 26, fontSize: 16 }}>{ikona}</Text>
            <Text style={[skupniSlogi.besedilo, { flex: 1 }]}>{besedilo}</Text>
          </View>
        ))}
      </View>

      {nalaganje && <ActivityIndicator color={barve.primarna} />}
      {napaka && (
        <>
          <Text style={skupniSlogi.besedilo}>
            Vprašanj ni bilo mogoče naložiti: {napaka}
          </Text>
          <Gumb naslov="Poskusi znova" varianta="obroba" onPress={znova} />
        </>
      )}
      {CATS.length > 0 && (
        <>
          <Text style={skupniSlogi.oznaka}>
            {kategorije.length} KATEGORIJ · {CATS.length} VPRAŠANJ · {odgovorov}{" "}
            ODGOVOROV
          </Text>
          <Text style={skupniSlogi.besedilo}>{poObsegu.join(" · ")}</Text>
          <View style={skupniSlogi.kartica}>
            {stevilo.map(([ime, n]) => (
              <View
                key={ime}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={skupniSlogi.besedilo}>{ime}</Text>
                <Text style={[skupniSlogi.besedilo, { fontWeight: "800" }]}>
                  {n}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Gumb naslov="Na pot" onPress={() => router.replace("/igra")} />
    </ScrollView>
  );
}
