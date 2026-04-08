import { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LayoutView from "@/components/high-level/layout-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomImage from "@/components/high-level/custom-image";
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


const INITIAL_REQUESTS = [
  {
    id: "#4829",
    name: "Selinnur Aksoy",
    badge: "VIP Müşteri",
    service: "Saç Kesimi & Keratin Bakım",
    dateLabel: "14 Ekim, Pazartesi",
    time: "14:30",
    expert: "Mert Yılmaz",
    amount: "450 ₺",
    starred: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAH_PiNIyqs-7mZkOtsWMnONpYGU1zMVECkCXfg3RghkK5By8CGNmSu0xQoctLYAfVEHIu8_ABKPySX_l9V7BoRti-eH0XEMRBwxK62awS2ImxfY1i9iatqpjPFwgW110YFECYiBp2Rva3jHR_XL6sUpkJMRYRKQRgPCc8m_EEpt1ws3dw2JKbveVZ9bmw37vivABcTn4NOP2CNLcFRP8s_P4v6h3hpZA43GH1KQLJENgKtNwA2ZbM5Xys4jjx7D81E6CeHMRWcoWg",
  },
  {
    id: "#4831",
    name: "Burak Tanyeli",
    badge: "Yeni Müşteri",
    service: "Sakal Tasarımı & Bakım",
    dateLabel: "15 Ekim, Salı",
    time: "11:00",
    expert: "Arda Güler",
    amount: "320 ₺",
    starred: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHbHassn7W0CH4G9n6EiePey-4h00mdLRgIAWmYG-1OI0lyxWqlbsqH5Wor0RHYYW2p2u-3aCSO2cRO4WTv-sFvicWWkhpbdGaZI7Bl6cogBqRJANCQTHKJfruXd4EQEELUOYO7K6hEBDk6mCN88Os4vaybbJtSVZjGPLDY6po1RNuy8ndkAA77qo_FFhorpt8wU-wsELclHqNCtJrDBRx8kIcuDW78Co81D2XMdR7QxDGX3AlVXPAMx8eQYKGMfjeR0gGgmeo26k",
  },
  {
    id: "#4835",
    name: "Derya Can",
    badge: "Sadık Müşteri",
    service: "Boya & Fön",
    dateLabel: "15 Ekim, Salı",
    time: "16:00",
    expert: "Mert Yılmaz",
    amount: "780 ₺",
    starred: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAA3oMdi4mRqXkVNnxQbGArWCoabTrgthRSHYJ6LxiOpFsS5O9uaDmzLgeYlVmc4D6Hz4IeeS4FwEgwsu6qYtJLg-4qqaKBZmfK2EQuu-VwP9xpZ4crXU-j1bR7JEJu-9yBfznOrRnkDIyGERY9ilNvoMOmSyZWamDuitUzzO0u-MN4NMqU5Ti7ymGMWGQhTb-Xoh4vTW_IsJe9eh93840yFf12kvicLXtxCYw7widLXLfWPqCTJhaIZv1Al_8h0bTonZPuHBbD6bY",
  },
  {
    id: "#4839",
    name: "Caner Yıldız",
    badge: "Yeni Müşteri",
    service: "Komple Bakım Paketi",
    dateLabel: "16 Ekim, Çarşamba",
    time: "09:30",
    expert: "Arda Güler",
    amount: "950 ₺",
    starred: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBkuQetcXqOHqfics61K2sZCiQXoBcwzKYVDnhpoovp4923KznRERVNhPmZcn50R0pQ1nkwrt3VRcNqqJob3TjZX1MtRyrUnkfbbY4JChwVwZIXdFJv-hBJaJRojCMM7HzN7CboApbtxwtPYdYy8_hAQSo0Mz2ntuEz_pSepdGI-sA9pVH7ED89px9byPOSeeaWT0bQGzFMgLybEFnAQOfcy9aHYPF5U9jfjBlGmVidtmQ6qj7cex1Et-g8CJ3MGEAG_tjV7t-H7hU",
  },
];

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
  const { width, height } = useWindowDimensions();
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [archivedCount, setArchivedCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const isWide = width >= 768;

  const pendingCount = requests.length;
  const subtitle = useMemo(() => {
    if (!pendingCount) {
      return "Şu anda onay bekleyen yeni randevu talebiniz bulunmuyor.";
    }
    return `Onay bekleyen ${pendingCount} yeni randevu talebiniz bulunmaktadır.`;
  }, [pendingCount]);

  const handleResolve = (requestId) => {
    setRequests((current) => {
      const exists = current.some((item) => item.id === requestId);
      if (!exists) return current;
      setArchivedCount((value) => value + 1);
      return current.filter((item) => item.id !== requestId);
    });
    setSelectedRequest((current) => (current?.id === requestId ? null : current));
  };

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
            {requests.map((request) => (
              <View key={request.id} style={[styles.requestCard, isWide && styles.requestCardWide]}>
                <Pressable style={({ pressed }) => [styles.cardContentButton, pressed && styles.pressed]} onPress={() => setSelectedRequest(request)}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.customerWrap}>
                      <View style={styles.customerImageWrap}>
                        <CustomImage uri={request.image} style={styles.customerImage} contentFit="cover" />
                        {request.starred ? (
                          <View style={styles.starBadge}>
                            <Ionicons name="star" size={13} color={PALETTE.onTertiaryContainer} />
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.customerText}>
                        <CustomText bold lg color={Colors.BrandPrimary}>
                          {request.name}
                        </CustomText>
                        <CustomText min color="rgba(68,71,72,0.75)" style={styles.customerBadge}>
                          {request.badge}
                        </CustomText>
                      </View>
                    </View>

                    <View style={styles.requestIdBadge}>
                      <CustomText min bold color={Colors.LightGray2}>
                        {request.id}
                      </CustomText>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <InfoRow icon="cut-outline" label="HİZMET" value={request.service} />
                    <InfoRow icon="calendar-outline" label="TARİH & SAAT" value={`${request.dateLabel} — ${request.time}`} />
                    <InfoRow icon="person-outline" label="UZMAN" value={request.expert} />
                  </View>
                </Pressable>

                <View style={styles.cardActions}>
                  <Pressable style={({ pressed }) => [styles.approveButton, pressed && styles.pressed]} onPress={() => handleResolve(request.id)}>
                    <CustomText xs bold color={Colors.White} style={styles.actionText}>
                      Onayla
                    </CustomText>
                  </Pressable>

                  <Pressable style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]} onPress={() => handleResolve(request.id)}>
                    <Ionicons name="close" size={20} color={Colors.LightGray2} />
                  </Pressable>
                </View>
              </View>
            ))}
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

      <Modal visible={!!selectedRequest} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSelectedRequest(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRequest(null)} />

          <View
            style={[
              styles.detailSheet,
              {
                maxHeight: height * 0.82,
                paddingBottom: Math.max(insets.bottom, 18) + 10,
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderText}>
                <CustomText extraBold fontSize={30} color={Colors.BrandPrimary} style={styles.detailTitle}>
                  Talep Detayları
                </CustomText>
                <CustomText sm color={Colors.LightGray2} style={styles.detailSubtitle}>
                  Randevu talebini buradan yönetebilirsiniz.
                </CustomText>
              </View>

              <Pressable style={({ pressed }) => [styles.detailCloseButton, pressed && styles.pressed]} onPress={() => setSelectedRequest(null)}>
                <Ionicons name="close" size={22} color={Colors.LightGray2} />
              </Pressable>
            </View>

            {selectedRequest ? (
              <>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                      MÜŞTERİ
                    </CustomText>
                    <CustomText lg bold color={Colors.BrandPrimary}>
                      {selectedRequest.name}
                    </CustomText>
                  </View>

                  <View style={styles.detailRow}>
                    <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                      HİZMET
                    </CustomText>
                    <CustomText sm semibold color={Colors.BrandPrimary} style={styles.detailValueRight}>
                      {selectedRequest.service}
                    </CustomText>
                  </View>

                  <View style={styles.detailRow}>
                    <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                      TARİH & SAAT
                    </CustomText>
                    <View style={styles.detailDateWrap}>
                      <Ionicons name="calendar-outline" size={18} color={Colors.Gold} />
                      <CustomText sm semibold color={Colors.BrandPrimary}>
                        {selectedRequest.dateLabel}, {selectedRequest.time}
                      </CustomText>
                    </View>
                  </View>

                  <View style={[styles.detailRow, styles.detailRowLast]}>
                    <CustomText min bold color={Colors.LightGray2} style={styles.detailLabel}>
                      TUTAR
                    </CustomText>
                    <CustomText header bold color={Colors.BrandPrimary}>
                      {selectedRequest.amount}
                    </CustomText>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  <Pressable style={({ pressed }) => [styles.modalApproveButton, pressed && styles.pressed]} onPress={() => handleResolve(selectedRequest.id)}>
                    <Ionicons name="checkmark-circle" size={22} color={Colors.White} />
                    <CustomText bold lg color={Colors.White}>
                      Onayla
                    </CustomText>
                  </Pressable>

                  <Pressable style={({ pressed }) => [styles.modalRejectButton, pressed && styles.pressed]} onPress={() => handleResolve(selectedRequest.id)}>
                    <Ionicons name="close-circle" size={22} color={Colors.BrandPrimary} />
                    <CustomText bold lg color={Colors.BrandPrimary}>
                      Reddet
                    </CustomText>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,20,20,0.6)",
  },
  detailSheet: {
    width: "100%",
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 8,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E5E5",
    alignSelf: "center",
    marginBottom: 24,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailTitle: {
    letterSpacing: -0.9,
    marginBottom: 4,
  },
  detailSubtitle: {
    lineHeight: 20,
  },
  detailCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.surfaceLow,
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
