import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import SkeletonBox from "@/components/high-level/skeleton-box";
import { Colors } from "@/constants/colors";

function PopularRowSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <SkeletonBox style={styles.skeletonTitle} />
        <SkeletonBox style={styles.skeletonSubtitle} />
      </View>
      <SkeletonBox style={styles.skeletonChevron} />
    </View>
  );
}

const CustomerPopularNearYou = ({ businesses = [], loading = false, onItemPress }) => {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <CustomText bold lg color={Colors.BrandPrimary}>
          Yakınındaki Popülerler
        </CustomText>
      </View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <PopularRowSkeleton key={i} />)}
        </View>
      ) : businesses.length === 0 ? (
        <CustomText fontSize={13} color={Colors.LightGray} style={styles.emptyText}>
          Henüz kayıtlı işletme yok.
        </CustomText>
      ) : (
        <View style={styles.list}>
          {businesses.map((item) => {
            const imageUri = item.venuePhotos?.[0] ?? item.servicePhotos?.[0] ?? null;
            const subtitle = [item.category, item.address].filter(Boolean).join(" • ");

            return (
              <CustomTouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9} onPress={() => onItemPress?.(item.id)}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ color: "#F5F5F5" }}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.image, styles.imageFallback]}>
                    <Ionicons name="business-outline" size={24} color="#C0C0C0" />
                  </View>
                )}

                <View style={styles.content}>
                  <CustomText bold color={Colors.BrandPrimary} fontSize={16} lineHeight={20}>
                    {item.businessName || "İşletme"}
                  </CustomText>
                  {!!subtitle && (
                    <CustomText xs color={Colors.LightGray} style={styles.subtitle}>
                      {subtitle}
                    </CustomText>
                  )}
                </View>

                <View style={styles.chevronWrapper}>
                  <Ionicons name="chevron-forward" size={18} color={Colors.LightGray} />
                </View>
              </CustomTouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  headerRow: {
    marginBottom: 14,
  },
  emptyText: {
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: "#F1F1F1",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: "#F5F5F5",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  chevronWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
    marginLeft: 10,
  },
  // skeleton
  skeletonImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 14,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    height: 16,
    borderRadius: 6,
    width: "65%",
  },
  skeletonSubtitle: {
    height: 12,
    borderRadius: 6,
    width: "80%",
  },
  skeletonChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 10,
  },
});

export default memo(CustomerPopularNearYou);
