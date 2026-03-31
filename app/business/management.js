import { useEffect, useMemo, useState } from "react";
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import { getInitials } from "@/utils/general";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const CARD_IMAGES = {
  employees:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBSFI_7_sHPNE7bHfxBIjcttN48zuHTJ80vbfDwr73jM2O-HMKaJDohnNTDrgjm1lk-dYWRyVeoTXXVMjiONER5suso3Jx9L1t5H6qwvIFJnCwZa3CPtb6E-wGht8a7XDB-urrNfnsDxmS98ImlBI2vi0nwCV7sbv_MIc3WRgAmEVtD0Uqb4-wMpdBn1bdvC7k5a6CqmbKl-NTyFNpcA2cnTuFEWNd0aXEaAAW7LG5o73epDduFRWRmljS3XKhXWZCQIRykrDUnGMo",
  services:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB0mGOSUYejPX38URIgXFI-WX58NFwVXEFffTj_a8NopToOFwi6nSTfJct6oCdbLjRqSoDAaDlGZqTvKo9PzR4kpRV9j5yCU91g1g7PaFmo_kBXNMbaZjT0TvoByXsxFy5lbUbpvR_B4Senkd6r_jwTBlIYFv_Dwnp2fIemq3rAzUywEZ8FUh1QMaOP1rt3u2A-jvjUQudYwNAuxLVP2heIXyYHW1ru_seGkty2K517ZmOonEMlDwX_XJTIVrp6EYCuQsEedferYeY",
  business:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBq1RJ7jSGWmb8frLV39Fw_tUZPgxNtL3JBsjQTjnz8a4XfBWa1i8boWNHXagpPZDkxtfZzqkAsf4Bv_DFm7criBFEtYs-6Kkk9J6P4dSBEqzFsbVOl0u2woYKPYt5Iax-zb6K5abSiWSp7HGXQvh1P082IQg-Q3ILWTqfcNeyddIUeNc6ccvJhxwguPwN7bfmbFaHiru1XISaGjNFmphdFsvrGj_8xxzS5mHElhCG87bGoPOUFeo7EMaay-F4NmUTW6U73lpL7Ah0",
  hours:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCNTZIldmmAeJkTud1ZBZvSdFZRsaEf5re2ydq2d573L76DDtSPq3G6x3-VsIDVdzef_DRgHGV4_JuDzdOai8ePQ_88zUkQ60V7jPMwZDrFVDn4cDhe2tR8YtmPekMg1E3AllD9jtPPig1RsjSq45Gds8kzdCEPce5LbkcxPxQT-JDGHBFnQTQBteGAQskcUOCD7Qcbwg1gslaRnfDhvFtjYTXT_G69CbUF7qHwkuLBDRD-ywrBAV8dig5VZEdDeKZXe0BlDPkiwt4",
  accounting:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA8Qmk6_BeJlpR4yJZoROnyu8LS7JlGh2W-xVT7mepI0cuJjAus5Pqt4RKvj1XcmRJqexmAvSGKVI7wOyJCSTr8NnpEZlCrcqTaKuq1wP8pQcfmkG-c4q7OqwqrObVWSxLrUCfedtHs2O_EHlZfFZ4_4k-WdTbkB2K1OQPNrNfk-PiIZZXJuCXOg-YgwKmxQH5SpXrP2dVN1ZJuM2Ws1UoCC6nAoBi-TR_RxFdEjalw68RM0yqIoXzrXg43S0oxRjlekG0Ig7AGlUw",
};

const PENDING_TASKS = [
  { id: "1", initials: "AY", name: "Aylin Yilmaz" },
  { id: "2", initials: "BK", name: "Berk Kara" },
  { id: "3", initials: "ST", name: "Selin Topal" },
];

