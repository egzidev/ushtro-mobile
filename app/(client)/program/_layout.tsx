import { Stack } from 'expo-router';
import { AppHeader } from '@/components/header/app-header';

export default function ProgramLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ route, options, navigation }) => (
          <AppHeader
            title={options.title as string}
            showBack={route.name === '[id]'}
            onBack={() => navigation.goBack()}
          />
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Programet' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detajet' }} />
    </Stack>
  );
}
