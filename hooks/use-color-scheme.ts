import { useColorScheme as useRNColorScheme } from 'react-native';
import { useTheme } from '@/contexts/theme-context';

export function useColorScheme(): 'light' | 'dark' | null {
  const theme = useTheme();
  const system = useRNColorScheme();
  if (theme) return theme.colorScheme;
  return system;
}
