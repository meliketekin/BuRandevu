import { useEffect, useMemo, useState } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import general from "@/utils/general";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";

const CARD_IMAGES = {
  employees:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBSFI_7_sHPNE7bHfxBIjcttN48zuHTJ80vbfDwr73jM2O-HMKaJDohnNTDrgjm1lk-dYWRyVeoTXXVMjiONER5suso3Jx9L1t5H6qwvIFJnCwZa3CPtb6E-wGht8a7XDB-urrNfnsDxmS98ImlBI2vi0nwCV7sbv_MIc3WRgAmEVtD0Uqb4-wMpdBn1bdvC7k5a6CqmbKl-NTyFNpcA2cnTuFEWNd0aXEaAAW7LG5o73epDduFRWRmljS3XKhXWZCQIRykrDUnGMo",
  services:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB0mGOSUYejPX38URIgXFI-WX58NFwVXEFffTj_a8NopToOFwi6nSTfJct6oCdbLjRqSoDAaDlGZqTvKo9PzR4kpRV9j5yCU91g1g7PaFmo_kBXNMbaZjT0TvoByXsxFy5lbUbpvR_B4Senkd6r_jwTBlIYFv_Dwnp2fIemq3rAzUywEZ8FUh1QMaOP1rt3u2A-jvjUQudYwNAuxLVP2heIXyYHW1ru_seGkty2K517ZmOonEMlDwX_XJTIVrp6EYCuQsEedferYeY",
  business:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBq1RJ7jSGWmb8frLV39Fw_tUZPgxNtL3JBsjQTjnz8a4XfBWa1i8boWNHXagpPZDkxtfZzqkAsf4Bv_DFm7criBFEtYs-6Kkk9J6P4dSBEqzFsbVOl0u2woYKPYt5Iax-zb6K5abSiWSp7HGXQvh1P082IQg-Q3ILWTqfcNeyddIUeNc6ccvJhxwguPwN7bfmbFaHiru1XISaGjNFmphdFsvrGj_8xxzS5mHElhCG87bGoPOUFeo7EMaay-F4NmUTW6U73lpL7Ah0",
  workingHours: "https://st2.depositphotos.com/8468478/12253/i/600/depositphotos_122530756-stock-photo-black-clock-isolated-on-white.jpg",
  accounting:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA8Qmk6_BeJlpR4yJZoROnyu8LS7JlGh2W-xVT7mepI0cuJjAus5Pqt4RKvj1XcmRJqexmAvSGKVI7wOyJCSTr8NnpEZlCrcqTaKuq1wP8pQcfmkG-c4q7OqwqrObVWSxLrUCfedtHs2O_EHlZfFZ4_4k-WdTbkB2K1OQPNrNfk-PiIZZXJuCXOg-YgwKmxQH5SpXrP2dVN1ZJuM2Ws1UoCC6nAoBi-TR_RxFdEjalw68RM0yqIoXzrXg43S0oxRjlekG0Ig7AGlUw",
};

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
            <CustomText medium color="rgba(255,255,255,0.74)" fontSize={featured ? 12 : 10} letterSpacing={featured ? 0.2 : 0.8} style={featured ? null : styles.cardCaption}>
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

    getDoc(doc(db, "businesses", uid))
      .then((snap) => {
        if (snap.exists()) {
          setUserInfo(snap.data());
        }
      })
      .catch(() => null);
  }, []);

  const businessName = userInfo?.businessName;
  const ownerName = userInfo?.name ?? "İşletme sahibi";
  const roleLabel = isAdmin ? "MASTER DASHBOARD" : "OPERASYON PANELİ";

  const dashboardCards = useMemo(
    () => [
      {
        key: "employees",
        title: isAdmin ? "Çalışanlar" : "Ekibim",
        caption: "Çalışanlarını gör, ekle ve düzenle",
        icon: "people-outline",
        image: CARD_IMAGES.employees,
        route: "/business/management/employees",
      },
      {
        key: "services",
        title: "Hizmetler",
        caption: "Hizmetlerini gör, ekle ve düzenle",
        icon: "cut-outline",
        image: CARD_IMAGES.services,
        route: "/business/management/services",
      },
      {
        key: "business",
        title: "İşletme bilgileri",
        caption: "Şube profilini düzenle",
        icon: "business-outline",
        image: CARD_IMAGES.business,
        route: "/business/management/business-info",
      },
      {
        key: "workingHours",
        title: "Çalışma saatleri",
        caption: "Çalışma saatlerini gör ve düzenle",
        icon: "time-outline",
        image: CARD_IMAGES.workingHours,
        route: "/business/management/working-hours",
      },
      {
        key: "accounting",
        title: "Muhasebe",
        caption: "Günlük ciroyu incele",
        icon: "wallet-outline",
        image: CARD_IMAGES.accounting,
        route: "/business/management/accounting",
      },
    ],
    [isAdmin],
  );

  const handleCardPress = (item) => {
    if (item.route) {
      router.push(item.route);
      return;
    }

    CommandBus.sc.alertInfo("Yolda", `${item.title} ekranı henüz bağlanmadı.`, 2400);
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
              <CustomText semibold fontSize={11} color={Colors.LightGray2}>
                {businessName}
              </CustomText>
            </View>
          </View>

          <Pressable style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]} onPress={() => router.push("/business/profil")}>
            <CustomText bold fontSize={12} color={Colors.BrandPrimary}>
              {general.getInitials(ownerName?.trim() || businessName) || "BR"}
            </CustomText>
          </Pressable>
        </View>

        <View style={styles.gridWrap}>
          <DashboardActionCard item={dashboardCards[0]} featured onPress={() => handleCardPress(dashboardCards[0])} />

          <View style={styles.miniGrid}>
            {dashboardCards.slice(1).map((item) => (
              <DashboardActionCard key={item.key} item={item} onPress={() => handleCardPress(item)} />
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
  gridWrap: {
    gap: 14,
  },
  featuredCardShell: {
    height: 216,
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
    height: 172,
    borderRadius: 20,
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
    borderRadius: 20,
  },
  cardOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  featuredCardOverlay: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardIconWrap: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(20,20,20,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardPulseDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.Gold,
  },
  cardTextWrap: {
    gap: 3,
  },
  cardTitle: {
    lineHeight: 24,
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
