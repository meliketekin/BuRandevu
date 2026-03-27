import { useEffect, useState } from "react";
import { View, Pressable, StyleSheet, ImageBackground, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Shadow } from "react-native-shadow-2";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const BG_IMAGE = {
  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzCOY3m8-vEuUBhaK82MUkuih6BfbKPaifT-hElEoPmmqrszRU-KrmVbbFESMejyjGIz605Vc6dwDd7uAgfw-upw-BmkiuGT3robgse6WnCqI0j9NbQAq3Kw3v9tI95kS_8uQP7N3d69gDF8q6ipHSy_ayQTHa21KjUn2j9D-9lhibovpDSxj2a7JXA9bPA0yzRy97I1HmiScwG0l-fEmBc82akKk6t6HGkMklLt1trmpTjnvoq44AB_CSf7OK0saL_mA0AyatHUE",
};

export default function Onboarding() {
  const [checking, setChecking] = useState(true);
  const setAuth = useAuthStore((s) => s.setAuth);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          const data = snap.exists() ? snap.data() : {};
          const userType = data.userType ?? "customer";
          const isAdmin = data.isAdmin ?? false;
          const isBusinessInfoCompleted = data.isBusinessInfoCompleted ?? false;
          setAuth(firebaseUser, userType, isAdmin, isBusinessInfoCompleted);
          if (isAdmin && !isBusinessInfoCompleted) {
            router.replace("/auth/business-info-form");
          } else {
            router.replace(userType === "business" ? "/admin" : "/customer");
          }
        } catch {
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [setAuth]);

  if (checking) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={Colors.Gold} size="large" />
      </View>
    );
  }

  return (
    <ImageBackground source={BG_IMAGE} style={styles.root} resizeMode="cover">

      {/* Aşağıdan texte kadar smooth gradient */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.88)", "rgba(0,0,0,0.97)"]}
        locations={[0, 0.38, 0.65, 1]}
        style={styles.bottomGradient}
      />

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 48, paddingTop: insets.top }]}>
        {/* Branding */}
        <View style={styles.branding}>
          <CustomText bold style={styles.title}>
            BuRandevu
          </CustomText>
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleLine} />
            <CustomText light style={styles.subtitle}>
              Lüks Bakımın Yeni Adresi
            </CustomText>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Primary: Hesap Oluştur */}
          <Shadow
            distance={22}
            startColor="#CCA83055"
            endColor="#CCA83000"
            offset={[0, 8]}
            style={styles.shadowContainer}
          >
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => router.push("/auth/register")}
            >
              <CustomText bold style={styles.primaryButtonText}>
                Hesap Oluştur
              </CustomText>
              <Ionicons name="arrow-forward" size={20} color={Colors.BrandPrimary} />
            </Pressable>
          </Shadow>

          {/* Secondary: Giriş Yap */}
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={() => router.push("/auth/login")}
          >
            <CustomText bold style={styles.secondaryButtonText}>
              Giriş Yap
            </CustomText>
          </Pressable>

          {/* Tertiary: Misafir */}
          <View style={styles.guestRow}>
            <Pressable
              style={({ pressed }) => [styles.guestButton, pressed && { opacity: 1 }]}
              onPress={() => router.replace("/customer")}
            >
              <CustomText style={styles.guestText}>
                Misafir Olarak Devam Et
              </CustomText>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>
        </View>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  root: {
    flex: 1,
    backgroundColor: Colors.BrandPrimary,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    zIndex: 1,
  },
  content: {
    flex: 1,
    zIndex: 2,
    justifyContent: "flex-end",
    paddingHorizontal: 32,
  },
  branding: {
    marginBottom: 48,
    gap: 16,
  },
  title: {
    fontSize: 64,
    lineHeight: 68,
    color: Colors.White,
    letterSpacing: -2,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subtitleLine: {
    width: 40,
    height: 1,
    flexShrink: 0,
    backgroundColor: "rgba(233,195,73,0.6)",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(243,243,243,0.85)",
    letterSpacing: 1.5,
    flexShrink: 1,
  },
  actions: {
    gap: 14,
    marginBottom: 28,
  },
  shadowContainer: {
    width: "100%",
    borderRadius: 999,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.Gold,
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 20,
    width: "100%",
  },
  primaryButtonText: {
    fontSize: 16,
    color: Colors.BrandPrimary,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: Colors.White,
    letterSpacing: 0.3,
  },
  guestRow: {
    paddingTop: 12,
    alignItems: "center",
  },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    opacity: 0.55,
  },
  guestText: {
    fontSize: 12,
    color: Colors.White,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
