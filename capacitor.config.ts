import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nomoretube.app',
  appName: 'NoMoreTube',
  webDir: 'out',
  server: {
    url: 'https://nalgo-tube.soohyun4747.workers.dev/',
    cleartext: false,
  },
};

export default config;
