import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import { Colors } from "@/constants/colors";

const CAROUSEL_URI = "https://lh3.googleusercontent.com/aida-public/AB6AXuCKr5MHDlQ7_urC_f1igIqF9Ezvs8eY8zHja7vgnWpgx69RMd7v0_oyIKFKgJfLpNrvGqXWd4h24L8_2IPakMmSDa_AYc0QUEJgYN4_-BdlgwFOgazBzrXF3rf9LZQ7kksdqZ34X0v-FPiTiUPmj_JvN0SfCrLblGEWiIYX6NC0DhPwIIuzWu3Mf0CjKF8w8rwNggYOgNURKGCz0oonmVjDfG9j1c36UxIw_krny8jhRA5jBoB95MNkc8UVP9X7EJB3YSg4lrJ-tzQ";

const CustomerHomeCarousel = () => {
  return (
    <CustomTouchableOpacity style={styles.card} activeOpacity={0.95}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: CAROUSEL_URI }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
          placeholder={{ color: "#2a2a2a" }}
          cachePolicy="memory-disk"
        />
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.badge}>
            <CustomText color={Colors.White} min bold letterSpacing={0.8}>
              Özel Teklif
            </CustomText>
          </View>

          <CustomText bold color={Colors.White} fontSize={25} lineHeight={31} style={styles.title}>
            Yaz Bakım{"\n"}Paketi - %20 İndirim
          </CustomText>

          <View style={styles.ctaRow}>
            <CustomText semibold sm color={Colors.BrandGold}>
              Hemen Randevu Al
            </CustomText>
            <Ionicons name="arrow-forward" size={16} color={Colors.BrandGold} />
          </View>
        </View>
      </View>
    </CustomTouchableOpacity>
  );
};

export default memo(CustomerHomeCarousel);

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 24,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: 192,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  content: {
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,193,7,0.88)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    maxWidth: "75%",
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
