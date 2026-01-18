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

  android: {
    adjustMarginsForEdgeToEdge: 'auto',
  },
  
  plugins: {
     SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#059669',
    },
  },
};

export default config;