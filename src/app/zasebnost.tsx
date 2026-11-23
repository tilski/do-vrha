import { ScrollView, Text, View } from 'react-native';

import { razmik, skupniSlogi } from '@/theme';
import { ZASEBNOST } from '@/utils/zasebnost';

// Zaslon s politiko zasebnosti
export default function ZasebnostZaslon() {
  return (
    <ScrollView style={skupniSlogi.zaslon} contentContainerStyle={skupniSlogi.vsebina}>
      {ZASEBNOST.map(({ naslov, besedilo }) => (
        <View key={naslov} style={{ gap: razmik.s }}>
          <Text style={skupniSlogi.oznaka}>{naslov.toUpperCase()}</Text>
          <Text style={skupniSlogi.besedilo}>{besedilo}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
