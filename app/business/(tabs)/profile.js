import { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Image, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LayoutView from "@/components/high-level/layout-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";
import general from "@/utils/general";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const [userInfo, setUserInfo] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) setUserInfo(snap.data());
    });
    getDoc(doc(db, "businesses", uid)).then((snap) => {
      if (snap.exists()) setBusinessInfo(snap.data());
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearAuth();
      router.replace("/");
    } catch {
      CommandBus.sc.alertError("Bir şeyler ters gitti", "Oturum kapatılamadı. Lütfen tekrar dene.", 2200);
    }
  };

  const businessName = businessInfo?.businessName ?? "İşletme";
  const ownerName = userInfo?.name ?? auth.currentUser?.displayName ?? "İşletme Sahibi";
  const email = userInfo?.email ?? auth.currentUser?.email ?? "";
  const category = businessInfo?.category ?? "";
  const phone = businessInfo?.phone ?? "";
  const rawPhoto = userInfo?.photoURL ?? auth.currentUser?.photoURL;
  const hasAvatar = typeof rawPhoto === "string" && rawPhoto.trim().length > 0;
  const avatarUri = hasAvatar ? rawPhoto.trim() : null;
  const avatarInitials = general.getInitials(ownerName?.trim() || businessName) || "IS";

  const accountSubtitle = useMemo(() => {
    if (phone) return phone;
    if (email) return email;
    return "İşletme detaylarını görüntüle";
  }, [email, phone]);

  const handleAccountPress = () => {
    router.push("/auth/business-info-form");
  };

  const handleLanguagePress = () => {
    CommandBus.sc.alertInfo("Yakında", "Dil seçimi çok yakında eklenecek.", 2200);
  };

  const handlePremiumPress = () => {
    CommandBus.sc.alertInfo("Yakında", "Premium üyelik seçenekleri çok yakında burada olacak.", 2200);
  };

  return (
    <LayoutView isActiveHeader={true} title="Profil" backgroundColor={Colors.BrandBackground} paddingHorizontal={0}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          { paddingTop: 28, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroAvatarWrap}>
            {hasAvatar ? (
              <Image source={{ uri: avatarUri }} style={styles.heroAvatar} resizeMode="cover" />
            ) : (
              <View style={[styles.heroAvatar, styles.heroAvatarInitials]}>
                <CustomText bold fontSize={36} color={Colors.BrandPrimary}>
                  {avatarInitials}
                </CustomText>
              </View>
            )}
          </View>
          <CustomText bold fontSize={24} color={Colors.BrandPrimary} style={styles.businessName}>
            {businessName}
          </CustomText>
          <CustomText xs bold color="#8C721E" style={styles.ownerBadge}>
            {(category || "İşletme Profili").toUpperCase()}
          </CustomText>
          <CustomText sm color={Colors.LightGray2} style={styles.ownerName}>
            {ownerName}
          </CustomText>
          {!!email && (
            <CustomText sm color="#6B6B6B" style={styles.ownerMeta}>
              {email}
            </CustomText>
          )}
        </View>

        <View style={styles.section}>
          <CustomText xs bold color="#6B6B6B" style={styles.sectionTitle}>
            HESAP AYARLARI
          </CustomText>
          <View style={styles.card}>
            <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={handleAccountPress}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="person-outline" size={20} color={Colors.BrandPrimary} />
                </View>
                <View style={styles.menuContent}>
                  <CustomText sm semibold color={Colors.BrandPrimary}>
                    Hesap Bilgileri
                  </CustomText>
                  <CustomText xs color="#6B6B6B" style={styles.menuSubtitle}>
                    {accountSubtitle}
                  </CustomText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#B4B4B4" />
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.menuRow}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="notifications-outline" size={20} color={Colors.BrandPrimary} />
                </View>
                <CustomText sm semibold color={Colors.BrandPrimary}>
                  Bildirimler
                </CustomText>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#DADADA", true: "rgba(212,175,55,0.45)" }}
                thumbColor={notificationsEnabled ? Colors.Gold : Colors.White}
                ios_backgroundColor="#DADADA"
              />
            </View>

            <View style={styles.divider} />

            <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={handleLanguagePress}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="language-outline" size={20} color={Colors.BrandPrimary} />
                </View>
                <View style={styles.menuContent}>
                  <CustomText sm semibold color={Colors.BrandPrimary}>
                    Dil Seçimi
                  </CustomText>
                  <CustomText xs color="#6B6B6B" style={styles.menuSubtitle}>
                    Türkçe
                  </CustomText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#B4B4B4" />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <CustomText xs bold color="#6B6B6B" style={styles.sectionTitle}>
            SİSTEM
          </CustomText>
          <View style={styles.card}>
            <Pressable style={({ pressed }) => [styles.logoutRow, pressed && styles.logoutRowPressed]} onPress={handleLogout}>
              <View style={styles.menuRowLeft}>
                <View style={styles.logoutIconWrap}>
                  <Ionicons name="log-out-outline" size={20} color={Colors.ErrorColor} />
                </View>
                <CustomText sm bold color={Colors.ErrorColor}>
                  Çıkış Yap
                </CustomText>
              </View>
            </Pressable>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.membershipCard, pressed && styles.membershipCardPressed]} onPress={handlePremiumPress}>
          <View style={styles.membershipGlow} />
          <View style={styles.membershipContent}>
            <CustomText xs bold color={Colors.Gold} style={styles.membershipLabel}>
              ÜYELİK
            </CustomText>
            <CustomText bold fontSize={22} color={Colors.White} style={styles.membershipTitle}>
              BiRandevu Pro'ya Geç
            </CustomText>
            <CustomText sm color="rgba(255,255,255,0.72)" style={styles.membershipDescription}>
              Gelişmiş yönetim araçlarını ve işletmene özel premium özellikleri aç.
            </CustomText>
            <View style={styles.membershipButton}>
              <CustomText xs bold color={Colors.BrandPrimary} style={styles.membershipButtonText}>
                DETAYLARI GÖR
              </CustomText>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 20,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 8,
  },
  headerInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 16,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.08)",
  },
  headerTitle: {
    letterSpacing: -0.8,
    flexShrink: 1,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 34,
  },
  heroAvatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 4,
    backgroundColor: Colors.White,
    marginBottom: 16,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  heroAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },
  heroAvatarInitials: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
  },
  businessName: {
    marginBottom: 6,
    textAlign: "center",
  },
  ownerBadge: {
    marginBottom: 8,
    letterSpacing: 1.8,
  },
  ownerName: {
    textAlign: "center",
    marginBottom: 4,
  },
  ownerMeta: {
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
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
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 14,
  },
  menuRowPressed: {
    backgroundColor: "#F8F8F8",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "#F1F1F1",
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuSubtitle: {
    marginTop: 3,
  },
  logoutRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  logoutRowPressed: {
    backgroundColor: "rgba(255,59,48,0.04)",
  },
  logoutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,59,48,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  membershipCard: {
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: Colors.BrandPrimary,
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
  },
  membershipCardPressed: {
    opacity: 0.92,
  },
  membershipGlow: {
    position: "absolute",
    top: -34,
    right: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  membershipContent: {
    position: "relative",
  },
  membershipLabel: {
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  membershipTitle: {
    marginBottom: 6,
  },
  membershipDescription: {
    marginBottom: 18,
    maxWidth: "88%",
  },
  membershipButton: {
    alignSelf: "flex-start",
    backgroundColor: Colors.Gold,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  membershipButtonText: {
    letterSpacing: 1.2,
  },
  pressedState: {
    opacity: 0.82,
  },
});
