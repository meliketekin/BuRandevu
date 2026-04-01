import { Stack } from "expo-router";
import useTabBarStore from "@/store/tab-bar-store";

export default function ManagementLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 280,
      }}
      screenListeners={{
        state: (e) => {
          const routes = e.data.state?.routes;
          if (!routes) return;
          const current = routes[routes.length - 1];
          useTabBarStore.getState().setVisible(current?.name === "index");
        },
      }}
    >
      <Stack.Screen name="index" options={{ animation: "none" }} />
    </Stack>
  );
}
