import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import LayoutView from "../../components/high-level/layout-view";
import CustomText from "../../components/high-level/custom-text";
import CustomButton from "../../components/high-level/custom-button";
import { Colors } from "../../constants/colors";

const PROFILE_MENU = [
  {
    key: "hesap",
    title: "Hesap",
    items: [
      { id: "profil-duzenle", label: "Profilimi Düzenle", icon: "person-outline", route: null },
      { id: "favoriler", label: "Favoriler", icon: "heart-outline", route: null },
      { id: "puanlar", label: "Puanlar", icon: "star-outline", route: null },
    ],
  },
  {
    key: "destek",
    title: "Destek",
    items: [
      { id: "kullanim-kosullari", label: "Kullanım Koşulları", icon: "document-text-outline", route: "/kullanim-kosullari" },
      { id: "gizlilik", label: "Gizlilik Politikası", icon: "shield-checkmark-outline", route: null },
      { id: "iletisim", label: "İletişim", icon: "chatbubble-outline", route: null },
    ],
  },
];

export default function CustomerProfil() {
  const insets = useSafeAreaInsets();

  const handleMenuPress = (item) => {
    if (item.route) router.push(item.route);
  };

  const handleLogout = () => {
    router.replace("/");
  };

  // TODO: Auth'dan kullanıcı bilgisi
  const userName = "Kullanıcı Adı";
  const userEmail = "ornek@email.com";

  return (
    <LayoutView isActiveHeader={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil başlık */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <CustomText color={Colors.White} bold fontSize={28}>
              {userName.charAt(0).toUpperCase()}
            </CustomText>
          </View>
          <CustomText color={Colors.BrandDark} semibold fontSize={20} style={styles.profileName}>
            {userName}
          </CustomText>
          <CustomText color={Colors.LightGray} sm style={styles.profileEmail}>
            {userEmail}
          </CustomText>
        </View>

        {/* Menü kartları */}
        {PROFILE_MENU.map((section) => (
          <View key={section.key} style={styles.section}>
            <CustomText color={Colors.LightGray} xs style={styles.sectionTitle}>
              {section.title}
            </CustomText>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.menuRow, index < section.items.length - 1 && styles.menuRowBorder, pressed && styles.menuRowPressed]}
                  onPress={() => handleMenuPress(item)}
                >
                  <Ionicons name={item.icon} size={22} color={Colors.BrandPrimary} style={styles.menuIcon} />
                  <CustomText color={Colors.TextColor} sm style={styles.menuLabel}>
                    {item.label}
                  </CustomText>
                  <Ionicons name="chevron-forward" size={20} color={Colors.LightGray} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <CustomButton
          title="Çıkış yap"
          onPress={handleLogout}
          whiteBg
          fontColor={Colors.ErrorColor}
          style={styles.logoutButton}
          marginTop={32}
          leftIcon={<Ionicons name="log-out-outline" size={22} color={Colors.ErrorColor} />}
        />
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileName: {
    marginBottom: 4,
  },
  profileEmail: {
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: Colors.BrandDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderColor,
  },
  menuRowPressed: {
    backgroundColor: Colors.BrandBackground,
    opacity: 0.9,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: Colors.ErrorColor,
  },
});
