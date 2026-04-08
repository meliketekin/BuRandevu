import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import CustomerBusinessCard from "@/components/customer/business-card";
import CustomerBusinessCategoryTabs from "@/components/customer/business-category-tabs";
import { Colors } from "@/constants/colors";
import { BUSINESS_CATEGORIES } from "@/enums/business-category-enum";
import { BUSINESS_ITEMS } from "@/constants/customer-businesses";

const BusinessList = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBusinesses = useMemo(() => {
    if (selectedCategory === "all") return BUSINESS_ITEMS;
    return BUSINESS_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);


  return (
    <LayoutView
      showBackButton
      title="Salonlar & Spalar"
      rightButton={
        <CustomTouchableOpacity activeOpacity={0.8}>
          <Ionicons name="search-outline" size={22} color={Colors.BrandPrimary} />
        </CustomTouchableOpacity>
      }
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <CustomerBusinessCategoryTabs categories={BUSINESS_CATEGORIES} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

        <View style={styles.sectionHeader}>
          <CustomText bold xlg color={Colors.BrandPrimary}>
            Yakınındaki En İyiler
          </CustomText>
          <CustomTouchableOpacity activeOpacity={0.8} onPress={() => setSelectedCategory("all")}>
            <CustomText semibold sm color={Colors.LightGray}>
              Tümünü Gör
            </CustomText>
          </CustomTouchableOpacity>
        </View>

        <View style={styles.list}>
          {filteredBusinesses.map((item) => (
            <CustomTouchableOpacity
              key={item.id}
              activeOpacity={0.96}
              onPress={() => router.push({ pathname: "/customer/business-detail", params: { id: item.id } })}
            >
              <CustomerBusinessCard item={item} />
            </CustomTouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LayoutView>
  );
};

export default BusinessList;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  list: {
    gap: 18,
  },
});