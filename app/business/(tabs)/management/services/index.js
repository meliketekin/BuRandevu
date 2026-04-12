import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import { openModal, ModalTypeEnum } from "@/components/high-level/modal-renderer";
import CommandBus from "@/infrastructures/command-bus/command-bus";
import LayoutView from "@/components/high-level/layout-view";
import ActivityLoading from "@/components/high-level/activity-loading";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

function formatPrice(price) {
  return `₺${Number(price).toLocaleString("tr-TR")}`;
}

function formatDuration(minutes) {
  return `${minutes} Dk`;
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = useAuthStore((s) => s.isAdmin);
  const userType = useAuthStore((s) => s.userType);
  const storedBusinessId = useAuthStore((s) => s.businessId);
  const isEmployee = userType === "business" && !isAdmin;
  const bizId = isEmployee ? storedBusinessId : auth.currentUser?.uid;

  const confirmDeleteService = useCallback((service) => {
    const label = service.name?.trim() || "Bu hizmet";
    openModal(ModalTypeEnum.ConfirmModal, {
      title: "Hizmeti sil",
      message: `"${label}" kalıcı olarak silinecek. Emin misiniz?`,
      confirmText: "Sil",
      cancelText: "İptal",
      destructiveConfirm: true,
      onConfirm: async () => {
        if (!bizId) {
          CommandBus.sc.alertError("Hata", "Kullanıcı bulunamadı.", 2600);
          return;
        }
        setDeletingId(service.id);
        try {
          await deleteDoc(doc(db, "businesses", bizId, "services", service.id));
        } catch (e) {
          console.error("Service delete error:", e);
          CommandBus.sc.alertError("Hata", e?.message ?? "Hizmet silinirken bir sorun oluştu.", 3200);
        } finally {
          setDeletingId(null);
        }
      },
    });
  }, [bizId]);

  useEffect(() => {
    if (!bizId) { setLoading(false); return; }

    const q = query(
      collection(db, "businesses", bizId, "services"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Services snapshot error:", err);
      setLoading(false);
    });

    return unsubscribe;
  }, [bizId]);

  return (
    <LayoutView
      showBackButton
      title="Hizmetler"
      backgroundColor={Colors.BrandBackground}
      paddingHorizontal={0}
      onAddPress={isEmployee ? undefined : () => router.push("/business/management/services/form")}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={15} color={Colors.Gold} />
            <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={1.2}>
              PREMIUM MENU
            </CustomText>
          </View>
          <CustomText extraBold fontSize={24} color={Colors.BrandPrimary} style={styles.heroTitle}>
            {isEmployee ? "Sunduğun hizmetler" : "Hizmetlerini daha iyi yönet"}
          </CustomText>
          <CustomText medium fontSize={13} color={Colors.LightGray2} style={styles.heroDescription}>
            {isEmployee
              ? "İşletmenin sana atadığı hizmetleri buradan görüntüleyebilirsin."
              : "Fiyat, süre ve açıklama detaylarını tek ekranda düzenleyip hizmet deneyimini daha modern bir yapıda yönet."}
          </CustomText>
        </View>

        {loading ? (
          <ActivityLoading style={styles.loader} />
        ) : services.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cut-outline" size={28} color={Colors.LightGray2} />
            </View>
            <CustomText bold fontSize={15} color={Colors.BrandPrimary}>
              Henüz hizmet yok
            </CustomText>
            {!isEmployee && (
              <CustomText medium fontSize={13} color={Colors.LightGray2} style={styles.emptyDescription}>
                Sağ üstteki + butonuna basarak ilk hizmetini ekle.
              </CustomText>
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {services.map((service) => (
              <View key={service.id} style={styles.card}>
                <View style={styles.serviceInfo}>
                  <CustomText bold fontSize={16} color={Colors.BrandPrimary} style={styles.serviceName}>
                    {service.name}
                  </CustomText>
                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={12} color={Colors.BrandPrimary} />
                      <CustomText bold fontSize={12} color={Colors.BrandPrimary} letterSpacing={0.2}>
                        {formatDuration(service.durationMinutes)}
                      </CustomText>
                    </View>
                    <View style={[styles.metaChip, styles.priceChip]}>
                      <Ionicons name="wallet-outline" size={12} color={Colors.Gold} />
                      <CustomText bold fontSize={12} color={Colors.Gold} letterSpacing={0.2}>
                        {formatPrice(service.price)}
                      </CustomText>
                    </View>
                  </View>
                </View>

                {!isEmployee && (
                  <View style={styles.cardActions}>
                    <Pressable
                      style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                      disabled={deletingId === service.id}
                      onPress={() =>
                        router.push({
                          pathname: "/business/management/services/form",
                          params: {
                            mode: "edit",
                            id: service.id,
                            name: service.name,
                            description: service.description ?? "",
                            price: String(service.price),
                            duration: String(service.durationMinutes),
                          },
                        })
                      }
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.BrandPrimary} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                      disabled={deletingId === service.id}
                      onPress={() => confirmDeleteService(service)}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.ErrorColor} />
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 112, gap: 14 },
  heroCard: {
    backgroundColor: Colors.White, borderRadius: 24, padding: 20, gap: 10,
    borderWidth: 1, borderColor: "rgba(196,199,199,0.14)",
    shadowColor: Colors.Black, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 4,
  },
  heroBadge: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(212,175,55,0.12)",
  },
  heroTitle: { letterSpacing: -0.6 },
  heroDescription: { lineHeight: 20 },
  loader: { minHeight: 160 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(20,20,20,0.05)", marginBottom: 4,
  },
  emptyDescription: { textAlign: "center", lineHeight: 20, maxWidth: 240 },
  list: { gap: 12 },
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.White, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "rgba(196,199,199,0.14)",
    shadowColor: Colors.Black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.045, shadowRadius: 22, elevation: 3,
  },
  serviceInfo: { flex: 1, gap: 8 },
  serviceName: { letterSpacing: -0.3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: "#F4F6F8",
  },
  priceChip: { backgroundColor: "rgba(212,175,55,0.12)" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 8 },
  editButton: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.White,
    borderWidth: 1, borderColor: "rgba(212,175,55,0.28)",
    shadowColor: Colors.Gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2,
  },
  deleteButton: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.White,
    borderWidth: 1, borderColor: "rgba(255,59,48,0.22)",
    shadowColor: Colors.Black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
});
