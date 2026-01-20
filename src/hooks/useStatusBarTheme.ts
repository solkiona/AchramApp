// src/hooks/useStatusBarTheme.ts
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * A custom hook to control the native status bar appearance.
 * 
 * @param isDarkMode - If true, uses light text/icons on dark background.
 *                     If false, uses dark text/icons on light background.
 */


export const useStatusBarTheme = (isDarkMode: boolean) => {
  useEffect(() => {
    // Only run on native platforms (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const applyStatusBarStyle = async () => {
      try {
        // Set icon/text color style
        const style = isDarkMode ? Style.Light : Style.Dark;
        await StatusBar.setStyle({ style });

        // On Android, optionally set background color
        if (Capacitor.getPlatform() === 'android') {
          const backgroundColor = isDarkMode ? '#059669' : '#059669';
          await StatusBar.setBackgroundColor({ color: backgroundColor });
        }

        // Optional: prevent status bar from overlaying web content
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.warn('Failed to configure status bar:', err);
      }
    };

    applyStatusBarStyle();
  }, [isDarkMode]);
};