import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import LayoutView from "../../components/high-level/layout-view";
import CustomText from "../../components/high-level/custom-text";
import { Colors } from "../../constants/colors";
import CommandBus from "../../infrastructures/command-bus/command-bus";

const PROFILE_MENU = [
  {
    key: "hesap",
    title: "Hesap",
    items: [
      { id: "profil-duzenle", label: "Profilimi Düzenle", icon: "person-outline", route: null },
      { id: "favoriler", label: "Favoriler", icon: "heart-outline", route: "/customer/favorites" },
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
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) setUserInfo(snap.data());
    });
  }, []);

  const handleMenuPress = (item) => {
    if (item.route) {
      router.push(item.route);
      return;
    }

    CommandBus.sc.alertInfo("Yolda", `${item.label} ekrani yakinda kullanima acilacak.`, 2200);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      CommandBus.sc.alertSuccess("Oturum kapatildi", "Ana ekrana yonlendiriliyorsun.", 1800);
      router.replace("/");
    } catch (_error) {
      CommandBus.sc.alertError("Bir seyler ters gitti", "Oturum kapatilamadi. Lutfen tekrar dene.", 2200);
    }
  };

  const userName = userInfo?.name ?? auth.currentUser?.displayName ?? "Kullanıcı";
  const userEmail = userInfo?.email ?? auth.currentUser?.email ?? "";
  const avatarUri =
    userInfo?.photoURL ??
    auth.currentUser?.photoURL ??
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAthtWm3EdkkhKMGs2D9_Dm7lS5M1LIjLTnu0oiq5T_Bz0KoCuABeUY18s5SepQA5pjBC2oW6Jxgq6aMeBeRYa0sXuvZLhj_fv76wqd_dTh3_ysJceF7H83dXzKnNvGM1m45UccvDn9Vd_VB9CkrOPumy4aUfOyX0VQGr2anMZgQFdjF5cwWyB8Hptig8JWITcBFFDyXqGj96GIIB1oEUXo1ZjrDckDaUyxLHie8q8oID9lICqJ6Yp8sW9aIJ4CZHLsE2zwZwwcgW0";

  return (
    <LayoutView
      title="Profilim"
      showBackButton={false}
      style={styles.layoutContent}
      rightButton={
        <View style={styles.headerActions}>
          <Pressable style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressedState]}>
            <Ionicons name="notifications-outline" size={20} color={Colors.BrandPrimary} />
          </Pressable>

          <Image source={{ uri: avatarUri }} style={styles.headerAvatar} resizeMode="cover" />
        </View>
      }
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarBorder}>
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
              </View>
            </View>

            <Pressable style={({ pressed }) => [styles.editAvatarButton, pressed && styles.pressedState]}>
              <Ionicons name="create-outline" size={16} color={Colors.White} />
            </Pressable>
          </View>

          <CustomText color={Colors.BrandPrimary} bold fontSize={24} style={styles.profileName}>
            {userName}
          </CustomText>
          <CustomText color="#858383" sm style={styles.profileEmail}>
            {userEmail}
          </CustomText>
        </View>

        {PROFILE_MENU.map((section) => (
          <View key={section.key} style={styles.section}>
            <CustomText color="#735C00" xs bold style={styles.sectionTitle}>
              {section.title}
            </CustomText>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.menuRow, index < section.items.length - 1 && styles.menuRowBorder, pressed && styles.menuRowPressed]}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon} size={20} color={Colors.BrandPrimary} style={styles.menuIcon} />
                  </View>
                  <CustomText color={Colors.TextColor} sm medium style={styles.menuLabel}>
                    {item.label}
                  </CustomText>
                  <Ionicons name="chevron-forward" size={18} color="#8C8F93" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]} onPress={handleLogout}>
          <CustomText color={Colors.ErrorColor} bold sm style={styles.logoutText}>
            Çıkış Yap
          </CustomText>
        </Pressable>
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  layoutContent: {
    paddingHorizontal: 0,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.08)",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 36,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 18,
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#D4AF37",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  avatarBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 62,
    backgroundColor: Colors.White,
    padding: 4,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 58,
  },
  editAvatarButton: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.White,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  profileName: {
    marginBottom: 6,
  },
  profileEmail: {
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 4,
    textTransform: "uppercase",
    letterSpacing: 2.4,
  },
  card: {
    backgroundColor: Colors.White,
    borderRadius: 20,
    paddingVertical: 4,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.04)",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(196,199,199,0.25)",
  },
  menuRowPressed: {
    backgroundColor: "#F8F8F8",
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuIcon: {
    marginRight: 0,
  },
  menuLabel: {
    flex: 1,
  },
  logoutButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.18)",
    backgroundColor: "rgba(255,59,48,0.05)",
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 82,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutText: {
    letterSpacing: -0.2,
  },
  pressedState: {
    opacity: 0.8,
  },
});
