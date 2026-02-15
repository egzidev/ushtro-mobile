import { Stack } from "expo-router";
import { AppHeader } from "@/components/header/app-header";

export default function ProgramIdLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ route, options, navigation }) => (
          <AppHeader
            title={(options.title as string) ?? "Detajet"}
            showBack
            onBack={() => navigation.goBack()}
          />
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Detajet" }} />
      <Stack.Screen name="day/[dayIndex]" options={{ headerShown: false }} />
    </Stack>
  );
}
