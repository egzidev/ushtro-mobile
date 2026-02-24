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
            transparent={(options as Record<string, unknown>).headerTransparent as boolean | undefined}
            backOnly={(options as Record<string, unknown>).headerBackOnly as boolean | undefined}
            backIconColor={(options as Record<string, unknown>).headerBackIconColor as string | undefined}
          />
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Detajet" }} />
      <Stack.Screen
        name="overview/[dayIndex]"
        options={
          {
            title: "Dita e stërvitjes",
            headerTransparent: true,
            headerBackOnly: true,
            headerBackIconColor: "#fff",
          } as Record<string, unknown>
        }
      />
      <Stack.Screen name="day/[dayIndex]" options={{ headerShown: false }} />
    </Stack>
  );
}