function DashboardActionCard({ item, featured, onPress }) {
  return (
    <Pressable style={({ pressed }) => [featured ? styles.featuredCardShell : styles.gridCardShell, pressed && styles.pressed]} onPress={onPress}>
      <ImageBackground source={{ uri: item.image }} style={styles.cardImage} imageStyle={styles.cardImageStyle}>
        <LinearGradient colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.42)", "rgba(0,0,0,0.9)"]} locations={[0, 0.45, 1]} style={[styles.cardOverlay, featured && styles.featuredCardOverlay]}>
          <View style={styles.cardIconWrap}>
            <Ionicons name={item.icon} size={featured ? 28 : 22} color={Colors.Gold} />
            {featured ? <View style={styles.cardPulseDot} /> : null}
          </View>

          <View style={styles.cardTextWrap}>
            <CustomText extraBold color={Colors.White} fontSize={featured ? 24 : 20} style={styles.cardTitle}>
              {item.title}
            </CustomText>
            <CustomText interMedium color="rgba(255,255,255,0.74)" fontSize={featured ? 12 : 10} letterSpacing={featured ? 0.2 : 0.8} style={featured ? null : styles.cardCaption}>
              {item.caption}
            </CustomText>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}

export default function Management() {
  const insets = useSafeAreaInsets();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (snap.exists()) {
          setUserInfo(snap.data());
        }
      })
      .catch(() => null);
  }, []);

  const businessName = userInfo?.businessName ?? "BuRandevu Studio";
  const ownerName = userInfo?.name ?? auth.currentUser?.displayName ?? "Isletme Sahibi";
  const roleLabel = isAdmin ? "MASTER DASHBOARD" : "OPERASYON PANELI";


  const dashboardCards = useMemo(
    () => [
      {
        key: "employees",
        title: isAdmin ? "Calisanlar" : "Ekibim",
        caption: "12 aktif ekip uyesi",
        icon: "people-outline",
        image: CARD_IMAGES.employees,
      },
      {
        key: "services",
        title: "Hizmetler",
        caption: "48 katalog ogesi",
        icon: "cut-outline",
        image: CARD_IMAGES.services,
      },
      {
        key: "business",
        title: "Isletme Bilgileri",
        caption: "Sube profilini duzenle",
        icon: "business-outline",
        image: CARD_IMAGES.business,
        route: "/business/profil",
      },
      {
        key: "hours",
        title: "Calisma Saatleri",
        caption: "09:00 - 21:00 aktif",
        icon: "time-outline",
        image: CARD_IMAGES.hours,
      },
      {
        key: "accounting",
        title: "Muhasebe",
        caption: "Gunluk ciroyu incele",
        icon: "wallet-outline",
        image: CARD_IMAGES.accounting,
      },
    ],
    [isAdmin],
  );

  const handleCardPress = (item) => {
    if (item.route) {
      router.push(item.route);
      return;
    }

    Alert.alert("Yolda", `${item.title} ekrani henuz baglanmadi.`);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 122,
          paddingHorizontal: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerBrandRow}>
            <View style={styles.menuButton}>
              <Ionicons name="menu" size={22} color={Colors.BrandPrimary} />
            </View>

            <View style={styles.headerTitleWrap}>
              <CustomText extraBold fontSize={20} color={Colors.BrandPrimary} style={styles.brandName}>
                BURANDEVU
              </CustomText>
              <CustomText interSemiBold fontSize={11} color={Colors.LightGray2}>
                {businessName}
              </CustomText>
            </View>
          </View>

          <Pressable style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]} onPress={() => router.push("/business/profil")}>
            <CustomText interBold fontSize={12} color={Colors.BrandPrimary}>
              {getInitials(ownerName?.trim() || businessName) || "BR"}
            </CustomText>
          </Pressable>
        </View>

        <View style={styles.greetingBlock}>
          <CustomText interBold fontSize={10} color={Colors.Gold} letterSpacing={2.4}>
            {roleLabel}
          </CustomText>
          <CustomText extraBold fontSize={32} color={Colors.BrandPrimary} style={styles.screenTitle}>
            Yonetim sayfasi
          </CustomText>
          <CustomText interMedium sm color={Colors.LightGray2} style={styles.screenDescription}>
            {ownerName}, ekibini, hizmetlerini ve isletme ayarlarini tek ekranda yonet.
          </CustomText>
        </View>

        <View style={styles.gridWrap}>
          <DashboardActionCard item={dashboardCards[0]} featured onPress={() => handleCardPress(dashboardCards[0])} />

          <View style={styles.miniGrid}>
            {dashboardCards.slice(1).map((item) => (
              <DashboardActionCard key={item.key} item={item} onPress={() => handleCardPress(item)} />
            ))}
          </View>
        </View>

        <View style={styles.insightsWrap}>
          <View style={styles.infoCard}>
            <CustomText interBold fontSize={9} color="#A1A1AA" letterSpacing={1.8}>
              LIVE PERFORMANCE
            </CustomText>

            <View style={styles.performanceRow}>
              <View style={styles.performanceTextWrap}>
                <CustomText extraBold fontSize={42} color={Colors.BrandPrimary}>
                  84%
                </CustomText>
                <CustomText interMedium fontSize={13} color={Colors.LightGray2}>
                  Gunluk kapasite dolulugu
                </CustomText>
              </View>

              <View style={styles.trendBadge}>
                <CustomText interBold fontSize={10} color="#0F8C57">
                  +12% TREND
                </CustomText>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <CustomText interBold fontSize={9} color="#A1A1AA" letterSpacing={1.8}>
              PENDING TASKS
            </CustomText>

            <View style={styles.pendingContent}>
              <View style={styles.avatarStack}>
                {PENDING_TASKS.map((item, index) => (
                  <View key={item.id} style={[styles.pendingAvatar, index > 0 && styles.pendingAvatarOverlap]}>
                    <CustomText interBold fontSize={10} color={Colors.BrandPrimary}>
                      {item.initials}
                    </CustomText>
                  </View>
                ))}

                <View style={[styles.pendingAvatar, styles.pendingAvatarOverlap, styles.pendingAvatarMuted]}>
                  <CustomText interBold fontSize={10} color={Colors.LightGray2}>
                    +3
                  </CustomText>
                </View>
              </View>

              <CustomText interMedium fontSize={13} color={Colors.LightGray2} style={styles.pendingText}>
                5 izin talebi ve 2 vardiya degisikligi onay bekliyor.
              </CustomText>
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.05)",
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  brandName: {
    letterSpacing: -0.8,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECECEC",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  greetingBlock: {
    marginBottom: 24,
    gap: 6,
  },
  screenTitle: {
    letterSpacing: -1,
  },
  screenDescription: {
    lineHeight: 20,
    maxWidth: 320,
  },
  gridWrap: {
    gap: 14,
  },
  featuredCardShell: {
    height: 242,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.BrandPrimary,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 6,
  },
  gridCardShell: {
    width: "48.2%",
    height: 196,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: Colors.BrandPrimary,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
  cardImage: {
    flex: 1,
  },
  cardImageStyle: {
    borderRadius: 24,
  },
  cardOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  featuredCardOverlay: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardIconWrap: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(20,20,20,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardPulseDot: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.Gold,
  },
  cardTextWrap: {
    gap: 4,
  },
  cardTitle: {
    lineHeight: 28,
  },
  cardCaption: {
    textTransform: "uppercase",
  },
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  insightsWrap: {
    marginTop: 24,
    gap: 14,
  },
  infoCard: {
    backgroundColor: Colors.White,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
    gap: 14,
  },
  performanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  performanceTextWrap: {
    gap: 4,
    flexShrink: 1,
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  pendingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8E8E8",
    borderWidth: 2,
    borderColor: Colors.White,
  },
  pendingAvatarOverlap: {
    marginLeft: -10,
  },
  pendingAvatarMuted: {
    backgroundColor: "#F3F4F6",
  },
  pendingText: {
    flex: 1,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
