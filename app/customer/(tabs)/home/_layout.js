import { Stack } from "expo-router";

export default function CustomerHomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="business-list" options={{ headerShown: false }} />
    </Stack>
  );
}
