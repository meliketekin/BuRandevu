import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { View, StyleSheet, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { useDrawerStore } from "@/stores/drawer-store";
import { Ionicons } from "@expo/vector-icons";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import CustomImage from "@/components/high-level/custom-image";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import CustomerHomeCarousel from "@/components/customer/home-carousel";
import CustomerCategoryGrid from "@/components/customer/category-grid";
import CustomerPopularNearYou from "@/components/customer/popular-near-you";
import { normalizeBusinessCategory } from "@/enums/business-category-enum";

export default function CustomerAnaSayfa() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openDrawerMenu = useDrawerStore((s) => s.openDrawer);
  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  useEffect(() => {
    console.log("getBusinesses");
    getDocs(collection(db, "businesses"))
      .then((snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBusinesses(docs);
        const uris = docs.map((d) => d.venuePhotos?.[0] ?? d.servicePhotos?.[0]).filter(Boolean);
        if (uris.length) Image.prefetch(uris);
      })
      .finally(() => setLoadingBusinesses(false));
  }, []);

  const handleCategoryPress = (categoryId) => {
    router.push({ pathname: "/customer/home/business-list", params: { category: categoryId } });
  };

  const handleViewAllPress = () => {
    router.push({ pathname: "/customer/home/business-list", params: { category: "all" } });
  };

  const handlePopularItemPress = (id) => {
    router.push({ pathname: "/customer/business-detail", params: { id } });
  };

  const categoryCounts = businesses.reduce((acc, b) => {
    const cat = normalizeBusinessCategory(b.category ?? "");
    if (cat) acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const header = (
    <View style={[styles.headerBg, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerTitle}>
        <CustomTouchableOpacity onPress={openDrawerMenu} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="menu" size={26} color={Colors.BrandPrimary} />
        </CustomTouchableOpacity>
        <View style={styles.headerLogoRow}>
          <CustomImage uri={require("@/assets/logo1.png")} isLocalFile style={styles.headerLogo} contentFit="contain" />
          <CustomText color={Colors.BrandPrimary} semibold lg>
            BuRandevu
          </CustomText>
        </View>
        <View style={styles.headerRight} />
      </View>
    </View>
  );

  return (
    <LayoutView isActiveHeader={false} paddingTop={0} paddingHorizontal={0} customHeader={header}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 89 }]} showsVerticalScrollIndicator={false}>
        <CustomerHomeCarousel />
        <CustomerCategoryGrid onCategoryPress={handleCategoryPress} onViewAllPress={handleViewAllPress} categoryCounts={categoryCounts} />
        <CustomerPopularNearYou businesses={businesses} loading={loadingBusinesses} onItemPress={handlePopularItemPress} />
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    backgroundColor: Colors.Background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(20,20,20,0.08)",
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  headerRight: {
    width: 26,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
});
