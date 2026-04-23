import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import CommandBus from "@/infrastructures/command-bus/command-bus";
import LayoutView from "@/components/high-level/layout-view";
import FormInput from "@/components/high-level/custom-input";
import FormBottomBar from "@/components/high-level/form-bottom-bar";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import Validator from "@/infrastructures/validation";
import useReRender from "@/hooks/use-re-render";

/**
 * Firestore yapısı:
 *   users/{uid}/services/{serviceId}
 *     - name:            string
 *     - description:     string
 *     - price:           number   (TL, tam sayı — ₺350 → 350)
 *     - durationMinutes: number   (dakika — 45)
 *     - isActive:        boolean  (müşteriye gösterilsin mi)
 *     - createdAt:       Timestamp
 *     - updatedAt:       Timestamp
 *
 * Randevu oluştururken:
 *   appointments/{id}  →  businessId, serviceId, serviceName*, servicePrice*, durationMinutes*
 *   (* booking anındaki snapshot — hizmet sonradan değişse bile randevu doğru kalır)
 */

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120];

function parsePriceValue(value) {
  return (value || "").replace(/\D/g, "");
}

function formatPriceValue(value) {
  if (!value) return "";
  const numeric = Number(value);
  if (!numeric) return "";
  return `₺${numeric.toLocaleString("tr-TR")}`;
}

function parseDurationValue(value) {
  const normalized = Array.isArray(value) ? value[0] : value;
  const numeric = Number(String(normalized || "").replace(/\D/g, ""));
  return numeric || 45;
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderIcon}>
        <Ionicons name={icon} size={16} color={Colors.Gold} />
      </View>
      <View style={styles.sectionHeaderText}>
        <CustomText extraBold fontSize={15} color={Colors.BrandPrimary}>
          {title}
        </CustomText>
        {subtitle ? (
          <CustomText medium fontSize={11} color={Colors.LightGray2}>
            {subtitle}
          </CustomText>
        ) : null}
      </View>
    </View>
  );
}

function DurationOption({ value, active, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.durationChip, active && styles.durationChipActive, pressed && styles.pressed]} onPress={onPress}>
      <CustomText bold fontSize={11} color={active ? Colors.White : Colors.BrandPrimary} letterSpacing={0.5}>
        {value} DK
      </CustomText>
    </Pressable>
  );
}

