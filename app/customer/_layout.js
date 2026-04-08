import { Stack } from "expo-router";

export default function CustomerRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="business-detail" options={{ headerShown: false }} />
      <Stack.Screen name="create-appointment" options={{ headerShown: false }} />
    </Stack>
  );
}
