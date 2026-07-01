
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soundsync.stockpilot',
  appName: 'Stock Pilot',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
