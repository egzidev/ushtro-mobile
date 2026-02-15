import { Stack } from 'expo-router';
import { AppHeader } from '@/components/header/app-header';

export default function ProgramLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ route, options, navigation }) => (
          <AppHeader
            title={options.title as string}
            showBack={route.name === '[id]' || route.name?.startsWith('history/')}
            onBack={() => navigation.goBack()}
          />
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ushtrimet' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="history/[sessionId]"
        options={{ title: 'Historia e stërvitjes' }}
      />
    </Stack>
  );
}
