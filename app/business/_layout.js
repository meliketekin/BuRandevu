import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "@/store/auth-store";

export default function BusinessLayout() {
  const isBusinessInfoCompleted = useAuthStore((s) => s.isBusinessInfoCompleted);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const redirected = useRef(false);
  const yonetimLabel = isAdmin ? "Yönetim" : "Yönet";

  useEffect(() => {
    if (isAdmin && !isBusinessInfoCompleted && !redirected.current) {
      redirected.current = true;
      router.replace("/auth/business-info-form");
    }
  }, [isAdmin, isBusinessInfoCompleted]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Anasayfa",
          tabBarLabel: "Anasayfa",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Randevular",
          tabBarLabel: "Randevular",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Talepler",
          tabBarLabel: "Talepler",
          tabBarIcon: ({ color, size }) => <Ionicons name="file-tray-full-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: yonetimLabel,
          tabBarLabel: yonetimLabel,
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
