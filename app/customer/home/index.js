import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import CustomImage from "@/components/high-level/custom-image";
import CustomerHomeCarousel from "@/components/high-level/customer-home-carousel";
import CustomerCategoryGrid from "@/components/high-level/customer-category-grid";
import CustomerPopularNearYou from "@/components/high-level/customer-popular-near-you";

export default function CustomerAnaSayfa() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleCategoryPress = (id) => {
    router.push("/customer/home/business-list");
  };

  const handleViewAllPress = () => {
    router.push("/customer/home/business-list");
  };

  const handlePopularItemPress = (id) => {
    // TODO: populer mekan detayına yönlendirme
  };

  return (
    <LayoutView isActiveHeader={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTitle}>
            <CustomImage uri={require("../../../assets/logo1.png")} isLocalFile style={styles.headerLogo} contentFit="contain" />
            <CustomText usePrimaryColor semibold lg>
              BuRandevu
            </CustomText>
          </View>
          <CustomText color={Colors.LightGray} sm style={styles.headerDescription}>
            Randevu almak için bir kategori seçin
          </CustomText>
        </View>

        <CustomerHomeCarousel />
        <CustomerCategoryGrid onCategoryPress={handleCategoryPress} onViewAllPress={handleViewAllPress} />
        <CustomerPopularNearYou onItemPress={handlePopularItemPress} />
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: 24,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
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
