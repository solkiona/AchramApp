// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.achrams.passenger',
  appName: 'ACHRAMS Passenger',
  webDir: 'public', // Even if unused, Capacitor expects this

  server: {
    url: 'https://achram-app.vercel.app',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      androidSplashResourceName: "splash",
      backgroundColor: '#059669',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#059669',
    },
  },
};

export default config;