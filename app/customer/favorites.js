import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";

const FAVORITE_ITEMS = [
  {
    id: "gentlemens-atelier",
    businessId: "gentlemans-cut",
    title: "Gentlemen's Atelier",
    categoryLabel: "Barber Shop",
    rating: "4.9",
    reviewCount: 124,
    location: "Nisantasi, Istanbul",
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB72-YFodsF7Y5DPrm3NYwWufO449QbFpUexNDD1a-xsZOzRAfAuhK6AcJdE2ZqKj-MORnaRSLFrrUXr7CAGEDlqmnxj2h9UcQren_iMDuQJqRtbZddFgGWV9J5tdQCFRlf0e6dlEaqwP58SXrQj_52Ctnp-rEkJyGU1lWBPU6jj0R8mEMttsd2q4AHYsyxCgjl1ezYMhX8AeciDpvwXUJSboq0nH5k2BgnqSD5K7b7UO6i1EtbmBpcoKVSjr3nHmCGIEko4uMrgO4",
  },
  {
    id: "pure-aesthetics",
    businessId: "serenity-spa",
    title: "Pure Aesthetics",
    categoryLabel: "Beauty Lounge",
    rating: "4.8",
    reviewCount: 208,
    location: "Bebek, Istanbul",
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAGt8bDgw6GzmoGMVZKEFsS31cFRC_vGOYTTGEgIeKBGbMdrZ14xHyfCVkur6wdu5mVt4mw8AeeHUy20uq-plZRhAIbuDJMPo-Z3TwMKcptfDkXugH2BnfYHixOKu-P22nVwuITl9AmCpLIs_IX6R4tKGh4Lpj1lb6Rk4rlF3xY5BwrYxe7afnwU_vHRifMBwV2uMZTmj6rah9b17hydQh2BqsDsTM1bIq1xGcnQ148UilOpn5Ymk8Bw9pu0jOKo4ju-F6NcoM-u8Q",
  },
];

const favorites = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favoriteIds, setFavoriteIds] = useState(FAVORITE_ITEMS.map((item) => item.id));

  const toggleFavorite = (item) => {
    const isFavorite = favoriteIds.includes(item.id);

    setFavoriteIds((prev) => (isFavorite ? prev.filter((itemId) => itemId !== item.id) : [...prev, item.id]));

    if (isFavorite) {
      CommandBus.sc.alertInfo("Favoriler guncellendi", `${item.title} favorilerinden kaldirildi.`, 2200);
      return;
    }

    CommandBus.sc.alertSuccess("Favorilere eklendi", `${item.title} artik favorilerinde gorunuyor.`, 2200);
  };

  const handleBookPress = (item) => {
    CommandBus.sc.alertSuccess("Yonlendiriliyorsun", `${item.title} icin randevu ekranina geciliyor.`, 1800);
    router.push({
      pathname: "/customer/home/create-appointment",
      params: { id: item.businessId },
    });
  };

  return (
    <LayoutView title="Favorilerim" showBackButton={false} style={styles.layoutContent}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <CustomText sm color={Colors.LightGray} style={styles.subtitle}>
            En sevdiginiz studyolar ve sanatcilar tek bir yerde.
          </CustomText>
        </View>

        <View style={styles.cardList}>
          {FAVORITE_ITEMS.map((item) => {
            const isFavorite = favoriteIds.includes(item.id);

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" />

                  <Pressable
                    onPress={() => toggleFavorite(item)}
                    style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoriteButtonPressed]}
                  >
                    <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color="#8B6B16" />
                  </Pressable>

                  <View style={styles.categoryChip}>
                    <CustomText bold min color={Colors.White} style={styles.categoryChipText}>
                      {item.categoryLabel}
                    </CustomText>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <CustomText bold lg color={Colors.BrandPrimary} style={styles.cardTitle}>
                      {item.title}
                    </CustomText>

                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#8B6B16" />
                      <CustomText semibold xs color="#8B6B16" style={styles.ratingValue}>
                        {item.rating}
                      </CustomText>
                      <CustomText sm color={Colors.LightGray} style={styles.reviewText}>
                        ({item.reviewCount} Degerlendirme)
                      </CustomText>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={16} color={Colors.LightGray} />
                      <CustomText sm color={Colors.LightGray} numberOfLines={1} style={styles.locationText}>
                        {item.location}
                      </CustomText>
                    </View>

                    <TouchableOpacity activeOpacity={0.9} style={styles.bookButton} onPress={() => handleBookPress(item)}>
                      <CustomText semibold sm color="#4F3E00">
                        Randevu Al
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </LayoutView>
  );
};

export default favorites;

const styles = StyleSheet.create({
  layoutContent: {
    paddingHorizontal: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerSection: {
    marginBottom: 24,
  },
  subtitle: {
    lineHeight: 20,
  },
  cardList: {
    gap: 20,
    paddingBottom: 42,
  },
  card: {
    backgroundColor: Colors.White,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.05)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  },
  imageWrapper: {
    height: 252,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  favoriteButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  categoryChip: {
    position: "absolute",
    left: 16,
    bottom: 16,
    backgroundColor: "rgba(20,20,20,0.82)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipText: {
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  cardHeader: {
    marginBottom: 18,
  },
  cardTitle: {
    lineHeight: 26,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingValue: {
    marginLeft: 4,
  },
  reviewText: {
    marginLeft: 6,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  locationRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    flex: 1,
    marginLeft: 6,
  },
  bookButton: {
    backgroundColor: "#D7B24A",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
});