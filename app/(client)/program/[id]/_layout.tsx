import { Stack } from "expo-router";
import { AppHeader } from "@/components/header/app-header";

export default function ProgramIdLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerShadowVisible: false,
        header: ({ options, navigation }) => (
          <AppHeader
            title={(options.title as string) ?? "Detajet"}
            showBack
            onBack={() => navigation.goBack()}
            largeTitle
          />
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Detajet" }} />
      <Stack.Screen
        name="overview/[dayIndex]"
        options={{ title: "Dita e stërvitjes" }}
      />
      <Stack.Screen name="day/[dayIndex]" options={{ headerShown: false }} />
    </Stack>
  );
}
