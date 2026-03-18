import React, { memo } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import { Colors } from "@/constants/colors";

const CATEGORY_ITEMS = [
  {
    id: "male-barber",
    title: "Erkek Berberi",
    serviceCount: "128 Hizmet",
    icon: "cut-outline",
    imageUri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZB7aYBPzkO189w6sQttYhW9xxo3DciHXknuxqd5qFjzvVNWI2qPcrZ5FPgWpj5x4Bj_1RFQwiDwQD-1ftp2lN515fwLrczKh83CRopvaczUWJBocG5RAZp2BxCD_PvaOw_rlxqlQL4A44GEyCo-ynTka1US-TrKDDgigOwkQWfPD0VydRZuTJ921Nvsd29RMZh7W0A-nmMD_5Mn7od5P2oOV2eyVDjoCYm5JLGRBsDmSMKxDYagfmiVRTYXwsUSsfa-WnVOD97jY",
  },
  {
    id: "female-salon",
    title: "Kadın Kuaförü",
    serviceCount: "240 Hizmet",
    icon: "woman-outline",
    imageUri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCb6WT0MIRTn9wAcFIdxn67ycXJftjBh1UM-Bdadk0WrFhVKZ4gFRPCq9ZEoC7q0YLPYnOPwd3FxN1wXthzz68Ijt1csG2DBTXeNnIzW7qoIxZ_zqs7FN9KkE3r7FPtgboVmeB0a4ezek-EO5fxXbXNB4-DPbwLnENVbLT9PxdBcloRppbychlxLal3jxP_-oVmcrsDPq5H0yHN5WGJ1YBeqjOY4wbcgiAd0botCRPf0JF_pPqXAYssFKUZo5xotTljGNbgXKHn-HA",
  },
  {
    id: "nail-art",
    title: "Oje & Manikür",
    serviceCount: "85 Hizmet",
    icon: "sparkles-outline",
    imageUri: "https://lh3.googleusercontent.com/aida-public/AB6AXuChj6rCycgyjautPm9wU-h7Eo960rNVk8V8e5-C-4d43wEvO5Kpb2zOOnQ8phRyx1ovzOOj_IQlMnPirACSqUzzmWA0jsmX4eOwEXsT3uG_z6KYrvWLr_uOz5quDXeZ7OeMkDzaE8c9pyqv-SdJe5hsd68VRfx9up7kS4viFZy1xZcMHhRKw89qesh6ZYJWqoYLjnsKwVImcYTWVR1pSSsG6o0x239ZzTQZxxgvGQ4C5D4PFhUM6wrbBuZiA79EF3134_nPlgQy1B4",
  },
  {
    id: "spa-massage",
    title: "Spa & Masaj",
    serviceCount: "56 Hizmet",
    icon: "flower-outline",
    imageUri: "https://lh3.googleusercontent.com/aida-public/AB6AXuACHD6HD5XEstT1oVzOqzl5THscUbYsJqep7Rq3pnOJ-JtkzU8UDPGiqta6fRpyUvTZ6IcI-ff9Clu4qYoXuuIuSGisz4nr26EbKIM8cDE0aUfXcagGn3uO3FWniiIQQQZ1tlLl5a1Y61mXOXMA-R2nWUd_ggMG7AJLGDYJ9oZskjtnAsaePbOrNxvXD6eX1TjaQlNZ8L3bsJVV0UghkxOUMqD8ylCln0iou3KAvfNU9ywH0h4ItHDbcIBg2Qk4bYWhVkRowYBCG1Y",
  },
];

const CustomerCategoryGrid = ({ onCategoryPress, onViewAllPress }) => {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <CustomText bold lg color={Colors.BrandPrimary}>
          Kategorilere Göz At
        </CustomText>
        <CustomTouchableOpacity activeOpacity={0.8} onPress={onViewAllPress}>
          <CustomText semibold sm color={Colors.BrandGold}>
            Tümünü Gör
          </CustomText>
        </CustomTouchableOpacity>
      </View>

      <View style={styles.grid}>
        {CATEGORY_ITEMS.map((item) => (
          <CustomTouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9} onPress={() => onCategoryPress?.(item.id)}>
            <ImageBackground source={{ uri: item.imageUri }} style={styles.image} imageStyle={styles.imageStyle}>
              <View style={styles.overlay} />

              <View style={styles.content}>
                <View style={styles.iconBadge}>
                  <Ionicons name={item.icon} size={16} color={Colors.White} />
                </View>

                <View>
                  <CustomText bold color={Colors.White} fontSize={18} lineHeight={22}>
                    {item.title}
                  </CustomText>
                  <CustomText color="rgba(255,255,255,0.85)" xs style={styles.serviceCount}>
                    {item.serviceCount}
                  </CustomText>
                </View>
              </View>
            </ImageBackground>
          </CustomTouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  card: {
    width: "48%",
    aspectRatio: 0.8,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: Colors.BorderColor,
  },
  image: {
    flex: 1,
    justifyContent: "flex-end",
  },
  imageStyle: {
    borderRadius: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    marginBottom: 10,
  },
  serviceCount: {
    marginTop: 3,
  },
});

export default memo(CustomerCategoryGrid);
