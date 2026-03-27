import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";

export default function AdminProfil() {
  const insets = useSafeAreaInsets();
  const [userInfo, setUserInfo] = useState(null);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) setUserInfo(snap.data());
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

  const businessName = userInfo?.businessName ?? "İşletme";
  const ownerName = userInfo?.name ?? auth.currentUser?.displayName ?? "İşletme Sahibi";
  const email = userInfo?.email ?? auth.currentUser?.email ?? "";
  const category = userInfo?.category ?? "";
  const phone = userInfo?.phone ?? "";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <CustomText bold fontSize={20} color={Colors.BrandPrimary}>
          Profil
        </CustomText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Business Card */}
        <View style={styles.businessCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="storefront" size={32} color={Colors.Gold} />
          </View>
          <CustomText bold fontSize={20} color={Colors.BrandPrimary} style={styles.businessName}>
            {businessName}
          </CustomText>
          {category ? (
            <View style={styles.categoryBadge}>
              <CustomText xs color={Colors.Gold} semibold style={styles.categoryText}>
                {category}
              </CustomText>
            </View>
          ) : null}
          <CustomText sm color={Colors.LightGray2} style={styles.ownerName}>
            {ownerName}
          </CustomText>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <CustomText xs bold color="#735C00" style={styles.sectionTitle}>
            İŞLETME BİLGİLERİ
          </CustomText>
          <View style={styles.card}>
            {[
              { icon: "mail-outline", label: "E-posta", value: email },
              { icon: "call-outline", label: "Telefon", value: phone || "—" },
              { icon: "bookmark-outline", label: "Kategori", value: category || "—" },
            ].map((row, index, arr) => (
              <View
                key={row.label}
                style={[styles.infoRow, index < arr.length - 1 && styles.infoRowBorder]}
              >
                <View style={styles.infoIconWrap}>
                  <Ionicons name={row.icon} size={18} color={Colors.BrandPrimary} />
                </View>
                <View style={styles.infoTexts}>
                  <CustomText xs color={Colors.LightGray} semibold style={styles.infoLabel}>
                    {row.label}
                  </CustomText>
                  <CustomText sm color={Colors.BrandPrimary}>
                    {row.value}
                  </CustomText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.ErrorColor} />
          <CustomText bold sm color={Colors.ErrorColor} style={styles.logoutText}>
            Çıkış Yap
          </CustomText>
        </Pressable>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.BrandBackground,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  businessCard: {
    backgroundColor: Colors.White,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.04)",
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(212,175,55,0.1)",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  businessName: {
    marginBottom: 8,
    textAlign: "center",
  },
  categoryBadge: {
    backgroundColor: "rgba(212,175,55,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  categoryText: {
    letterSpacing: 0.5,
  },
  ownerName: {
    textAlign: "center",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 4,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(196,199,199,0.25)",
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoTexts: {
    gap: 2,
  },
  infoLabel: {
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.18)",
    backgroundColor: "rgba(255,59,48,0.05)",
    minHeight: 56,
    borderRadius: 18,
    marginBottom: 82,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutText: {
    letterSpacing: -0.2,
  },
});
