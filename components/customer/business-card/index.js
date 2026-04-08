import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/components/high-level/custom-button";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const CustomerBusinessCard = ({ item, onBookPress }) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.imageUri }} style={styles.coverImage} resizeMode="cover" />

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color={Colors.BrandGold} />
          <CustomText semibold xs color={Colors.BrandPrimary} style={styles.ratingValue}>
            {item.rating}
          </CustomText>
          <CustomText min color={Colors.LightGray}>
            ({item.reviewCount})
          </CustomText>
        </View>
      </View>

      <View style={styles.content}>
        <CustomText bold lg color={Colors.BrandPrimary} numberOfLines={1}>
          {item.title}
        </CustomText>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={15} color={Colors.LightGray} />
          <CustomText sm color={Colors.LightGray} numberOfLines={1} style={styles.locationText}>
            {item.location}
          </CustomText>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.avatarStack}>
            {item.staffImages.map((avatarUri, index) => (
              <Image
                key={`${item.id}-staff-${index}`}
                source={{ uri: avatarUri }}
                style={[styles.avatar, index > 0 && styles.avatarOverlap]}
              />
            ))}
          </View>

          <CustomButton
            title="Randevu Al"
            onPress={() => onBookPress?.(item)}
            height={40}
            marginTop={0}
            borderRadius={12}
            backgroundColor={Colors.BrandPrimary}
            style={styles.bookButton}
            titleStyle={styles.bookButtonTitle}
            fontSize={13}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: "#F1F1F1",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  imageWrapper: {
    height: 170,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ratingValue: {
    marginLeft: 4,
    marginRight: 2,
  },
  content: {
    padding: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  locationText: {
    flex: 1,
    marginLeft: 4,
  },
  footerRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.White,
    backgroundColor: "#E5E7EB",
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  bookButton: {
    paddingHorizontal: 0,
    minWidth: 118,
  },
  bookButtonTitle: {
    lineHeight: 16,
  },
});

export default memo(CustomerBusinessCard);
