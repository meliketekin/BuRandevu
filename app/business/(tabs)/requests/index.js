import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View, StyleSheet, ScrollView, Pressable, TouchableOpacity, useWindowDimensions, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, doc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import LayoutView from "@/components/high-level/layout-view";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomModal from "@/components/high-level/custom-modal";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";
import { APPOINTMENT_STATUS_CONFIG, AppointmentStatusEnum } from "@/enums/appointment-status-enum";

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

function closedStatusLabel(status) {
  const cfg = APPOINTMENT_STATUS_CONFIG[status] ?? APPOINTMENT_STATUS_CONFIG[AppointmentStatusEnum.Rejected];
  return cfg.label;
}

function closedStatusColor(status) {
  const cfg = APPOINTMENT_STATUS_CONFIG[status] ?? APPOINTMENT_STATUS_CONFIG[AppointmentStatusEnum.Rejected];
  return cfg.color;
}

export default function Requests() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [requests, setRequests] = useState([]);
  const [closedRequests, setClosedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null); // appointmentId being resolved
  const [selectedRequest, setSelectedRequest] = useState(null);

  const isAdmin = useAuthStore((s) => s.isAdmin);
  const userType = useAuthStore((s) => s.userType);
  const storedBusinessId = useAuthStore((s) => s.businessId);
  const isEmployee = userType === "business" && !isAdmin;
  const currentUid = auth.currentUser?.uid;

  const isWide = width >= 768;

  useEffect(() => {
    const bizId = isEmployee ? storedBusinessId : currentUid;
    if (!bizId) {
      setLoading(false);
      return;
    }

    const filterForEmployee = (items) => {
      if (!isEmployee) return items;
      return items.filter((a) => Object.values(a.employeeIds ?? {}).includes(currentUid));
    };

    const pendingQ = query(
      collection(db, "appointments"),
      where("businessId", "==", bizId),
      where("status", "==", "pending")
    );
    const closedQ = query(
      collection(db, "appointments"),
      where("businessId", "==", bizId),
      where("status", "in", ["rejected", "cancelled"]),
      limit(80)
    );

    (async () => {
      try {
        const pendingSnap = await getDocs(pendingQ);
        const pendingItems = filterForEmployee(pendingSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setRequests(pendingItems);
      } catch (e) {
        console.error("Bekleyen talepler yüklenemedi:", e);
      }
      try {
        const closedSnap = await getDocs(closedQ);
        let closedItems = filterForEmployee(closedSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        closedItems.sort((a, b) => {
          const ka = `${a.date ?? ""} ${a.time ?? ""}`;
          const kb = `${b.date ?? ""} ${b.time ?? ""}`;
          return kb.localeCompare(ka);
        });
        setClosedRequests(closedItems);
      } catch (e) {
        console.error("Red / iptal talepleri yüklenemedi (Firestore indeksi gerekebilir):", e);
        setClosedRequests([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEmployee, storedBusinessId, currentUid]);

  const pendingCount = requests.length;

  const dialCustomer = (phone) => {
    const digits = String(phone ?? "").replace(/\D/g, "");
    if (digits.length < 10) {
      CommandBus.sc.alertInfo("Telefon yok", "Bu müşteri için kayıtlı telefon bulunamadı.", 2600);
      return;
    }
    Linking.openURL(`tel:${digits}`).catch(() => {
      CommandBus.sc.alertError("Hata", "Arama başlatılamadı.", 2600);
    });
  };

  const handleResolve = async (requestId, newStatus) => {
    const businessId = isEmployee ? storedBusinessId : currentUid;
    if (!businessId) return;

    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    setResolving(requestId);
    try {
      await updateDoc(doc(db, "appointments", requestId), { status: newStatus });
      setRequests((current) => current.filter((item) => item.id !== requestId));
      if (newStatus === "rejected") {
        setClosedRequests((prev) => {
          const archived = { ...request, status: "rejected" };
          return [archived, ...prev.filter((x) => x.id !== requestId)];
        });
      }
      setSelectedRequest((current) => (current?.id === requestId ? null : current));
      if (newStatus === "approved") {
        CommandBus.sc.alertSuccess("Talep onaylandı", "Randevu onaylandı.", 2600);
      } else if (newStatus === "rejected") {
        CommandBus.sc.alertInfo("Talep reddedildi", "Randevu talebi reddedildi.", 2600);
      }
    } catch (e) {
      console.error("Randevu güncellenemedi:", e);
      CommandBus.sc.alertError("Hata", "İşlem tamamlanamadı. Lütfen tekrar deneyin.", 3200);
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
        {pendingCount === 0 && closedRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="checkmark-done-outline" size={26} color={Colors.Gold} />
            </View>
            <CustomText semibold fontSize={18} color={Colors.BrandPrimary}>
              Henüz talep yok
            </CustomText>
            <CustomText xs color={Colors.LightGray2} center style={styles.emptyDescription}>
              Yeni rezervasyon geldiğinde burada görünecek. Reddedilen ve iptal talepler aşağıdaki bölümde listelenir.
            </CustomText>
          </View>
        ) : (
          <>
            <View style={styles.sectionBlock}>
              <CustomText bold fontSize={18} color={Colors.BrandPrimary} style={styles.sectionHeading}>
                Bekleyen talepler
              </CustomText>
              {pendingCount === 0 ? (
                <View style={styles.pendingEmptyInline}>
                  <Ionicons name="hourglass-outline" size={20} color={Colors.LightGray2} />
                  <CustomText sm color={Colors.LightGray2} style={styles.pendingEmptyText}>
                    Şu an onay bekleyen talep yok.
                  </CustomText>
                </View>
              ) : (
                <View style={[styles.grid, isWide && styles.gridWide]}>
                  {requests.map((request) => {
                    const serviceLabel = request.serviceNames?.join(" & ") ?? "—";
                    const dateLabel = request.date
                      ? new Date(request.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })
                      : "—";
                    const isResolvingThis = resolving === request.id;
                    return (
                      <View key={request.id} style={[styles.requestCard, isWide && styles.requestCardWide]}>
                        <Pressable style={({ pressed }) => [styles.cardContentButton, pressed && styles.pressed]} onPress={() => setSelectedRequest(request)}>
                          <View style={styles.cardTopRow}>
                            <View style={styles.customerWrap}>
                              <View style={styles.customerText}>
                                <CustomText bold lg color={Colors.BrandPrimary}>
                                  {request.customerName || request.customerId?.slice(0, 8) || "Müşteri"}
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
                          <TouchableOpacity
                            style={[styles.approveButton, isResolvingThis && styles.actionDisabled]}
                            onPress={() => handleResolve(request.id, "approved")}
                            disabled={isResolvingThis}
                            activeOpacity={0.85}
                          >
                            <CustomText xs bold color={Colors.White} style={styles.actionText}>
                              Onayla
                            </CustomText>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.rejectButton, isResolvingThis && styles.actionDisabled]}
                            onPress={() => handleResolve(request.id, "rejected")}
                            disabled={isResolvingThis}
                            activeOpacity={0.85}
                            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                          >
                            <Ionicons name="close" size={22} color={Colors.LightGray2} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.phoneButton, isResolvingThis && styles.actionDisabled]}
                            onPress={() => dialCustomer(request.customerPhone)}
                            disabled={isResolvingThis}
                            activeOpacity={0.85}
                            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                          >
                            <Ionicons name="call-outline" size={22} color={Colors.BrandPrimary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {closedRequests.length > 0 ? (
              <View style={[styles.sectionBlock, styles.historySection]}>
                <CustomText bold fontSize={18} color={Colors.BrandPrimary} style={styles.sectionHeading}>
                  Reddedilen ve iptal
                </CustomText>
                <CustomText xs color={PALETTE.muted} style={styles.sectionSub}>
                  İşletme reddi veya müşteri iptali ({closedRequests.length} kayıt)
                </CustomText>
                <View style={[styles.grid, isWide && styles.gridWide]}>
                  {closedRequests.map((request) => {
                    const serviceLabel = request.serviceNames?.join(" & ") ?? "—";
                    const dateLabel = request.date
                      ? new Date(request.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })
                      : "—";
                    const stColor = closedStatusColor(request.status);
                    return (
                      <View key={request.id} style={[styles.requestCard, styles.historyCard, isWide && styles.requestCardWide]}>
                        <Pressable style={({ pressed }) => [styles.cardContentButton, pressed && styles.pressed]} onPress={() => setSelectedRequest(request)}>
                          <View style={styles.cardTopRow}>
                            <View style={styles.customerWrap}>
                              <View style={styles.customerText}>
                                <CustomText bold lg color={Colors.BrandPrimary}>
                                  {request.customerName || request.customerId?.slice(0, 8) || "Müşteri"}
                                </CustomText>
                                <View style={[styles.historyStatusPill, { backgroundColor: `${stColor}22` }]}>
                                  <View style={[styles.historyStatusDot, { backgroundColor: stColor }]} />
                                  <CustomText min semibold style={{ color: stColor }}>
                                    {closedStatusLabel(request.status)}
                                  </CustomText>
                                </View>
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
                        <View style={styles.historyCardActions}>
                          <TouchableOpacity
                            style={styles.historyPhoneBtn}
                            onPress={() => dialCustomer(request.customerPhone)}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="call-outline" size={20} color={Colors.BrandPrimary} />
                            <CustomText min semibold color={Colors.BrandPrimary}>
                              Ara
                            </CustomText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </>
        )}

        <View style={styles.footerWrap}>
          <View style={styles.footerPill}>
            <CustomText xs semibold color={Colors.LightGray2} style={styles.footerLabel}>
              {pendingCount > 0
                ? `${pendingCount} bekleyen talep`
                : closedRequests.length > 0
                  ? "Bekleyen talep yok"
                  : "Talep yok"}
            </CustomText>
          </View>
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
              {selectedRequest.status !== "pending" ? (
                <View style={styles.detailRow}>
                  <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                    DURUM
                  </CustomText>
                  <View
                    style={[
                      styles.modalStatusBadge,
                      { backgroundColor: `${closedStatusColor(selectedRequest.status)}22` },
                    ]}
                  >
                    <View style={[styles.historyStatusDot, { backgroundColor: closedStatusColor(selectedRequest.status) }]} />
                    <CustomText xs semibold style={{ color: closedStatusColor(selectedRequest.status) }}>
                      {closedStatusLabel(selectedRequest.status)}
                    </CustomText>
                  </View>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                  MÜŞTERİ
                </CustomText>
                <CustomText sm semibold color={Colors.BrandPrimary} style={styles.detailValueRight}>
                  {selectedRequest.customerName || selectedRequest.customerId?.slice(0, 12) || "—"}
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

            {selectedRequest.status === "pending" ? (
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.modalApproveButton, resolving === selectedRequest.id && styles.actionDisabled]}
                  onPress={() => handleResolve(selectedRequest.id, "approved")}
                  disabled={resolving === selectedRequest.id}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={22} color={Colors.White} />
                  <CustomText bold lg color={Colors.White}>
                    Onayla
                  </CustomText>
                </TouchableOpacity>

                <View style={styles.modalRejectRow}>
                  <TouchableOpacity
                    style={[styles.modalRejectButton, resolving === selectedRequest.id && styles.actionDisabled]}
                    onPress={() => handleResolve(selectedRequest.id, "rejected")}
                    disabled={resolving === selectedRequest.id}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close-circle" size={22} color={Colors.BrandPrimary} />
                    <CustomText bold lg color={Colors.BrandPrimary}>
                      Reddet
                    </CustomText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalPhoneButton, resolving === selectedRequest.id && styles.actionDisabled]}
                    onPress={() => dialCustomer(selectedRequest.customerPhone)}
                    disabled={resolving === selectedRequest.id}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="call-outline" size={24} color={Colors.BrandPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.modalPhoneOnly} onPress={() => dialCustomer(selectedRequest.customerPhone)} activeOpacity={0.85}>
                <Ionicons name="call-outline" size={22} color={Colors.BrandPrimary} />
                <CustomText bold md color={Colors.BrandPrimary}>
                  Müşteriyi ara
                </CustomText>
              </TouchableOpacity>
            )}
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
  sectionBlock: {
    marginBottom: 28,
  },
  sectionHeading: {
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionSub: {
    marginBottom: 14,
    lineHeight: 18,
  },
  pendingEmptyInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: PALETTE.surfaceLow,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.2)",
  },
  pendingEmptyText: {
    flex: 1,
  },
  historySection: {
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: PALETTE.surfaceLow,
  },
  historyStatusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  historyStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  historyCardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(196,199,199,0.35)",
    marginTop: 12,
  },
  historyPhoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: PALETTE.surfaceLow,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.28)",
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modalPhoneOnly: {
    minHeight: 54,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: PALETTE.surfaceLow,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
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
    zIndex: 2,
    elevation: 6,
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
    width: 52,
    minHeight: 48,
    flexShrink: 0,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  phoneButton: {
    width: 52,
    minHeight: 48,
    flexShrink: 0,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
  },
  actionDisabled: {
    opacity: 0.55,
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
  modalRejectRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
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
    flex: 1,
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: PALETTE.surfaceHigh,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  modalPhoneButton: {
    width: 58,
    minHeight: 58,
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});
