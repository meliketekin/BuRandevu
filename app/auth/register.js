import { useCallback, useState } from "react";
import { View, Pressable, StyleSheet, Keyboard, TouchableWithoutFeedback, TextInput } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import Validator from "@/infrastructures/validation";

import { RoleTypeEnum } from "@/enums/role-type-enum";

export default function Register() {
  const [state, setState] = useState({
    role: RoleTypeEnum.Customer,
    name: "",
    email: "",
    password: "",
    businessName: "",
    phone: "",
    showPassword: false,
    submitted: false,
  });
  const [validator] = useState(() => new Validator());
  const validatorScopeKey = validator.scopeKey;
  const updateState = useCallback((values) => setState((curr) => ({ ...curr, ...values })), []);
  const insets = useSafeAreaInsets();
  const isCustomer = state.role === RoleTypeEnum.Customer;

  const nameError = validator.registerDestructuring({
    name: "name",
    value: state.name,
    rules: [{ rule: "required", value: 1 }],
    validatorScopeKey,
  });

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

  const businessNameError = !isCustomer
    ? validator.registerDestructuring({
        name: "businessName",
        value: state.businessName,
        rules: [{ rule: "required", value: 1 }],
        validatorScopeKey,
      })
    : null;

  const phoneError = !isCustomer
    ? validator.registerDestructuring({
        name: "phone",
        value: state.phone,
        rules: [{ rule: "required", value: 1 }],
        validatorScopeKey,
      })
    : null;

  const handleRegister = () => {
    Keyboard.dismiss();
    if (!validator.allValid()) {
      updateState({ submitted: true });
      return;
    }
    // TODO: register API
    router.replace("/customer");
  };

  const handleRoleChange = (newRole) => {
    setState({ role: newRole, name: "", email: "", password: "", businessName: "", phone: "", showPassword: false, submitted: false });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.BrandPrimary} />
        </Pressable>
        <CustomText semibold fontSize={18} color={Colors.BrandPrimary}>
          Kayıt Ol
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
            {/* Role segmented control */}
            <View style={styles.segmentWrapper}>
              <Pressable
                style={[styles.segment, isCustomer && styles.segmentActive]}
                onPress={() => handleRoleChange(RoleTypeEnum.Customer)}
              >
                <Ionicons
                  name={isCustomer ? "person" : "person-outline"}
                  size={16}
                  color={isCustomer ? Colors.BrandPrimary : Colors.LightGray}
                />
                <CustomText sm semibold color={isCustomer ? Colors.BrandPrimary : Colors.LightGray}>
                  Müşteri
                </CustomText>
              </Pressable>
              <Pressable
                style={[styles.segment, !isCustomer && styles.segmentActive]}
                onPress={() => handleRoleChange(RoleTypeEnum.Business)}
              >
                <Ionicons
                  name={!isCustomer ? "storefront" : "storefront-outline"}
                  size={16}
                  color={!isCustomer ? Colors.BrandPrimary : Colors.LightGray}
                />
                <CustomText sm semibold color={!isCustomer ? Colors.BrandPrimary : Colors.LightGray}>
                  İşletme Sahibi
                </CustomText>
              </Pressable>
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
              <CustomText bold fontSize={28} color={Colors.BrandPrimary}>
                {isCustomer ? "Hesap Oluştur" : "İşletmenizi Ekleyin"}
              </CustomText>
              <CustomText md color={Colors.LightGray2} style={styles.subtitle}>
                {isCustomer
                  ? "Randevu almak için müşteri hesabı oluşturun."
                  : "Salonunuzu yönetmek için işletme hesabı açın."}
              </CustomText>
            </View>

            {/* Form */}
            <View style={styles.form}>

              {/* Business Name — only for business */}
              {!isCustomer && (
                <View style={styles.fieldGroup}>
                  <CustomText style={styles.fieldLabel} color={Colors.LightGray2} semibold>
                    İşletme Adı
                  </CustomText>
                  <View style={[styles.inputWrapper, state.submitted && businessNameError && styles.inputError]}>
                    <Ionicons name="storefront-outline" size={20} color={Colors.LightGray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Örn: Elite Berber"
                      placeholderTextColor={Colors.LightGray}
                      value={state.businessName}
                      onChangeText={(text) => updateState({ businessName: text })}
                      autoCorrect={false}
                      keyboardAppearance="light"
                    />
                  </View>
                  {state.submitted && businessNameError ? (
                    <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
                      {businessNameError}
                    </CustomText>
                  ) : null}
                </View>
              )}

              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <CustomText style={styles.fieldLabel} color={Colors.LightGray2} semibold>
                  Ad Soyad
                </CustomText>
                <View style={[styles.inputWrapper, state.submitted && nameError && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color={Colors.LightGray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ahmet Yılmaz"
                    placeholderTextColor={Colors.LightGray}
                    value={state.name}
                    onChangeText={(text) => updateState({ name: text })}
                    autoCorrect={false}
                    keyboardAppearance="light"
                  />
                </View>
                {state.submitted && nameError ? (
                  <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
                    {nameError}
                  </CustomText>
                ) : null}
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <CustomText style={styles.fieldLabel} color={Colors.LightGray2} semibold>
                  E-posta Adresi
                </CustomText>
                <View style={[styles.inputWrapper, state.submitted && emailError && styles.inputError]}>
                  <Ionicons name="mail-outline" size={20} color={Colors.LightGray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="ahmet@ornek.com"
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

              {/* Phone — only for business */}
              {!isCustomer && (
                <View style={styles.fieldGroup}>
                  <CustomText style={styles.fieldLabel} color={Colors.LightGray2} semibold>
                    Telefon Numarası
                  </CustomText>
                  <View style={[styles.inputWrapper, state.submitted && phoneError && styles.inputError]}>
                    <Ionicons name="call-outline" size={20} color={Colors.LightGray} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="05XX XXX XX XX"
                      placeholderTextColor={Colors.LightGray}
                      value={state.phone}
                      onChangeText={(text) => updateState({ phone: text })}
                      keyboardType="phone-pad"
                      keyboardAppearance="light"
                    />
                  </View>
                  {state.submitted && phoneError ? (
                    <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
                      {phoneError}
                    </CustomText>
                  ) : null}
                </View>
              )}

              {/* Password */}
              <View style={styles.fieldGroup}>
                <CustomText style={styles.fieldLabel} color={Colors.LightGray2} semibold>
                  Şifre
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
                  <Pressable onPress={() => updateState({ showPassword: !state.showPassword })} style={styles.eyeButton} hitSlop={8}>
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

              {/* Terms */}
              <View style={styles.termsRow}>
                <CustomText fontSize={12} color={Colors.LightGray2}>
                  Hesap oluşturarak{" "}
                  <CustomText
                    fontSize={12}
                    color={Colors.BrandPrimary}
                    semibold
                    style={styles.termsLink}
                    onPress={() => router.push("/(shared)/kullanim-kosullari")}
                  >
                    Kullanım Koşulları
                  </CustomText>
                  {" "}ve{" "}
                  <CustomText
                    fontSize={12}
                    color={Colors.BrandPrimary}
                    semibold
                    style={styles.termsLink}
                    onPress={() => {}}
                  >
                    Gizlilik Politikası
                  </CustomText>
                  {"'nı"} kabul etmiş olursunuz.
                </CustomText>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={styles.createButton} onPress={handleRegister}>
          <CustomText bold fontSize={17} color={Colors.White}>
            {isCustomer ? "Hesap Oluştur" : "İşletme Kaydı Oluştur"}
          </CustomText>
        </Pressable>
        <View style={styles.footerLink}>
          <CustomText md color={Colors.LightGray2}>
            Zaten hesabınız var mı?{" "}
          </CustomText>
          <Pressable onPress={() => router.push("/auth/login")} hitSlop={8}>
            <CustomText md bold color={Colors.BrandPrimary}>
              Giriş Yap
            </CustomText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.White,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.BorderColor,
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
    paddingTop: 24,
  },
  segmentWrapper: {
    flexDirection: "row",
    backgroundColor: Colors.SegmentBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentActive: {
    backgroundColor: Colors.White,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  titleSection: {
    marginBottom: 28,
    gap: 6,
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
    fontSize: 13,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.InputSurface,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 56,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.ErrorColor,
  },
  inputIcon: {
    marginRight: 10,
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
  termsRow: {
    paddingHorizontal: 4,
    marginTop: 4,
  },
  termsLink: {
    textDecorationLine: "underline",
    textDecorationColor: Colors.Gold,
  },
  errorText: {
    marginLeft: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.BorderColor,
  },
  createButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.Gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    flexWrap: "wrap",
  },
});
