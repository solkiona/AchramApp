// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.achrams.ride1',
  appName: 'ACHRAMS Passenger',
  webDir: 'public', // Even if unused, Capacitor expects this

  server: {
    // url: 'https://ride.achrams.com.ng',
    url: 'https://achram-app.vercel.app',
    errorPath: 'offline.html',
    androidScheme: 'https',
  },

  android: {
    adjustMarginsForEdgeToEdge: 'disable',
  },
  
  plugins: {
     SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: "#6AB148",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#059669',
    },
  },
};

export default config;