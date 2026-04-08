import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import general from "@/utils/general";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const QUICK_ACTIONS = [
  {
    id: "appointments",
    title: "Randevular Sekmesini Ac",
    icon: "calendar-outline",
    route: "/business/appointments",
  },
  {
    id: "requests",
    title: "Talepler Sekmesini Ac",
    icon: "file-tray-full-outline",
    route: "/business/requests",
  },
  {
    id: "management",
    title: "Yonetim Sekmesini Ac",
    icon: "grid-outline",
    route: "/business/management",
  },
];

const PENDING_REQUESTS = [
  {
    id: "1",
    initials: "AK",
    name: "Ahmet Karahan",
    detail: "Sakal Tasarımı & Bakım",
    time: "14:30",
  },
  {
    id: "2",
    initials: "MY",
    name: "Mert Yılmaz",
    detail: "Klasik Saç Kesimi",
    time: "15:15",
  },
];

const TODAY_APPOINTMENTS = [
  {
    id: "1",
    name: "Caner Ozdemir",
    service: "Modern Kesim",
    time: "10:00",
    status: "DEVAM EDIYOR",
    active: true,
  },
  {
    id: "2",
    name: "Burak Aydin",
    service: "Sac & Sakal",
    time: "11:30",
    status: "SIRADAKI",
  },
  {
    id: "3",
    name: "Kemal Sunal",
    service: "Komple Bakim",
    time: "13:00",
    status: "BEKLENIYOR",
  },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const [userInfo, setUserInfo] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) setUserInfo(snap.data());
    });
    getDoc(doc(db, "businesses", uid)).then((snap) => {
      if (snap.exists()) setBusinessInfo(snap.data());
    });
  }, []);

  const businessName = businessInfo?.businessName ?? "Digital Atelier";
  const ownerName = userInfo?.name ?? auth.currentUser?.displayName ?? "İşletme sahibi";

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 112 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Ionicons name="grid-outline" size={22} color={Colors.LightGray2} />
            </Pressable>
            <View>
              <CustomText extraBold fontSize={22} color={Colors.BrandPrimary} style={styles.brandText}>
                {businessName}
              </CustomText>
            </View>
          </View>

          <Pressable style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]} onPress={() => router.push("/business/profil")}>
            <CustomText xs bold color={Colors.BrandPrimary}>
              {general.getInitials(ownerName?.trim() || businessName) || "IS"}
            </CustomText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText bold fontSize={22} color={Colors.BrandPrimary}>
              Hizli Islemler
            </CustomText>
          </View>

          <View style={styles.quickActionsList}>
          {QUICK_ACTIONS.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.quickActionButton, pressed && styles.pressed]}
              onPress={() => router.push(item.route)}
            >
              <View style={styles.quickActionLeft}>
                <View style={styles.quickActionIconWrap}>
                  <Ionicons name={item.icon} size={20} color={Colors.White} />
                </View>
                <CustomText bold fontSize={15} color={Colors.White} style={styles.quickActionText}>
                  {item.title}
                </CustomText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.Gold} />
            </Pressable>
          ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText bold fontSize={20} color={Colors.BrandPrimary}>
              Bekleyen Talepler (12)
            </CustomText>
          </View>

          <View style={styles.sectionBody}>
            {PENDING_REQUESTS.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeaderRow}>
                  <View style={styles.requestLeft}>
                    <View style={styles.requestAvatar}>
                      <CustomText xs bold color={Colors.BrandPrimary}>
                        {request.initials}
                      </CustomText>
                    </View>
                    <View style={styles.requestInfo}>
                      <CustomText bold sm color={Colors.BrandPrimary}>
                        {request.name}
                      </CustomText>
                      <CustomText minx color={Colors.LightGray2}>
                        {request.detail} • {request.time}
                      </CustomText>
                    </View>
                  </View>

                  <View style={styles.requestTopActions}>
                    <Pressable style={({ pressed }) => [styles.approveButton, pressed && styles.pressed]}>
                      <CustomText minx bold color={Colors.White}>
                        Onayla
                      </CustomText>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]}>
                      <CustomText minx bold color={Colors.LightGray2}>
                        Red
                      </CustomText>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.requestPhoneButton, pressed && styles.pressed]}>
                      <Ionicons name="call-outline" size={16} color={Colors.Gold} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText bold fontSize={20} color={Colors.BrandPrimary}>
              Bugunku Randevular (8)
            </CustomText>
          </View>

          <View style={styles.appointmentsCard}>
            {TODAY_APPOINTMENTS.map((appointment, index) => (
              <View key={appointment.id} style={[styles.appointmentRow, index < TODAY_APPOINTMENTS.length - 1 && styles.appointmentBorder]}>
                <View style={styles.appointmentLeft}>
                  <View style={styles.appointmentAvatar}>
                    <Ionicons name="person-outline" size={18} color={Colors.BrandPrimary} />
                  </View>
                  <View style={styles.appointmentInfo}>
                    <CustomText bold sm color={Colors.BrandPrimary}>
                      {appointment.name}
                    </CustomText>
                    <CustomText min color={Colors.LightGray2} style={styles.appointmentMeta}>
                      {appointment.service.toUpperCase()} • {appointment.time}
                    </CustomText>
                  </View>
                </View>

                <View style={styles.appointmentRight}>
                  <View style={[styles.statusBadge, appointment.active && styles.statusBadgeActive]}>
                    <CustomText min bold color={appointment.active ? "#1B7A43" : Colors.LightGray2}>
                      {appointment.status}
                    </CustomText>
                  </View>
                  <Pressable style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}>
                    <Ionicons name="send-outline" size={16} color={Colors.LightGray2} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  brandText: {
    letterSpacing: -0.6,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.05)",
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.2)",
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeLinkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  linkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.05)",
  },
  quickActionsList: {
    gap: 12,
    marginHorizontal: -4,
  },
  quickActionButton: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: Colors.BrandPrimary,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  quickActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  quickActionText: {
    letterSpacing: -0.2,
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionBody: {
    gap: 10,
  },
  requestCard: {
    backgroundColor: Colors.White,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.04)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
    gap: 14,
  },
  requestHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  requestLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  requestAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  requestInfo: {
    flex: 1,
    gap: 2,
  },
  requestTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requestPhoneButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.1)",
  },
  approveButton: {
    minWidth: 68,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BrandPrimary,
  },
  rejectButton: {
    minWidth: 52,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F1F1",
  },
  appointmentsCard: {
    backgroundColor: Colors.White,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.04)",
    overflow: "hidden",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  appointmentRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  appointmentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20,20,20,0.05)",
  },
  appointmentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  appointmentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentInfo: {
    flex: 1,
    gap: 2,
  },
  appointmentMeta: {
    letterSpacing: 0.5,
  },
  appointmentRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeActive: {
    backgroundColor: "#EAF8F0",
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
