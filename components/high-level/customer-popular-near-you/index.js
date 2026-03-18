import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import { Colors } from "@/constants/colors";

const POPULAR_ITEMS = [
  {
    id: "luxe-hair-studio",
    title: "Luxe Saç Stüdyosu",
    subtitle: "1.2 km • Saç & Stil",
    rating: "4.8",
    reviews: "(120+ değerlendirme)",
    imageUri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJjODxESe-ZVL06WZM3hKN_e4YmHuWWVRga1We-QQcOvP9VBv7UEHCoc8pc25x3Pa4HqxFzK-WabyJXURstR4dKmD0Ty-FiIY2COhnbnPJ0OAiEDhGik8oSiPBcR36R7KLvG7sNxu15nD1qgMqvoLGqg8AtQtaKBVp3-8PFiQzt_AfXhY9nfChxyHTuxpI3JbhIV-0S7n7O7h8ILJmSZB2CR0F9SXArZish_kwbjK0mXnX5Rv-vlIZ-xCrwaEVeTTKG64akqneMrw",
  },
  {
    id: "gentlemans-cut",
    title: "Gentleman's Cut",
    subtitle: "0.8 km • Berber",
    rating: "4.9",
    reviews: "(210+ değerlendirme)",
    imageUri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUR90ZvZHY2hoSwZ-maNHhFgWxdqpINIxcjS_QWKsvqrLns3JfNavNoM6TgNybKeEqGvpIvxyuPzQg49JIMtGJNUwipNi9CGl-2GMHWIJwap9dw9u7aZJlzBwcmZfwNdA20-Hx9tL39TBIbdOF3M8ZoBFFN5ztuaaKhYyDci0-4S5KnZpAitx9i4Qybl6TLZBSP66J3AA9k9oFsdEk5od4VuikRA8ufg9p0qCOJnBUDax6SrDz2smccNYC3Ko9KSJFZixFQkEkgCU",
  },
  {
    id: "nail-lounge",
    title: "Nail Lounge Stüdyo",
    subtitle: "1.6 km • Oje & Manikür",
    rating: "4.7",
    reviews: "(95+ değerlendirme)",
    imageUri: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80",
  },
  {
    id: "serenity-spa",
    title: "Serenity Spa",
    subtitle: "2.1 km • Spa & Masaj",
    rating: "4.9",
    reviews: "(160+ değerlendirme)",
    imageUri: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
  },
  {
    id: "glow-beauty-house",
    title: "Glow Güzellik Evi",
    subtitle: "1.4 km • Kadın Kuaförü",
    rating: "4.8",
    reviews: "(180+ değerlendirme)",
    imageUri: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80",
  },
  {
    id: "urban-fade-barber",
    title: "Urban Fade Berber",
    subtitle: "0.9 km • Berber",
    rating: "4.8",
    reviews: "(140+ değerlendirme)",
    imageUri: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80",
  },
];

const CustomerPopularNearYou = ({ onItemPress }) => {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <CustomText bold lg color={Colors.BrandPrimary}>
          Yakınındaki Popülerler
        </CustomText>
      </View>

      <View style={styles.list}>
        {POPULAR_ITEMS.map((item) => (
          <CustomTouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9} onPress={() => onItemPress?.(item.id)}>
            <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" />

            <View style={styles.content}>
              <CustomText bold color={Colors.BrandPrimary} fontSize={16} lineHeight={20}>
                {item.title}
              </CustomText>
              <CustomText xs color={Colors.LightGray} style={styles.subtitle}>
                {item.subtitle}
              </CustomText>

              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={Colors.BrandGold} />
                <CustomText semibold xs color={Colors.BrandPrimary} style={styles.ratingText}>
                  {item.rating}
                </CustomText>
                <CustomText xs color="#A0A6AF">
                  {item.reviews}
                </CustomText>
              </View>
            </View>

            <View style={styles.chevronWrapper}>
              <Ionicons name="chevron-forward" size={18} color={Colors.LightGray} />
            </View>
          </CustomTouchableOpacity>
        ))}
      </View>
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
  content: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    marginRight: 4,
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
