import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, deleteDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/firebase";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import ActivityLoading from "@/components/high-level/activity-loading";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";

const STATIC_RATING = "4.8";
const STATIC_REVIEW_COUNT = 124;
const STATIC_CATEGORY = "İşletme";

async function fetchFavorites(uid) {
  const favSnap = await getDocs(collection(db, "users", uid, "favorites"));
  if (favSnap.empty) return [];

  const results = await Promise.all(
    favSnap.docs.map(async (favDoc) => {
      const businessId = favDoc.data().businessId ?? favDoc.id;
      try {
        const bizSnap = await getDoc(doc(db, "businesses", businessId));
        if (!bizSnap.exists()) return null;
        const data = bizSnap.data();
        return {
          favDocId: favDoc.id,
          businessId,
          title: data.businessName ?? "İşletme",
          categoryLabel: data.category ?? STATIC_CATEGORY,
          rating: STATIC_RATING,
          reviewCount: STATIC_REVIEW_COUNT,
          location: data.address ?? "",
          imageUri: Array.isArray(data.venuePhotos) && data.venuePhotos.length > 0 ? data.venuePhotos[0] : null,
        };
      } catch {
        return null;
      }
    }),
  );

  return results.filter(Boolean);
}

const Favorites = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const loadFavorites = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchFavorites(uid);
      setItems(data);
    } catch (err) {
      console.error("Favorites load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
  );

  const handleRemove = useCallback(
    async (item) => {
      const uid = auth.currentUser?.uid;
      if (!uid || removingId) return;

      setRemovingId(item.favDocId);
      try {
        await deleteDoc(doc(db, "users", uid, "favorites", item.favDocId));
        setItems((prev) => prev.filter((i) => i.favDocId !== item.favDocId));
        CommandBus.sc.alertInfo("Favoriler güncellendi", `${item.title} favorilerden kaldırıldı.`, 2200);
      } catch (err) {
        console.error("Remove favorite error:", err);
      } finally {
        setRemovingId(null);
      }
    },
    [removingId],
  );

  const handleCardPress = useCallback(
    (item) => {
      router.push({ pathname: "/customer/business-detail", params: { id: item.businessId } });
    },
    [router],
  );

  const handleBookPress = useCallback(
    (item) => {
      router.push({ pathname: "/customer/business-detail", params: { id: item.businessId } });
    },
    [router],
  );

  return (
    <LayoutView title="Favorilerim" showBackButton={false} style={styles.layoutContent}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityLoading style={styles.loader} />
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-outline" size={28} color={Colors.LightGray2} />
            </View>
            <CustomText bold fontSize={15} color={Colors.BrandPrimary}>
              Henüz favori yok
            </CustomText>
            <CustomText medium fontSize={13} color={Colors.LightGray2} style={styles.emptyDescription}>
              Beğendiğin işletmeleri favorilere ekleyerek buradan hızlıca ulaşabilirsin.
            </CustomText>
          </View>
        ) : (
          <View style={styles.cardList}>
            {items.map((item) => (
              <Pressable key={item.favDocId} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => handleCardPress(item)}>
                <View style={styles.imageWrapper}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.image} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color={Colors.LightGray2} />
                    </View>
                  )}

                  <Pressable onPress={() => handleRemove(item)} disabled={removingId === item.favDocId} style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoriteButtonPressed]}>
                    <Ionicons name="heart" size={22} color="#8B6B16" />
                  </Pressable>

                  {!!item.categoryLabel && (
                    <View style={styles.categoryChip}>
                      <CustomText bold min color={Colors.White} style={styles.categoryChipText}>
                        {item.categoryLabel}
                      </CustomText>
                    </View>
                  )}
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
                        ({item.reviewCount} Değerlendirme)
                      </CustomText>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    {!!item.location && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={Colors.LightGray} />
                        <CustomText sm color={Colors.LightGray} numberOfLines={1} style={styles.locationText}>
                          {item.location}
                        </CustomText>
                      </View>
                    )}

                    <TouchableOpacity activeOpacity={0.9} style={styles.bookButton} onPress={() => handleBookPress(item)}>
                      <CustomText semibold sm color="#4F3E00">
                        Randevu Al
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </LayoutView>
  );
};

export default Favorites;

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
  loader: {
    minHeight: 200,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,20,20,0.05)",
    marginBottom: 4,
  },
  emptyDescription: {
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
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
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  imageWrapper: {
    height: 252,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
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
