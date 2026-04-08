import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/firebase";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import CustomImage from "@/components/high-level/custom-image";
import ActivityLoading from "@/components/high-level/activity-loading";
import { Colors } from "@/constants/colors";

function getEmployeeTodayStatus(emp) {
  const today = emp.workingHours?.[String(new Date().getDay())];
  return today?.enabled
    ? { dotColor: Colors.Green, detail: "Bugün mesaide" }
    : { dotColor: Colors.ErrorColor, detail: "Bugün izinli" };
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    const q = query(
      collection(db, "businesses", uid, "employees"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Employees snapshot error:", err);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      getDocs(query(collection(db, "businesses", uid, "employees"), orderBy("createdAt", "desc")))
        .then((snap) => {
          setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        })
        .catch((err) => console.error("Employees focus sync:", err));
    }, []),
  );

  return (
    <LayoutView
      showBackButton
      title="Ekibim"
      backgroundColor={Colors.BrandBackground}
      paddingHorizontal={0}
      onAddPress={() => router.push("/business/management/employees/form")}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityLoading style={styles.loader} />
        ) : employees.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={28} color={Colors.LightGray2} />
            </View>
            <CustomText bold fontSize={15} color={Colors.BrandPrimary}>Henüz çalışan yok</CustomText>
            <CustomText medium fontSize={13} color={Colors.LightGray2} style={styles.emptyDescription}>
              Sağ üstteki + butonuna basarak ilk çalışanını ekle.
            </CustomText>
          </View>
        ) : (
          <View style={styles.list}>
            {employees.map((emp) => {
              const todayStatus = getEmployeeTodayStatus(emp);
              return (
                <Pressable
                  key={emp.id}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  onPress={() => router.push({ pathname: "/business/management/employees/[id]", params: { id: emp.id } })}
                >
                  {emp.photoUrl ? (
                    <CustomImage uri={emp.photoUrl} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person-outline" size={18} color="#C0C0C0" />
                    </View>
                  )}
                  <View style={styles.employeeInfo}>
                    <CustomText bold color={Colors.BrandPrimary} style={styles.employeeName}>
                      {emp.name}
                    </CustomText>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: todayStatus.dotColor }]} />
                      <CustomText medium fontSize={12} color={Colors.LightGray2}>
                        {todayStatus.detail}
                      </CustomText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.LightGray2} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 112 },
  loader: { minHeight: 160 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,20,20,0.05)",
    marginBottom: 4,
  },
  emptyDescription: { textAlign: "center", lineHeight: 20, maxWidth: 240 },
  list: { gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.White,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.18)",
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  employeeInfo: { flex: 1, justifyContent: "center", gap: 4 },
  employeeName: { letterSpacing: -0.2, fontSize: 15 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
});
