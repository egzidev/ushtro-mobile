import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useTheme } from '@/contexts/theme-context';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' | null {
  const [hasHydrated, setHasHydrated] = useState(false);
  const theme = useTheme();
  const system = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) return 'light';
  if (theme) return theme.colorScheme;
  return system;
}
