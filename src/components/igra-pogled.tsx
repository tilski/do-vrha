import { createElement } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import igraHtml from '@/assets/igra/igra-html';
import { barve } from '@/theme';

type IgraPogledProps = {
  ozadje?: string;
};

// Prikaže 3D igro (three.js) iz mape igra/.
// Na telefonu v WebView, v brskalniku (npx expo start --web) v iframe.
export default function IgraPogled({ ozadje = barve.obroba }: IgraPogledProps) {
  if (Platform.OS === 'web') {
    return createElement('iframe', {
      srcDoc: igraHtml,
      style: { border: 0, flex: 1, width: '100%', height: '100%', background: ozadje },
    });
  }

  return (
    <WebView
      source={{ html: igraHtml, baseUrl: 'https://do-vrha.local/' }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      keyboardDisplayRequiresUserAction={false}
      style={[slogi.pogled, { backgroundColor: ozadje }]}
    />
  );
}

const slogi = StyleSheet.create({
  pogled: { flex: 1 },
});
