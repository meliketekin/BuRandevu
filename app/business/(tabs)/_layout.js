import { useEffect, useRef, useCallback } from "react";
import { BackHandler, Pressable, StyleSheet, Animated } from "react-native";
import { Tabs, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAuthStore from "@/store/auth-store";
import useTabBarStore from "@/store/tab-bar-store";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const TAB_ITEMS = [
  { name: "home", label: "Anasayfa", icon: "home", iconOutline: "home-outline" },
  { name: "appointments", label: "Randevular", icon: "calendar", iconOutline: "calendar-outline" },
  { name: "requests", label: "Talepler", icon: "file-tray-full", iconOutline: "file-tray-full-outline" },
  { name: "management", label: "Yönetim", icon: "grid", iconOutline: "grid-outline" },
  { name: "profile", label: "Profil", icon: "person", iconOutline: "person-outline" },
];

function TabItem({ item, focused, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      scale.setValue(1.18);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 9,
        stiffness: 220,
      }).start();
    }
  }, [focused]);

  return (
    <Pressable style={styles.tabItem} onPress={onPress}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={focused ? item.icon : item.iconOutline} size={24} color={focused ? Colors.BrandPrimary : Colors.LightGray} />
      </Animated.View>
      {focused && (
        <CustomText fontSize={11} style={styles.tabLabel} color={Colors.BrandPrimary}>
          {item.label}
        </CustomText>
      )}
    </Pressable>
  );
}

function AnimatedTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const visible = useTabBarStore((s) => s.visible);
  const TAB_HEIGHT = 76 + insets.bottom;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : TAB_HEIGHT + 10,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [visible, TAB_HEIGHT]);

  return (
    <Animated.View style={[styles.tabBar, { paddingBottom: insets.bottom - 10, height: TAB_HEIGHT }, { transform: [{ translateY }] }]}>
      {TAB_ITEMS.map((item) => {
        const routeIndex = state.routes.findIndex((r) => r.name === item.name);
        const focused = state.index === routeIndex;

        return (
          <TabItem
            key={item.name}
            item={item}
            focused={focused}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: state.routes[routeIndex]?.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(item.name);
              }
            }}
          />
        );
      })}
    </Animated.View>
  );
}

export default function BusinessTabsLayout() {
  const isBusinessInfoCompleted = useAuthStore((s) => s.isBusinessInfoCompleted);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const redirected = useRef(false);

  useEffect(() => {
    if (isAdmin && !isBusinessInfoCompleted && !redirected.current) {
      redirected.current = true;
      router.replace("/auth/business-info-form");
    }
  }, [isAdmin, isBusinessInfoCompleted]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  return (
    <Tabs tabBar={(props) => <AnimatedTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="appointments" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="management" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: Colors.White,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(20,20,20,0.08)",
    elevation: 0,
    shadowOpacity: 0,
    overflow: "visible",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 8,
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
