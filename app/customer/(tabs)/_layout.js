import { router, Tabs, useSegments } from "expo-router";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useEffect, useRef } from "react";
import { Animated, BackHandler, Pressable, Text, StyleSheet, View } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import DrawerSceneWrapper from "@/components/high-level/drawer-scene-wrapper";
import SideMenu from "@/components/high-level/side-menu";
import { useDrawerStore } from "@/stores/drawer-store";

const TAB_ICON_SIZE = 24;

const TAB_ICONS = {
  home: {
    active: "home",
    inactive: "home-outline",
  },
  appointments: {
    active: "calendar",
    inactive: "calendar-outline",
  },
  favorites: {
    active: "heart",
    inactive: "heart-outline",
  },
  profile: {
    active: "person",
    inactive: "person-outline",
  },
};

const HIDDEN_TAB_ROUTES = ["business-list"];

function AnimatedTabBar({ hidden, ...props }) {
  const translateY = useRef(new Animated.Value(hidden ? 120 : 0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: hidden ? 120 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [hidden, translateY]);

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "auto"}
      style={[
        styles.animatedTabBar,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

function CenterActionButton() {
  return (
    <View style={styles.centerButtonOuter}>
      <Pressable style={styles.centerButton} onPress={() => router.push("/customer/home/business-list")}>
        <Ionicons name="add" size={38} color={Colors.White} />
      </Pressable>
    </View>
  );
}

export default function CustomerLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const shouldHideTabBar = HIDDEN_TAB_ROUTES.includes(currentRoute);
  const { isOpen, openDrawer, closeDrawer } = useDrawerStore();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <Drawer
      open={isOpen}
      onOpen={openDrawer}
      onClose={closeDrawer}
      drawerType="slide"
      drawerStyle={styles.drawer}
      overlayStyle={styles.overlay}
      renderDrawerContent={() => <SideMenu />}
    >
      <DrawerSceneWrapper isAnimatedWithSideMenu={true}>
        <Tabs
          initialRouteName="home"
          tabBar={(props) => <AnimatedTabBar {...props} hidden={shouldHideTabBar} />}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors.BrandPrimary,
            tabBarInactiveTintColor: Colors.LightGray,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarItemStyle: styles.tabBarItem,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: "Ana Sayfa",
              tabBarLabel: ({ focused, color }) => (focused ? <Text style={[styles.tabBarLabel, { color }]}>Ana Sayfa</Text> : null),
              tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? TAB_ICONS.home.active : TAB_ICONS.home.inactive} size={size ?? TAB_ICON_SIZE} color={color} />,
            }}
          />
          <Tabs.Screen
            name="appointments"
            options={{
              title: "Randevularım",
              tabBarLabel: ({ focused, color }) => (focused ? <Text style={[styles.tabBarLabel, { color }]}>Randevularım</Text> : null),
              tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? TAB_ICONS.appointments.active : TAB_ICONS.appointments.inactive} size={size ?? TAB_ICON_SIZE} color={color} />,
            }}
          />
          <Tabs.Screen
            name="create-action"
            options={{
              title: "",
              tabBarLabel: () => null,
              tabBarIcon: () => null,
              tabBarButton: () => <CenterActionButton />,
            }}
          />

          <Tabs.Screen
            name="favorites"
            options={{
              title: "Favoriler",
              tabBarLabel: ({ focused, color }) => (focused ? <Text style={[styles.tabBarLabel, { color }]}>Favorilerim</Text> : null),
              tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? TAB_ICONS.favorites.active : TAB_ICONS.favorites.inactive} size={size ?? TAB_ICON_SIZE} color={color} />,
            }}
          />

          <Tabs.Screen
            name="profile"
            options={{
              title: "Profil",
              tabBarLabel: ({ focused, color }) => (focused ? <Text style={[styles.tabBarLabel, { color }]}>Profil</Text> : null),
              tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? TAB_ICONS.profile.active : TAB_ICONS.profile.inactive} size={size ?? TAB_ICON_SIZE} color={color} />,
            }}
          />
        </Tabs>
      </DrawerSceneWrapper>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  animatedTabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    overflow: "visible",
  },
  drawer: {
    backgroundColor: Colors.BrandDark,
    width: 100,
  },
  overlay: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 86,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: Colors.White,
    borderTopWidth: 0.5,
    elevation: 0,
    shadowOpacity: 0,
    overflow: "visible",
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  centerButtonOuter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BrandPrimary,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
});
