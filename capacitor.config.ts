import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.partygames.app',
  appName: 'Party Games',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#020617'
  }
};

export default config;
