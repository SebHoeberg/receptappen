import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

// Förhindrar att startskärmen döljs automatiskt innan appen är redo.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // Anpassar appens tema efter telefonens inställning för ljust eller mörkt läge.
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      {/* Definierar appens huvudnavigation utan standardrubriker. */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recipe-detail" />
      </Stack>
    </ThemeProvider>
  );
}
