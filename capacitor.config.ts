// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.achrams.passenger',
  appName: 'ACHRAMS Passenger',
  webDir: 'public', // Even if unused, Capacitor expects this

  server: {
    url: 'https://achram-app.vercel.app',
    errorPath: 'offline.html',
    androidScheme: 'https',
  },

  android: {
    adjustMarginsForEdgeToEdge: 'auto',
  },
  
  plugins: {
     SplashScreen: {
      launchShowDuration:0,
      launchAutoHide: true,
      showSpinner: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#059669',
    },
  },
};

export default config;