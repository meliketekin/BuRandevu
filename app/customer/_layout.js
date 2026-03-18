import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { View, Text, StyleSheet } from "react-native";

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

export default function CustomerLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.BrandPrimary,
        tabBarInactiveTintColor: Colors.LightGray,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
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
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 80,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderColor,
    elevation: 8,
    shadowColor: Colors.BrandDark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: Colors.White,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  tabBarItem: {
    paddingVertical: 4,
  },
});
