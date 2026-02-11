import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@ushtro/theme';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  colorScheme: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  const colorScheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme ?? 'light') : preference;

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setPreferenceState(stored);
        }
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_KEY, pref);
    } catch {
      // ignore
    }
  }, []);

  const value: ThemeContextValue = {
    preference: loaded ? preference : 'system',
    colorScheme,
    setPreference,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return ctx;
}
