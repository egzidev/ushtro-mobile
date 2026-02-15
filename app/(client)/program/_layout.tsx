import { Stack } from 'expo-router';
import { AppHeader } from '@/components/header/app-header';

export default function ProgramLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        header: ({ route, options, navigation }) => {
          const showBack = route.name === '[id]' || route.name === 'history' || route.name?.startsWith('history/');
          const largeTitle = route.name === 'index' || route.name === 'history/index';
          return (
            <AppHeader
              title={options.title as string}
              showBack={showBack}
              onBack={() => navigation.goBack()}
              largeTitle={largeTitle}
            />
          );
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ushtrimet' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="history/index"
        options={{ title: 'Historia e stërvitjes' }}
      />
      <Stack.Screen
        name="history/[sessionId]"
        options={{ title: 'Historia e stërvitjes' }}
      />
    </Stack>
  );
}
