import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "../hooks/useColorScheme";
import { ThemeProvider } from "../src/design-system";
import { useFirebaseMigration } from "../src/hooks/useFirebaseMigration";
import { useRecurringTransactions } from "../src/hooks/useRecurringTransactions";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  
  // Run Firebase migration on app startup
  const { isMigrating, migrationComplete, error } = useFirebaseMigration();
  
  // Process recurring transactions automatically
  const { isProcessing: isProcessingRecurring } = useRecurringTransactions();

  if (!loaded || isMigrating) {
    // Wait for fonts to load and migration to complete
    return null;
  }
  
  if (error) {
    console.error('Migration error:', error);
    // Continue loading the app even if migration fails
    // The app will continue using local storage
  }

  return (
    <ThemeProvider colorScheme={colorScheme || 'light'}>
      <NavigationThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="advanced-add-transaction" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="recurring-transactions" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="camera" 
            options={{ 
              headerShown: false,
              presentation: 'fullScreenModal'
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}
