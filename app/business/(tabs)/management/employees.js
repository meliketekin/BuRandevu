import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomImage from "@/components/high-level/custom-image";
import { Colors } from "@/constants/colors";
import { EMPLOYEES } from "./employees-data";

export default function Employees() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.BrandPrimary} />
        </Pressable>
        <CustomText extraBold fontSize={22} color={Colors.BrandPrimary} style={styles.headerTitle}>
          Ekibim
        </CustomText>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          onPress={() => router.push("/business/management/create")}
        >
          <View style={styles.addButtonInner}>
            <Ionicons name="add" size={20} color={Colors.White} />
          </View>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 112 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Employee Cards */}
        <View style={styles.list}>
          {EMPLOYEES.map((emp) => (
            <Pressable
              key={emp.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: "/business/management/[id]",
                  params: { id: emp.id },
                })
              }
            >
              <CustomImage uri={emp.image} style={styles.avatar} contentFit="cover" />
              <View style={styles.employeeInfo}>
                <CustomText bold color={Colors.BrandPrimary} style={styles.employeeName}>
                  {emp.name}
                </CustomText>
                <CustomText interMedium fontSize={12} color={Colors.LightGray2}>
                  {emp.role}
                </CustomText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.LightGray2} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BrandBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.BrandBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(20,20,20,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.Gold,
    shadowColor: Colors.Gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  list: {
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.White,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.18)",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  employeeName: {
    letterSpacing: -0.2,
    fontSize: 15,
  },
  employeeInfo: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});
