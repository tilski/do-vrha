import { Pressable, StyleSheet, Text } from 'react-native';

import { barve, razmik } from '@/theme';

type GumbProps = {
  naslov: string;
  onPress: () => void;
  varianta?: 'primarna' | 'obroba';
};

export default function Gumb({ naslov, onPress, varianta = 'primarna' }: GumbProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [slogi.gumb, slogi[varianta], pressed && slogi.pritisnjen]}>
      <Text style={[slogi.besedilo, varianta === 'obroba' && slogi.besediloObroba]}>{naslov}</Text>
    </Pressable>
  );
}

const slogi = StyleSheet.create({
  gumb: {
    paddingVertical: razmik.m,
    paddingHorizontal: razmik.l,
    borderRadius: 999,
    alignItems: 'center',
  },
  primarna: { backgroundColor: barve.primarna },
  obroba: { backgroundColor: barve.povrsina, borderWidth: 1, borderColor: barve.obroba },
  pritisnjen: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  besedilo: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  besediloObroba: { color: barve.besedilo },
});
