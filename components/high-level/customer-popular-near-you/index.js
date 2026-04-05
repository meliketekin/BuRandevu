import React, { memo } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import { Colors } from "@/constants/colors";

const CustomerPopularNearYou = ({ businesses = [], loading = false, onItemPress }) => {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <CustomText bold lg color={Colors.BrandPrimary}>
          Yakınındaki Popülerler
        </CustomText>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={Colors.BrandPrimary} style={styles.loader} />
      ) : businesses.length === 0 ? (
        <CustomText fontSize={13} color={Colors.LightGray} style={styles.emptyText}>
          Henüz kayıtlı işletme yok.
        </CustomText>
      ) : (
        <View style={styles.list}>
          {businesses.map((item) => {
            const imageUri = Array.isArray(item.venuePhotos) && item.venuePhotos.length > 0 ? item.venuePhotos[0] : null;
            const subtitle = [item.category, item.address].filter(Boolean).join(" • ");

            return (
              <CustomTouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9} onPress={() => onItemPress?.(item.id)}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
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
  loader: {
    marginTop: 12,
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
  },
  imagePlaceholder: {
    backgroundColor: "#F5F5F5",
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
});

export default memo(CustomerPopularNearYou);
