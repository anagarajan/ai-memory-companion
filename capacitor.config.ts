import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mecoai.app',
  appName: 'MeCo AI',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'MeCo AI',
  },
  server: {
    // Allow inline media playback (needed for voice recording UI)
    iosScheme: 'capacitor',
  },
};

export default config;
