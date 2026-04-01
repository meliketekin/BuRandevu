import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import LayoutView from "@/components/high-level/layout-view";
import CustomButton from "@/components/high-level/custom-button";
import FormInput from "@/components/high-level/custom-input";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

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
          <CustomText interMedium fontSize={11} color={Colors.LightGray2}>
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
      <CustomText interBold fontSize={11} color={active ? Colors.White : Colors.BrandPrimary} letterSpacing={0.5}>
        {value} DK
      </CustomText>
    </Pressable>
  );
}

export default function CreateService() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const isEditMode = params.mode === "edit";
  const initialName = Array.isArray(params.name) ? params.name[0] : params.name ?? "";
  const initialDescription = Array.isArray(params.description) ? params.description[0] : params.description ?? "";
  const initialPrice = Array.isArray(params.price) ? params.price[0] : params.price ?? "";
  const initialDuration = Array.isArray(params.duration) ? params.duration[0] : params.duration ?? "";

  const [serviceName, setServiceName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [price, setPrice] = useState(formatPriceValue(parsePriceValue(initialPrice)));
  const [duration, setDuration] = useState(parseDurationValue(initialDuration));

  const updatePrice = (value) => {
    setPrice(formatPriceValue(parsePriceValue(value)));
  };

  const adjustDuration = (step) => {
    setDuration((prev) => Math.max(5, prev + step));
  };

  const handleCreateService = () => {
    Alert.alert(
      isEditMode ? "Hizmet Guncellendi" : "Hizmet Hazirlandi",
      serviceName
        ? `${serviceName} hizmeti icin form hazir.`
        : isEditMode
          ? "Hizmet duzenleme formu hazirlandi."
          : "Yeni hizmet formu hazirlandi."
    );
  };

  return (
    <LayoutView
      showBackButton
      title={isEditMode ? "Hizmet Duzenle" : "Hizmet Olustur"}
      paddingHorizontal={24}
      backgroundColor={Colors.BrandBackground}
    >
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="cut-outline" size={22} color={Colors.Gold} />
            </View>
            <View style={styles.heroTextWrap}>
              <CustomText extraBold fontSize={20} color={Colors.BrandPrimary}>
                {isEditMode ? "Hizmeti Duzenle" : "Yeni Hizmet"}
              </CustomText>
              <CustomText interMedium fontSize={13} color={Colors.LightGray2} style={styles.heroDescription}>
                {isEditMode
                  ? "Hizmet adi, aciklama, fiyat ve sure alanlarini guncelleyerek hizmet bilgisini duzenle."
                  : "Hizmet adi, aciklama, fiyat ve sure bilgisini ekleyerek yeni bir hizmet taslagi olustur."}
              </CustomText>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="document-text-outline" title="Hizmet Detaylari" subtitle="Temel bilgileri daha net bir form yapisinda duzenle." />

            <FormInput
              label="Hizmet Adi"
              value={serviceName}
              onChangeText={setServiceName}
              height={64}
              style={styles.input}
              backgroundColor={Colors.White}
              borderColor="rgba(196,199,199,0.16)"
            />

            <FormInput
              label="Aciklama"
              value={description}
              onChangeText={setDescription}
              multiline
              style={styles.input}
              backgroundColor={Colors.White}
              borderColor="rgba(196,199,199,0.16)"
              inputStyle={styles.multilineInput}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader icon="wallet-outline" title="Fiyatlandirma" subtitle="Fiyat otomatik olarak TL formatinda duzenlenir." />

            <View style={styles.featureCard}>
              <View style={styles.featureCardTop}>
                <View>
                  <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
                    HIZMET FIYATI
                  </CustomText>
                  <CustomText extraBold fontSize={18} color={Colors.BrandPrimary} style={styles.featureValue}>
                    {price || "₺0"}
                  </CustomText>
                </View>
                <View style={styles.featureBadge}>
                  <Ionicons name="logo-usd" size={14} color={Colors.Gold} />
                  <CustomText interBold fontSize={10} color={Colors.Gold} letterSpacing={0.8}>
                    TL
                  </CustomText>
                </View>
              </View>

              <FormInput
                label="Fiyat"
                value={price}
                onChangeText={updatePrice}
                keyboardType="numeric"
                height={64}
                style={styles.input}
                backgroundColor="#FCFCFD"
                borderColor="rgba(196,199,199,0.16)"
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon="time-outline" title="Sure Secimi" subtitle="Hazir dakikalar sec veya adimlarla ince ayar yap." />

            <View style={styles.featureCard}>
              <View style={styles.durationTopRow}>
                <View>
                  <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
                    SEANS SURESI
                  </CustomText>
                  <CustomText extraBold fontSize={22} color={Colors.BrandPrimary} style={styles.featureValue}>
                    {duration} Dakika
                  </CustomText>
                </View>
                <View style={styles.durationPill}>
                  <Ionicons name="flash-outline" size={14} color={Colors.Gold} />
                  <CustomText interBold fontSize={10} color={Colors.Gold} letterSpacing={0.8}>
                    HIZLI SECIM
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
                  <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
                    OZEL SURE
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

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 18 }]}>
          <CustomButton
            title={isEditMode ? "Hizmeti Guncelle" : "Hizmeti Olustur"}
            onPress={handleCreateService}
            marginTop={0}
            height={64}
            borderRadius={16}
            backgroundColor={Colors.BrandPrimary}
            titleStyle={styles.saveTitle}
            rightIcon={
              <Ionicons
                name={isEditMode ? "create-outline" : "add-circle-outline"}
                size={20}
                color={Colors.White}
                style={styles.saveIcon}
              />
            }
          />
        </View>
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
  input: {
    borderRadius: 18,
    minHeight: 64,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
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
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    backgroundColor: "rgba(247,247,247,0.96)",
  },
  saveTitle: {
    fontFamily: "Urbanist_800ExtraBold",
    fontSize: 17,
  },
  saveIcon: {
    marginLeft: 8,
  },
});
