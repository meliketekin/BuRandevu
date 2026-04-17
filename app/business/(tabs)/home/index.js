import { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import general from "@/utils/general";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";

const PALETTE = {
  surface: "#FFFFFF",
  muted: "#7B7B7B",
  border: "rgba(20,20,20,0.08)",
  goldSoft: "rgba(212,175,55,0.14)",
};

const QUICK_ACTIONS = [
  { id: "appointments", title: "Randevular Sekmesini Ac", icon: "calendar-outline", route: "/business/appointments" },
  { id: "requests", title: "Talepler Sekmesini Ac", icon: "file-tray-full-outline", route: "/business/requests" },
  { id: "management", title: "Yonetim Sekmesini Ac", icon: "grid-outline", route: "/business/management" },
];

function getTodayStr() {
  return new Date().toLocaleDateString("sv");
}

export default function Home() {
  const insets = useSafeAreaInsets();

  const isAdmin = useAuthStore((s) => s.isAdmin);
  const userType = useAuthStore((s) => s.userType);
  const storedBusinessId = useAuthStore((s) => s.businessId);
  const isEmployee = userType === "business" && !isAdmin;
  const currentUid = auth.currentUser?.uid;
  const bizId = isEmployee ? storedBusinessId : currentUid;

  const [userInfo, setUserInfo] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingToday, setLoadingToday] = useState(true);
  const [resolving, setResolving] = useState(null);
  /** "approved" | "rejected" — sadece ilgili butonda loading */
  const [resolvingAction, setResolvingAction] = useState(null);

  useEffect(() => {
    if (!currentUid) return;
    getDoc(doc(db, "users", currentUid)).then((snap) => {
      if (snap.exists()) setUserInfo(snap.data());
    });
  }, [currentUid]);

  useEffect(() => {
    if (!bizId) return;
    getDoc(doc(db, "businesses", bizId)).then((snap) => {
      if (snap.exists()) setBusinessInfo(snap.data());
    });
  }, [bizId]);

  const enrichAppointments = useCallback((items) => {
    return items.map((a) => ({
      ...a,
      customerName: a.customerName || "Müşteri",
      serviceName: (a.serviceNames ?? []).join(", "),
    }));
  }, []);

  const refreshTodayAppointments = useCallback(async () => {
    if (!bizId) return;
    try {
      const todayStr = getTodayStr();
      const snap = await getDocs(
        query(
          collection(db, "appointments"),
          where("businessId", "==", bizId),
          where("date", "==", todayStr),
          where("status", "==", "approved")
        )
      );
      let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (isEmployee) {
        items = items.filter((a) => Object.values(a.employeeIds ?? {}).includes(currentUid));
      }
      setTodayAppointments(
        enrichAppointments([...items].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")))
      );
    } catch (e) {
      console.error("Bugünkü randevular yenilenemedi:", e);
    }
  }, [bizId, isEmployee, currentUid, enrichAppointments]);

  useEffect(() => {
    if (!bizId) { setLoadingRequests(false); return; }

    const fetchPending = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "appointments"), where("businessId", "==", bizId), where("status", "==", "pending"))
        );
        let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (isEmployee) {
          items = items.filter((a) => Object.values(a.employeeIds ?? {}).includes(currentUid));
        }
        setPendingRequests(enrichAppointments(items));
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchPending();
  }, [bizId, isEmployee, currentUid, enrichAppointments]);

  useEffect(() => {
    if (!bizId) { setLoadingToday(false); return; }
    let cancelled = false;
    setLoadingToday(true);
    refreshTodayAppointments().finally(() => {
      if (!cancelled) setLoadingToday(false);
    });
    return () => {
      cancelled = true;
    };
  }, [bizId, isEmployee, currentUid, refreshTodayAppointments]);

  const handleResolve = useCallback(async (requestId, newStatus) => {
    const request = pendingRequests.find((r) => r.id === requestId);
    if (!request || !bizId) return;

    setResolving(requestId);
    setResolvingAction(newStatus);
    try {
      await updateDoc(doc(db, "appointments", requestId), { status: newStatus });
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (newStatus === "approved") {
        await refreshTodayAppointments();
        CommandBus.sc.alertSuccess("Talep onaylandı", "Randevu onaylandı.", 2600);
      } else if (newStatus === "rejected") {
        CommandBus.sc.alertInfo("Talep reddedildi", "Randevu talebi reddedildi.", 2600);
      }
    } catch (e) {
      console.error("Randevu güncellenemedi:", e);
      CommandBus.sc.alertError("Hata", "İşlem tamamlanamadı. Lütfen tekrar deneyin.", 3200);
    } finally {
      setResolving(null);
      setResolvingAction(null);
    }
  }, [pendingRequests, bizId, refreshTodayAppointments]);

  const businessName = businessInfo?.businessName ?? "İşletme";
  const ownerName = userInfo?.name ?? auth.currentUser?.displayName ?? "İşletme sahibi";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: 16 }]}>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 112 }]}
        showsVerticalScrollIndicator={false}
      >

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
              Bekleyen Talepler {loadingRequests ? "" : `(${pendingRequests.length})`}
            </CustomText>
          </View>

          {loadingRequests ? (
            <ActivityIndicator size="small" color={Colors.Gold} style={{ marginVertical: 12 }} />
          ) : pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="file-tray-outline" size={26} color={Colors.Gold} />
              </View>
              <CustomText semibold md color={Colors.BrandPrimary} style={styles.emptyTitle}>
                Bekleyen talep yok
              </CustomText>
              <CustomText xs color={PALETTE.muted} center style={styles.emptyHint}>
                Yeni rezervasyon talepleri geldiğinde burada listelenir.
              </CustomText>
            </View>
          ) : (
            <View style={styles.sectionBody}>
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeaderRow}>
                    <View style={styles.requestLeft}>
                      <View style={styles.requestAvatar}>
                        <CustomText xs bold color={Colors.BrandPrimary}>
                          {general.getInitials(request.customerName)}
                        </CustomText>
                      </View>
                      <View style={styles.requestInfo}>
                        <CustomText bold sm color={Colors.BrandPrimary}>
                          {request.customerName}
                        </CustomText>
                        <CustomText minx color={Colors.LightGray2}>
                          {request.serviceName} • {request.time}
                        </CustomText>
                      </View>
                    </View>

                    {isAdmin && (
                      <View style={styles.requestTopActions}>
                        <Pressable
                          style={({ pressed }) => [styles.approveButton, pressed && styles.pressed]}
                          onPress={() => handleResolve(request.id, "approved")}
                          disabled={resolving === request.id}
                        >
                          {resolving === request.id && resolvingAction === "approved" ? (
                            <ActivityIndicator size="small" color={Colors.White} />
                          ) : (
                            <CustomText minx bold color={Colors.White}>
                              Onayla
                            </CustomText>
                          )}
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]}
                          onPress={() => handleResolve(request.id, "rejected")}
                          disabled={resolving === request.id}
                        >
                          {resolving === request.id && resolvingAction === "rejected" ? (
                            <ActivityIndicator size="small" color={Colors.LightGray2} />
                          ) : (
                            <CustomText minx bold color={Colors.LightGray2}>
                              Red
                            </CustomText>
                          )}
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText bold fontSize={20} color={Colors.BrandPrimary}>
              Bugunku Randevular {loadingToday ? "" : `(${todayAppointments.length})`}
            </CustomText>
          </View>

          {loadingToday ? (
            <ActivityIndicator size="small" color={Colors.Gold} style={{ marginVertical: 12 }} />
          ) : todayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={26} color={Colors.Gold} />
              </View>
              <CustomText semibold md color={Colors.BrandPrimary} style={styles.emptyTitle}>
                Bugün randevu bulunamadı
              </CustomText>
              <CustomText xs color={PALETTE.muted} center style={styles.emptyHint}>
                Bugün için onaylı randevu bulunmuyor.
              </CustomText>
            </View>
          ) : (
            <View style={styles.appointmentsCard}>
              {todayAppointments.map((appointment, index) => (
                <View
                  key={appointment.id}
                  style={[styles.appointmentRow, index < todayAppointments.length - 1 && styles.appointmentBorder]}
                >
                  <View style={styles.appointmentLeft}>
                    <View style={styles.appointmentAvatar}>
                      <Ionicons name="person-outline" size={18} color={Colors.BrandPrimary} />
                    </View>
                    <View style={styles.appointmentInfo}>
                      <CustomText bold sm color={Colors.BrandPrimary}>
                        {appointment.customerName}
                      </CustomText>
                      <CustomText min color={Colors.LightGray2} style={styles.appointmentMeta}>
                        {(appointment.serviceName ?? "").toUpperCase()} • {appointment.time}
                      </CustomText>
                    </View>
                  </View>

                  <View style={styles.appointmentRight}>
                    <View style={styles.statusBadge}>
                      <CustomText min bold color={Colors.LightGray2}>
                        ONAYLANDI
                      </CustomText>
                    </View>
                    <Pressable style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}>
                      <Ionicons name="send-outline" size={16} color={Colors.LightGray2} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
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
    backgroundColor: Colors.BrandBackground,
    paddingBottom: 12,
    zIndex: 10,
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 10,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 4,
  },
  emptyHint: {
    lineHeight: 18,
    maxWidth: 280,
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
