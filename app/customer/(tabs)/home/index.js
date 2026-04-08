import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
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
import CustomerHomeCarousel from "@/components/high-level/customer-home-carousel";
import CustomerCategoryGrid from "@/components/high-level/customer-category-grid";
import CustomerPopularNearYou from "@/components/high-level/customer-popular-near-you";

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

  return (
    <LayoutView isActiveHeader={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: 16,
            paddingBottom: insets.bottom + 89,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTitle}>
            <CustomTouchableOpacity onPress={openDrawerMenu} style={styles.drawerButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="menu" size={26} color={Colors.BrandDark} />
            </CustomTouchableOpacity>
            <CustomImage uri={require("@/assets/logo1.png")} isLocalFile style={styles.headerLogo} contentFit="contain" />
            <CustomText usePrimaryColor semibold lg>
              BuRandevu
            </CustomText>
          </View>
        </View>

        <CustomerHomeCarousel />
        <CustomerCategoryGrid onCategoryPress={handleCategoryPress} onViewAllPress={handleViewAllPress} />
        <CustomerPopularNearYou businesses={businesses} loading={loadingBusinesses} onItemPress={handlePopularItemPress} />
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: 1,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  drawerButton: {
    padding: 2,
  },
  headerDescription: {
    paddingLeft: 2,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingBottom: 24,
  },
});
