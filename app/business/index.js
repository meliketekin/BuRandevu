import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { getInitials } from "@/utils/general";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const STATS = [
  { label: "Günlük Gelir", value: "₺4.850", change: "+12%" },
  { label: "Aylık Gelir", value: "₺142.3k", change: "+5.4%" },
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

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) {
        setUserInfo(snap.data());
      }
    });
  }, []);

  const businessName = userInfo?.businessName ?? "Digital Atelier";
  const ownerName = userInfo?.name ?? auth.currentUser?.displayName ?? "Isletme Sahibi";

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
              <CustomText sm color={Colors.LightGray2}>
                Premium dashboard
              </CustomText>
            </View>
          </View>

          <Pressable style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]} onPress={() => router.push("/business/profil")}>
            <CustomText xs bold color={Colors.BrandPrimary}>
              {getInitials(ownerName?.trim() || businessName) || "IS"}
            </CustomText>
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeTextWrap}>
            <CustomText xs bold color="#735C00" style={styles.kicker}>
              BUGUNUN OZETI
            </CustomText>
            <CustomText bold fontSize={24} color={Colors.BrandPrimary} style={styles.welcomeTitle}>
              {ownerName}, gunun guclu basladi.
            </CustomText>
            <CustomText sm color={Colors.LightGray2} style={styles.welcomeDescription}>
              Bekleyen talepleri hizla yonet, bugunku randevulari takip et ve gelir performansini tek ekrandan gor.
            </CustomText>
          </View>
          <View style={styles.welcomeBadge}>
            <Ionicons name="trending-up-outline" size={18} color={Colors.Gold} />
          </View>
        </View>

        <View style={styles.statsRow}>
          {STATS.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <CustomText xs bold color={Colors.LightGray2} style={styles.statLabel}>
                {item.label}
              </CustomText>
              <View style={styles.statValueRow}>
                <CustomText extraBold fontSize={24} color={Colors.BrandPrimary}>
                  {item.value}
                </CustomText>
                <CustomText xs bold color={Colors.Green}>
                  {item.change}
                </CustomText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText bold fontSize={20} color={Colors.BrandPrimary}>
              Bekleyen Talepler (12)
            </CustomText>
            <Pressable onPress={() => router.push("/business/talepler")}>
              <CustomText xs bold color={Colors.Gold}>
                Tumunu Gor
              </CustomText>
            </Pressable>
          </View>

          <View style={styles.sectionBody}>
            {PENDING_REQUESTS.map((request) => (
              <View key={request.id} style={styles.requestCard}>
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

                <View style={styles.requestActions}>
                  <Pressable style={({ pressed }) => [styles.chatButton, pressed && styles.pressed]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.Gold} />
                  </Pressable>
                  <View style={styles.inlineActionGroup}>
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
            <Pressable onPress={() => router.push("/business/randevular")}>
              <CustomText xs bold color={Colors.Gold}>
                Tumunu Gor
              </CustomText>
            </Pressable>
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
  welcomeCard: {
    backgroundColor: Colors.White,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.04)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    gap: 16,
  },
  welcomeTextWrap: {
    flex: 1,
    gap: 8,
  },
  kicker: {
    letterSpacing: 2,
  },
  welcomeTitle: {
    lineHeight: 30,
  },
  welcomeDescription: {
    lineHeight: 20,
  },
  welcomeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.White,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.04)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
    gap: 6,
  },
  statLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
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
  requestLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chatButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.1)",
  },
  inlineActionGroup: {
    flexDirection: "row",
    gap: 8,
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
