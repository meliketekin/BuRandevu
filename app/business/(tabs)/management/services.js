import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import { SERVICES } from "./services-data";

export default function Services() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.BrandPrimary} />
        </Pressable>
        <CustomText extraBold fontSize={22} color={Colors.BrandPrimary} style={styles.headerTitle}>
          Hizmetler
        </CustomText>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          onPress={() => router.push("/business/management/create-service")}
        >
          <View style={styles.addButtonInner}>
            <Ionicons name="add" size={20} color={Colors.White} />
          </View>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 112 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={15} color={Colors.Gold} />
            <CustomText interBold fontSize={10} color={Colors.Gold} letterSpacing={1.2}>
              PREMIUM MENU
            </CustomText>
          </View>
          <CustomText extraBold fontSize={24} color={Colors.BrandPrimary} style={styles.heroTitle}>
            Hizmetlerini daha iyi yonet
          </CustomText>
          <CustomText interMedium fontSize={13} color={Colors.LightGray2} style={styles.heroDescription}>
            Fiyat, sure ve aciklama detaylarini tek ekranda duzenleyip hizmet deneyimini daha modern bir yapida yonet.
          </CustomText>
        </View>

        <View style={styles.list}>
          {SERVICES.map((service) => (
            <View key={service.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name="cut-outline" size={18} color={Colors.Gold} />
                </View>

                <View style={styles.employeeInfo}>
                  <CustomText bold color={Colors.BrandPrimary} style={styles.employeeName}>
                    {service.name}
                  </CustomText>
                  <CustomText interMedium fontSize={12} color={Colors.LightGray2} style={styles.description}>
                    {service.description}
                  </CustomText>

                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={13} color={Colors.BrandPrimary} />
                      <CustomText interBold fontSize={10} color={Colors.BrandPrimary} letterSpacing={0.4}>
                        {service.duration}
                      </CustomText>
                    </View>

                    <View style={[styles.metaChip, styles.priceChip]}>
                      <Ionicons name="wallet-outline" size={13} color={Colors.Gold} />
                      <CustomText interBold fontSize={10} color={Colors.Gold} letterSpacing={0.4}>
                        {service.price}
                      </CustomText>
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: "/business/management/create-service",
                    params: {
                      mode: "edit",
                      id: service.id,
                      name: service.name,
                      description: service.description,
                      price: service.price,
                      duration: service.duration,
                    },
                  })
                }
              >
                <Ionicons name="create-outline" size={18} color={Colors.BrandPrimary} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BrandBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.BrandBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(20,20,20,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.Gold,
    shadowColor: Colors.Gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  heroCard: {
    backgroundColor: Colors.White,
    borderRadius: 24,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.14)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  heroTitle: {
    letterSpacing: -0.6,
  },
  heroDescription: {
    lineHeight: 20,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.White,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.14)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.045,
    shadowRadius: 22,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    flex: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  employeeName: {
    letterSpacing: -0.3,
    fontSize: 16,
  },
  description: {
    lineHeight: 18,
  },
  employeeInfo: {
    flex: 1,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F4F6F8",
  },
  priceChip: {
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    shadowColor: Colors.Gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
});
