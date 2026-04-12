import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/firebase";
import LayoutView from "@/components/high-level/layout-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomModal from "@/components/high-level/custom-modal";
import { Colors } from "@/constants/colors";

const PALETTE = {
  bg: "#F9F9F9",
  surface: "#FFFFFF",
  surfaceLow: "#F3F3F3",
  surfaceHigh: "#E8E8E8",
  border: "rgba(196,199,199,0.35)",
  muted: "#636262",
  tertiary: "#735C00",
  tertiaryContainer: "#CCA830",
  onTertiaryContainer: "#4F3E00",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#93000A",
};



function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={Colors.LightGray2} />
      </View>
      <View style={styles.infoContent}>
        <CustomText min color="rgba(26,28,28,0.58)" style={styles.infoLabel}>
          {label}
        </CustomText>
        <CustomText sm semibold color={Colors.BrandPrimary}>
          {value}
        </CustomText>
      </View>
    </View>
  );
}

export default function Requests() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null); // appointmentId being resolved
  const [archivedCount, setArchivedCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const isWide = width >= 768;

  useEffect(() => {
    const businessId = auth.currentUser?.uid;
    if (!businessId) { setLoading(false); return; }

    const q = query(
      collection(db, "appointments"),
      where("businessId", "==", businessId),
      where("status", "==", "pending")
    );
    getDocs(q)
      .then((snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(items);
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = requests.length;

  const handleResolve = async (requestId, newStatus) => {
    const businessId = auth.currentUser?.uid;
    if (!businessId) return;

    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    setResolving(requestId);
    try {
      await updateDoc(doc(db, "appointments", requestId), { status: newStatus });

      setRequests((current) => current.filter((item) => item.id !== requestId));
      setArchivedCount((v) => v + 1);
      setSelectedRequest((current) => (current?.id === requestId ? null : current));
    } catch (e) {
      console.error("Randevu güncellenemedi:", e);
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <LayoutView isActiveHeader={true} title="Talepler" backgroundColor={PALETTE.bg} paddingHorizontal={0}>
        <ActivityIndicator size="large" color={Colors.Gold} style={{ marginTop: 80 }} />
      </LayoutView>
    );
  }

  return (
    <LayoutView isActiveHeader={true} title="Talepler" backgroundColor={PALETTE.bg} paddingHorizontal={0}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingTop: 24, paddingBottom: insets.bottom + 112 }]} showsVerticalScrollIndicator={false}>
        {pendingCount === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="checkmark-done-outline" size={26} color={Colors.Gold} />
            </View>
            <CustomText semibold fontSize={18} color={Colors.BrandPrimary}>
              Tüm talepler işlendi
            </CustomText>
            <CustomText xs color={Colors.LightGray2} center style={styles.emptyDescription}>
              Yeni rezervasyon geldiğinde burada premium talep kartları ile görünecek.
            </CustomText>
          </View>
        ) : (
          <View style={[styles.grid, isWide && styles.gridWide]}>
            {requests.map((request) => {
              const serviceLabel = request.serviceNames?.join(" & ") ?? "—";
              const dateLabel = request.date ? new Date(request.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }) : "—";
              const isResolvingThis = resolving === request.id;
              return (
                <View key={request.id} style={[styles.requestCard, isWide && styles.requestCardWide]}>
                  <Pressable style={({ pressed }) => [styles.cardContentButton, pressed && styles.pressed]} onPress={() => setSelectedRequest(request)}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.customerWrap}>
                        <View style={styles.customerText}>
                          <CustomText bold lg color={Colors.BrandPrimary}>
                            {request.customerId?.slice(0, 8) ?? "Müşteri"}
                          </CustomText>
                          <CustomText min color="rgba(68,71,72,0.75)" style={styles.customerBadge}>
                            Yeni Müşteri
                          </CustomText>
                        </View>
                      </View>

                      <View style={styles.requestIdBadge}>
                        <CustomText min bold color={Colors.LightGray2}>
                          #{request.id.slice(0, 6).toUpperCase()}
                        </CustomText>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <InfoRow icon="cut-outline" label="HİZMET" value={serviceLabel} />
                      <InfoRow icon="calendar-outline" label="TARİH & SAAT" value={`${dateLabel} — ${request.time}`} />
                    </View>
                  </Pressable>

                  <View style={styles.cardActions}>
                    <Pressable
                      style={({ pressed }) => [styles.approveButton, pressed && styles.pressed, isResolvingThis && { opacity: 0.6 }]}
                      onPress={() => !isResolvingThis && handleResolve(request.id, "approved")}
                    >
                      <CustomText xs bold color={Colors.White} style={styles.actionText}>
                        Onayla
                      </CustomText>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed, isResolvingThis && { opacity: 0.6 }]}
                      onPress={() => !isResolvingThis && handleResolve(request.id, "rejected")}
                    >
                      <Ionicons name="close" size={20} color={Colors.LightGray2} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footerWrap}>
          <View style={styles.footerPill}>
            <CustomText xs semibold color={Colors.LightGray2} style={styles.footerLabel}>
              {pendingCount ? "Tüm talepler görüntülendi" : "Talep kuyruğu temiz"}
            </CustomText>
            <View style={styles.footerDivider} />
            <Pressable onPress={() => router.push("/business/yonetim")} hitSlop={8}>
              <View style={styles.footerLinkRow}>
                <CustomText xs bold color={PALETTE.tertiary}>
                  ARŞİVE GİT
                </CustomText>
                <Ionicons name="arrow-forward" size={14} color={PALETTE.tertiary} />
              </View>
            </Pressable>
          </View>

          {!!archivedCount && (
            <CustomText xs color={Colors.LightGray2} center style={styles.archiveHint}>
              Bu oturumda {archivedCount} talep işlendi.
            </CustomText>
          )}
        </View>
      </ScrollView>

      <CustomModal
        visible={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Talep Detayları"
      >
        {selectedRequest && (
          <View style={styles.modalContent}>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                  MÜŞTERİ ID
                </CustomText>
                <CustomText sm semibold color={Colors.BrandPrimary}>
                  {selectedRequest.customerId?.slice(0, 12) ?? "—"}
                </CustomText>
              </View>

              <View style={styles.detailRow}>
                <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                  HİZMET
                </CustomText>
                <CustomText sm semibold color={Colors.BrandPrimary} style={styles.detailValueRight}>
                  {selectedRequest.serviceNames?.join(" & ") ?? "—"}
                </CustomText>
              </View>

              <View style={[styles.detailRow, styles.detailRowLast]}>
                <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                  TARİH & SAAT
                </CustomText>
                <View style={styles.detailDateWrap}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.Gold} />
                  <CustomText sm semibold color={Colors.BrandPrimary}>
                    {selectedRequest.date}, {selectedRequest.time}
                  </CustomText>
                </View>
              </View>
            </View>

            <View style={styles.detailActions}>
              <Pressable
                style={({ pressed }) => [styles.modalApproveButton, pressed && styles.pressed, resolving === selectedRequest.id && { opacity: 0.6 }]}
                onPress={() => resolving !== selectedRequest.id && handleResolve(selectedRequest.id, "approved")}
              >
                <Ionicons name="checkmark-circle" size={22} color={Colors.White} />
                <CustomText bold lg color={Colors.White}>Onayla</CustomText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.modalRejectButton, pressed && styles.pressed, resolving === selectedRequest.id && { opacity: 0.6 }]}
                onPress={() => resolving !== selectedRequest.id && handleResolve(selectedRequest.id, "rejected")}
              >
                <Ionicons name="close-circle" size={22} color={Colors.BrandPrimary} />
                <CustomText bold lg color={Colors.BrandPrimary}>Reddet</CustomText>
              </Pressable>
            </View>
          </View>
        )}
      </CustomModal>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(249,249,249,0.9)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(20,20,20,0.05)",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    letterSpacing: -0.8,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.2)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 28,
    gap: 16,
  },
  headerTextBlock: {
    gap: 6,
  },
  kicker: {
    textTransform: "uppercase",
    letterSpacing: 2.2,
  },
  pageTitle: {
    letterSpacing: -1.8,
    lineHeight: 50,
  },
  pageSubtitle: {
    maxWidth: 360,
    lineHeight: 20,
  },
  liveBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PALETTE.surfaceLow,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.2)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.tertiaryContainer,
  },
  liveText: {
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  grid: {
    gap: 16,
  },
  gridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  requestCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.18)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  requestCardWide: {
    width: "48.2%",
  },
  cardContentButton: {
    borderRadius: 16,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  customerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  customerImageWrap: {
    position: "relative",
  },
  customerImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.18)",
  },
  starBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PALETTE.tertiaryContainer,
    borderWidth: 2,
    borderColor: PALETTE.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  customerText: {
    flex: 1,
    gap: 4,
  },
  customerBadge: {
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  requestIdBadge: {
    backgroundColor: PALETTE.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardBody: {
    gap: 14,
    marginBottom: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PALETTE.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    gap: 3,
  },
  infoLabel: {
    letterSpacing: 1.4,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  approveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BrandPrimary,
  },
  rejectButton: {
    width: 54,
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  actionText: {
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  emptyState: {
    backgroundColor: PALETTE.surface,
    borderRadius: 22,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.18)",
    gap: 10,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  emptyDescription: {
    lineHeight: 18,
    maxWidth: 260,
  },
  footerWrap: {
    marginTop: 28,
    alignItems: "center",
    gap: 10,
  },
  footerPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#EEEEEE",
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.18)",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  footerLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  footerDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(196,199,199,0.35)",
  },
  footerLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  archiveHint: {
    lineHeight: 18,
  },
  modalContent: {
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  detailCard: {
    backgroundColor: PALETTE.surfaceLow,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(196,199,199,0.3)",
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLabel: {
    letterSpacing: 1.5,
  },
  detailValueRight: {
    flex: 1,
    textAlign: "right",
  },
  detailDateWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailActions: {
    gap: 12,
  },
  modalApproveButton: {
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: Colors.Gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.Gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  modalRejectButton: {
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: PALETTE.surfaceHigh,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});
