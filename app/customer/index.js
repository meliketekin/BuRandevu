import { View, StyleSheet, Pressable, ScrollView, Image, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import CustomImage from "@/components/high-level/custom-image";

const CATEGORIES = [
  {
    id: "berber",
    label: "BERBER",
    backgroundColor: "#5C4B37",
    imageUri: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80",
  },
  {
    id: "kuaför",
    label: "KUAFÖR",
    backgroundColor: "#4A5568",
    imageUri: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80",
  },
  {
    id: "nail-art",
    label: "NAIL ART",
    backgroundColor: "#6B4E71",
    imageUri: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80",
  },
];

export default function CustomerAnaSayfa() {
  const insets = useSafeAreaInsets();

  const handleCategoryPress = (id) => {
    // TODO: kategori sayfasına yönlendirme
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
            <CustomImage uri={require("../../assets/logo1.png")} isLocalFile style={styles.headerLogo} contentFit="contain" />
            <CustomText usePrimaryColor semibold lg>
              BuRandevu
            </CustomText>
          </View>
          <CustomText color={Colors.LightGray} sm style={styles.headerDescription}>
            Randevu almak için bir kategori seçin
          </CustomText>
        </View>
        {CATEGORIES.map((item) => (
          <CustomTouchableOpacity activeOpacity={0.5} key={item.id} style={styles.card} backgroundColor={item.backgroundColor} onPress={() => handleCategoryPress(item.id)}>
            <ImageBackground source={{ uri: item.imageUri }} style={styles.cardImage} imageStyle={styles.cardImageStyle} resizeMode="cover">
              <View style={styles.overlay} />
              <CustomText style={styles.cardLabel} color={Colors.White} bold fontSize={18}>
                {item.label}
              </CustomText>
            </ImageBackground>
          </CustomTouchableOpacity>
        ))}
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
  card: {
    height: 180,
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  cardLabel: {
    letterSpacing: 2,
    zIndex: 1,
  },
  cardPressed: {
    opacity: 0.9,
  },
});
