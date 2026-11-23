import { SafeAreaView } from 'react-native-safe-area-context';

import IgraPogled from '@/components/igra-pogled';
import { barve, skupniSlogi } from '@/theme';

// Zaslon igre: 3D vzpon na Triglav (igra/src.html + igra/baza/)
export default function IgraZaslon() {
  return (
    <SafeAreaView style={[skupniSlogi.zaslon, { backgroundColor: barve.obroba }]} edges={['top']}>
      <IgraPogled />
    </SafeAreaView>
  );
}
