import { useCallback, useState } from "react";
import { View, Pressable, StyleSheet, Keyboard, TouchableWithoutFeedback, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import Validator from "@/infrastructures/validation";
import { BUSINESS_CATEGORIES } from "@/enums/business-category-enum";

export default function BusinessInfoForm() {
  const [state, setState] = useState({
    category: "",
    address: "",
    description: "",
    submitted: false,
    loading: false,
    error: "",
  });
  const [validator] = useState(() => new Validator());
  const validatorScopeKey = validator.scopeKey;
  const updateState = useCallback((values) => setState((curr) => ({ ...curr, ...values })), []);
  const user = useAuthStore((s) => s.user);
  const setBusinessInfoCompleted = useAuthStore((s) => s.setBusinessInfoCompleted);
  const insets = useSafeAreaInsets();

  const categoryError = validator.registerDestructuring({
    name: "category",
    value: state.category,
    rules: [{ rule: "required", value: 1 }],
    validatorScopeKey,
  });

  const addressError = validator.registerDestructuring({
    name: "address",
    value: state.address,
    rules: [{ rule: "required", value: 1 }],
    validatorScopeKey,
  });

  const descriptionError = validator.registerDestructuring({
    name: "description",
    value: state.description,
    rules: [{ rule: "required", value: 1 }],
    validatorScopeKey,
  });

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validator.allValid()) {
      updateState({ submitted: true });
      return;
    }
    updateState({ loading: true, error: "" });
    try {
      await updateDoc(doc(db, "users", user.uid), {
        category: state.category,
        address: state.address,
        description: state.description,
        isBusinessInfoCompleted: true,
      });
      setBusinessInfoCompleted();
      router.replace("/business");
    } catch (err) {
      updateState({ error: "Bilgiler kaydedilemedi. Lütfen tekrar deneyin." });
    } finally {
      updateState({ loading: false });
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerButton} />
        <CustomText semibold fontSize={18} color={Colors.BrandPrimary}>
          İşletme Bilgileri
        </CustomText>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            {/* Title */}
            <View style={styles.titleSection}>
              <CustomText bold fontSize={26} color={Colors.BrandPrimary}>
                İşletmenizi Tanıtalım
              </CustomText>
              <CustomText md color={Colors.LightGray2} style={styles.subtitle}>
                Müşterilerinizin sizi bulabilmesi için birkaç bilgi daha gerekiyor.
              </CustomText>
            </View>

            <View style={styles.form}>
              {/* Category */}
              <View style={styles.fieldGroup}>
                <CustomText style={styles.fieldLabel} color={Colors.LightGray2} semibold>
                  İşletme Kategorisi
                </CustomText>
                <View style={[styles.categoriesGrid, state.submitted && categoryError && styles.categoriesError]}>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.categoryChip, state.category === cat && styles.categoryChipActive]}
                      onPress={() => updateState({ category: cat })}
                    >
                      <CustomText
                        sm
                        semibold
                        color={state.category === cat ? Colors.White : Colors.LightGray2}
                      >
                        {cat}
                      </CustomText>
                    </Pressable>
                  ))}
                </View>
                {state.submitted && categoryError ? (
                  <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
                    Lütfen bir kategori seçin.
                  </CustomText>
                ) : null}
              </View>

              {/* Address */}
              <View style={styles.fieldGroup}>
                <CustomText style={styles.fieldLabel} color={Colors.LightGray2} semibold>
                  İşletme Adresi
                </CustomText>
                <View style={[styles.inputWrapper, state.submitted && addressError && styles.inputError]}>
                  <Ionicons name="location-outline" size={20} color={Colors.LightGray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mahalle, Cadde, İlçe, Şehir"
                    placeholderTextColor={Colors.LightGray}
                    value={state.address}
                    onChangeText={(text) => updateState({ address: text })}
                    autoCorrect={false}
                    keyboardAppearance="light"
                  />
                </View>
                {state.submitted && addressError ? (
                  <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
                    {addressError}
                  </CustomText>
                ) : null}
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <CustomText style={styles.fieldLabel} color={Colors.LightGray2} semibold>
                  İşletme Açıklaması
                </CustomText>
                <View style={[styles.textAreaWrapper, state.submitted && descriptionError && styles.inputError]}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="İşletmeniz hakkında kısa bir açıklama yazın..."
                    placeholderTextColor={Colors.LightGray}
                    value={state.description}
                    onChangeText={(text) => updateState({ description: text })}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoCorrect={false}
                    keyboardAppearance="light"
                  />
                </View>
                {state.submitted && descriptionError ? (
                  <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
                    {descriptionError}
                  </CustomText>
                ) : null}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {state.error ? (
          <CustomText fontSize={13} color={Colors.ErrorColor} center style={styles.footerError}>
            {state.error}
          </CustomText>
        ) : null}
        <Pressable style={[styles.submitButton, state.loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={state.loading}>
          {state.loading ? (
            <ActivityIndicator color={Colors.White} />
          ) : (
            <CustomText bold fontSize={17} color={Colors.White}>
              Devam Et
            </CustomText>
          )}
        </Pressable>
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
  titleSection: {
    marginBottom: 28,
    gap: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  form: {
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    marginLeft: 4,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderRadius: 12,
    padding: 4,
  },
  categoriesError: {
    borderWidth: 1,
    borderColor: Colors.ErrorColor,
    borderRadius: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.InputSurface,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  categoryChipActive: {
    backgroundColor: Colors.BrandPrimary,
    borderColor: Colors.BrandPrimary,
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
  textAreaWrapper: {
    backgroundColor: Colors.InputSurface,
    borderRadius: 16,
    padding: 14,
    minHeight: 120,
  },
  textArea: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.BrandPrimary,
    minHeight: 96,
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
  footerError: {
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButton: {
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
});
