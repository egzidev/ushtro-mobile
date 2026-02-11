import { Stack } from 'expo-router';

export default function ProgramLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Programet' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detajet e programit' }} />
    </Stack>
  );
}