export default function ServiceForm() {
  const params = useLocalSearchParams();
  const isEditMode = params.mode === "edit";
  const serviceId = Array.isArray(params.id) ? params.id[0] : (params.id ?? null);
  const initialName = Array.isArray(params.name) ? params.name[0] : (params.name ?? "");
  const initialDescription = Array.isArray(params.description) ? params.description[0] : (params.description ?? "");
  const initialPrice = Array.isArray(params.price) ? params.price[0] : (params.price ?? "");
  const initialDuration = Array.isArray(params.duration) ? params.duration[0] : (params.duration ?? "");

  const [validator] = useState(() => new Validator());
  const reRender = useReRender();

  const [serviceName, setServiceName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [price, setPrice] = useState(formatPriceValue(parsePriceValue(initialPrice)));
  const [duration, setDuration] = useState(parseDurationValue(initialDuration));
  const [isSaving, setIsSaving] = useState(false);

  const updatePrice = (value) => {
    setPrice(formatPriceValue(parsePriceValue(value)));
  };

  const adjustDuration = (step) => {
    setDuration((prev) => Math.max(5, prev + step));
  };

  const handleSave = async () => {
    reRender();
    if (!validator.allValid()) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      CommandBus.sc.alertError("Hata", "Kullanıcı bulunamadı.", 2600);
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: serviceName.trim(),
        description: description.trim(),
        price: Number(parsePriceValue(price)),
        durationMinutes: duration,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode && serviceId) {
        await updateDoc(doc(db, "businesses", uid, "services", serviceId), data);
        CommandBus.sc.alertSuccess("Güncellendi", `"${serviceName.trim()}" kaydedildi.`, 2400);
        router.back();
      } else {
        await addDoc(collection(db, "businesses", uid, "services"), {
          ...data,
          isActive: true,
          createdAt: serverTimestamp(),
        });
        CommandBus.sc.alertSuccess("Hizmet eklendi", `"${serviceName.trim()}" listeye eklendi.`, 2400);
        router.back();
      }
    } catch (e) {
      console.error("ServiceForm save error:", e);
      CommandBus.sc.alertError("Hata", e?.message ?? "Hizmet kaydedilirken bir sorun oluştu.", 3200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LayoutView showBackButton title={isEditMode ? "Hizmeti Düzenle" : "Hizmet Oluştur"} paddingHorizontal={24} backgroundColor={Colors.BrandBackground}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="cut-outline" size={22} color={Colors.Gold} />
            </View>
            <View style={styles.heroTextWrap}>
              <CustomText extraBold fontSize={20} color={Colors.BrandPrimary}>
                {isEditMode ? "Hizmeti Düzenle" : "Yeni Hizmet"}
              </CustomText>
              <CustomText medium fontSize={13} color={Colors.LightGray2} style={styles.heroDescription}>
                {isEditMode
                  ? "Hizmet adı, açıklama, fiyat ve süre alanlarını güncelleyerek hizmet bilgisini düzenle."
                  : "Hizmet adı, açıklama, fiyat ve süre bilgisini ekleyerek yeni bir hizmet taslağı oluştur."}
              </CustomText>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="document-text-outline" title="Hizmet Detayları" subtitle="Temel bilgileri eksiksiz doldur." />

            <FormInput
              label="Hizmet Adı"
              value={serviceName}
              onChangeText={setServiceName}
              required
              error={validator.registerDestructuring({ name: "serviceName", value: serviceName, rules: [{ rule: "required", value: 1 }], validatorScopeKey: validator.scopeKey })}
            />

            <FormInput
              label="Açıklama"
              value={description}
              onChangeText={setDescription}
              multiline
              inputStyle={styles.multilineInput}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader icon="wallet-outline" title="Fiyatlandırma" subtitle="Fiyat otomatik olarak ₺ formatında düzenlenir." />

            <View style={styles.featureCard}>
              <View style={styles.featureCardTop}>
                <View>
                  <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
                    HİZMET FİYATI
                  </CustomText>
                  <CustomText extraBold fontSize={18} color={Colors.BrandPrimary} style={styles.featureValue}>
                    {price || "₺0"}
                  </CustomText>
                </View>
                <View style={styles.featureBadge}>
                  <Ionicons name="logo-usd" size={14} color={Colors.Gold} />
                  <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={0.8}>
                    TL
                  </CustomText>
                </View>
              </View>

              <FormInput
                label="Fiyat"
                value={price}
                onChangeText={updatePrice}
                required
                keyboardType="numeric"
                error={validator.registerDestructuring({ name: "price", value: parsePriceValue(price), rules: [{ rule: "required", value: 1 }], validatorScopeKey: validator.scopeKey })}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="time-outline" title="Süre Seçimi" subtitle="Hazır dakikalar seç veya adımlarla ince ayar yap." />

            <View style={styles.featureCard}>
              <View style={styles.durationTopRow}>
                <View>
                  <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
                    SEANS SÜRESİ
                  </CustomText>
                  <CustomText extraBold fontSize={22} color={Colors.BrandPrimary} style={styles.featureValue}>
                    {duration} Dakika
                  </CustomText>
                </View>
                <View style={styles.durationPill}>
                  <Ionicons name="flash-outline" size={14} color={Colors.Gold} />
                  <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={0.8}>
                    HIZLI SEÇİM
                  </CustomText>
                </View>
              </View>

              <View style={styles.durationGrid}>
                {DURATION_OPTIONS.map((option) => (
                  <DurationOption key={option} value={option} active={duration === option} onPress={() => setDuration(option)} />
                ))}
              </View>

              <View style={styles.stepperRow}>
                <Pressable style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]} onPress={() => adjustDuration(-5)}>
                  <Ionicons name="remove" size={18} color={Colors.BrandPrimary} />
                </Pressable>

                <View style={styles.stepperValue}>
                  <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
                    ÖZEL SÜRE
                  </CustomText>
                  <CustomText extraBold fontSize={18} color={Colors.BrandPrimary}>
                    {duration} DK
                  </CustomText>
                </View>

                <Pressable style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]} onPress={() => adjustDuration(5)}>
                  <Ionicons name="add" size={18} color={Colors.BrandPrimary} />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        <FormBottomBar
          label={isEditMode ? "Hizmeti Güncelle" : "Hizmeti Oluştur"}
          onPress={handleSave}
          loading={isSaving}
          icon={isEditMode ? "create-outline" : "add-circle-outline"}
        />
      </View>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 120,
    gap: 28,
  },
  heroCard: {
    backgroundColor: Colors.White,
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    gap: 14,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  heroTextWrap: {
    flex: 1,
    gap: 6,
  },
  heroDescription: {
    lineHeight: 20,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  sectionHeaderText: {
    flex: 1,
  },
  multilineInput: {
    paddingTop: 8,
  },
  featureCard: {
    backgroundColor: Colors.White,
    borderRadius: 22,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.12)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  featureCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  featureValue: {
    letterSpacing: -0.5,
    marginTop: 4,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  durationTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F8F4E8",
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  durationChip: {
    minWidth: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F8",
    borderWidth: 1,
    borderColor: "transparent",
  },
  durationChipActive: {
    backgroundColor: Colors.BrandPrimary,
    borderColor: Colors.BrandPrimary,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stepperButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F8",
    borderWidth: 1,
    borderColor: "rgba(196,199,199,0.18)",
  },
  stepperValue: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BrandBackground,
    borderRadius: 18,
    paddingVertical: 14,
    gap: 4,
  },
});
