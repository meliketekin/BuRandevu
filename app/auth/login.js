import { useCallback, useState } from "react";
import { View, Pressable, StyleSheet, Keyboard, TouchableWithoutFeedback, TextInput, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import Validator from "@/infrastructures/validation";


export default function Login() {
  const [state, setState] = useState({ email: "", password: "", showPassword: false, submitted: false, loading: false, authError: "" });
  const [validator] = useState(() => new Validator());
  const validatorScopeKey = validator.scopeKey;
  const updateState = useCallback((values) => setState((curr) => ({ ...curr, ...values })), []);
  const setAuth = useAuthStore((s) => s.setAuth);
  const insets = useSafeAreaInsets();

  const emailError = validator.registerDestructuring({
    name: "email",
    value: state.email,
    rules: [
      { rule: "required", value: 1 },
      { rule: "isEmail", value: 1 },
    ],
    validatorScopeKey,
  });

  const passwordError = validator.registerDestructuring({
    name: "password",
    value: state.password,
    rules: [
      { rule: "required", value: 1 },
      { rule: "minStringLength", value: 6 },
    ],
    validatorScopeKey,
  });

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validator.allValid()) {
      updateState({ submitted: true });
      return;
    }
    updateState({ loading: true, authError: "" });
    try {
      const { user } = await signInWithEmailAndPassword(auth, state.email, state.password);
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      const userType = data.userType;
      const isAdmin = data.isAdmin;
      const isBusinessInfoCompleted = data.isBusinessInfoCompleted;
      setAuth(user, userType, isAdmin, isBusinessInfoCompleted);
      if (isAdmin && !isBusinessInfoCompleted) {
        router.replace("/auth/business-info-form");
      } else {
        router.replace(userType === "business" ? "/business" : "/customer");
      }
    } catch (error) {
      const code = error?.code;
      let message = "Giriş yapılamadı. Lütfen tekrar deneyin.";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        message = "E-posta veya şifre hatalı.";
      } else if (code === "auth/too-many-requests") {
        message = "Çok fazla deneme. Lütfen daha sonra tekrar deneyin.";
      } else if (code === "auth/network-request-failed") {
        message = "Bağlantı hatası. İnternet bağlantınızı kontrol edin.";
      }
      updateState({ authError: message });
    } finally {
      updateState({ loading: false });
    }
  };

  return (
    <LayoutView isActiveHeader={false} backgroundColor={Colors.BrandBackground}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.BrandPrimary} />
        </Pressable>
        <CustomText semibold fontSize={18} color={Colors.BrandPrimary}>
          Giriş Yap
        </CustomText>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            {/* Title */}
            <View style={styles.titleSection}>
              <CustomText bold fontSize={28} color={Colors.BrandPrimary} center>
                Hoş Geldiniz
              </CustomText>
              <CustomText md color={Colors.LightGray2} center style={styles.subtitle}>
                Hesabınıza giriş yapmak için bilgilerinizi girin.
              </CustomText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email field */}
              <View style={styles.fieldGroup}>
                <CustomText style={styles.fieldLabel} color={Colors.LightGray}>
                  E-POSTA VEYA TELEFON
                </CustomText>
                <View style={[styles.inputWrapper, state.submitted && emailError && styles.inputError]}>
                  <Ionicons name="mail-outline" size={20} color={Colors.LightGray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="isim@ornek.com"
                    placeholderTextColor={Colors.LightGray}
                    value={state.email}
                    onChangeText={(text) => updateState({ email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardAppearance="light"
                  />
                </View>
                {state.submitted && emailError ? (
                  <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
                    {emailError}
                  </CustomText>
                ) : null}
              </View>

              {/* Password field */}
              <View style={styles.fieldGroup}>
                <CustomText style={styles.fieldLabel} color={Colors.LightGray}>
                  ŞİFRE
                </CustomText>
                <View style={[styles.inputWrapper, state.submitted && passwordError && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.LightGray} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { paddingRight: 44 }]}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.LightGray}
                    value={state.password}
                    onChangeText={(text) => updateState({ password: text })}
                    secureTextEntry={!state.showPassword}
                    autoCorrect={false}
                    keyboardAppearance="light"
                  />
                  <Pressable
                    onPress={() => updateState({ showPassword: !state.showPassword })}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={state.showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={Colors.LightGray}
                    />
                  </Pressable>
                </View>
                {state.submitted && passwordError ? (
                  <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
                    {passwordError}
                  </CustomText>
                ) : null}
              </View>

              {/* Forgot password */}
              <Pressable style={styles.forgotRow} onPress={() => {}} hitSlop={8}>
                <CustomText sm color={Colors.Gold} semibold>
                  Şifremi Unuttum?
                </CustomText>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {state.authError ? (
          <CustomText fontSize={13} color={Colors.ErrorColor} center style={styles.authError}>
            {state.authError}
          </CustomText>
        ) : null}
        <Pressable style={[styles.signInButton, state.loading && styles.buttonDisabled]} onPress={handleLogin} disabled={state.loading}>
          {state.loading ? (
            <ActivityIndicator color={Colors.White} />
          ) : (
            <CustomText bold fontSize={17} color={Colors.White}>
              Giriş Yap
            </CustomText>
          )}
        </Pressable>
        <View style={styles.footerLink}>
          <CustomText md color={Colors.LightGray2}>
            Hesabınız yok mu?{" "}
          </CustomText>
          <Pressable onPress={() => router.replace("/auth/register")} hitSlop={8}>
            <CustomText md bold color={Colors.BrandPrimary}>
              Kayıt Ol
            </CustomText>
          </Pressable>
        </View>
      </View>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: Colors.BrandBackground,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  titleSection: {
    marginBottom: 32,
    gap: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.White,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    paddingHorizontal: 12,
    height: 56,
  },
  inputError: {
    borderColor: Colors.ErrorColor,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.BrandPrimary,
    height: "100%",
  },
  eyeButton: {
    padding: 4,
  },
  forgotRow: {
    alignSelf: "flex-end",
  },
  errorText: {
    marginLeft: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.BrandBackground,
  },
  authError: {
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.Gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    flexWrap: "wrap",
  },
});
