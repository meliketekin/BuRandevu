import { useEffect, useState } from "react";
import { ImageBackground, View, StyleSheet, ScrollView, StatusBar } from "react-native";
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

const BG = require("@/assets/bg.png");

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
        console.log(docs);
        setBusinesses(docs);
      })
      .catch((error) => {
        console.log("error", error);
      })
      .finally(() => setLoadingBusinesses(false));
  }, []);

  const handleCategoryPress = (id) => {
    router.push("/customer/home/business-list");
  };

  const handleViewAllPress = () => {
    router.push("/customer/home/business-list");
  };

  const handlePopularItemPress = (id) => {
    router.push({ pathname: "/customer/business-detail", params: { id } });
  };

  const categoryCounts = businesses.reduce((acc, b) => {
    if (b.category) acc[b.category] = (acc[b.category] ?? 0) + 1;
    return acc;
  }, {});

  const header = (
    <ImageBackground source={BG} style={[styles.headerBg, { paddingTop: insets.top + 10 }]} resizeMode="cover">
      <StatusBar barStyle="light-content" />
      <View style={styles.headerTitle}>
        <CustomTouchableOpacity onPress={openDrawerMenu} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="menu" size={26} color={Colors.White} />
        </CustomTouchableOpacity>
        <View style={styles.headerLogoRow}>
          <CustomImage uri={require("@/assets/logo1.png")} isLocalFile style={styles.headerLogo} contentFit="contain" />
          <CustomText color={Colors.White} semibold lg>
            BuRandevu
          </CustomText>
        </View>
        <View style={styles.headerRight} />
      </View>
    </ImageBackground>
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
