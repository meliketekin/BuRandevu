import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LayoutView from "@/components/high-level/layout-view";
import CustomButton from "@/components/high-level/custom-button";
import CustomImage from "@/components/high-level/custom-image";
import FormInput from "@/components/high-level/custom-input";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const PLACEHOLDER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCM6OwUO70ANEgguwstdMheHY500mP8d5p35g90CXhzjdn8xCehUkNWKHzDvp7dbAQ7S8gZH-Y8KFp7h-9aFIAoE2NOOnk45T6z9XmUwtmG3-7R-qHL1cRdy0k4_T8bt-fx2-ui78khIzA7Ga_QTh-xpUmduLaEt9TTka8FAiLshwpJp6dhqtfpHiynn0LTKp_OMQPeQaDXDBlYpS_rI3dWD9_kcDdGK6_vspey2hBDxwxSnQtXI6VPdA06mGEf-0TSLT2RhSWuXuM";

const DEFAULT_HOURS = [
  { key: "pzt", day: "Pazartesi", enabled: true, start: "09:00", end: "18:00" },
  { key: "sal", day: "Sali", enabled: true, start: "09:00", end: "18:00" },
  { key: "car", day: "Carsamba", enabled: true, start: "09:00", end: "18:00" },
  { key: "per", day: "Persembe", enabled: true, start: "09:00", end: "18:00" },
  { key: "cum", day: "Cuma", enabled: true, start: "09:00", end: "18:00" },
  { key: "cmt", day: "Cumartesi", enabled: true, start: "10:00", end: "17:00" },
  { key: "paz", day: "Pazar", enabled: false, start: "09:00", end: "18:00" },
];

const DEFAULT_SERVICES = [
  { id: "1", title: "Klasik Fade", meta: "45 DK • ₺350", icon: "cut-outline" },
  { id: "2", title: "Sakal Trim", meta: "20 DK • ₺200", icon: "person-outline" },
];

function buildHours(employee) {
  if (!employee?.workingHours?.length) return DEFAULT_HOURS;

  return DEFAULT_HOURS.map((baseItem) => {
    const existing = employee.workingHours.find((item) => item.day === baseItem.day);
    if (!existing) return baseItem;

    if (existing.closed) {
      return {
        ...baseItem,
        enabled: false,
      };
    }

    const [start = baseItem.start, end = baseItem.end] = (existing.hours || "").split(" — ");
    return {
      ...baseItem,
      enabled: true,
      start,
      end,
    };
  });
}

function buildServices(employee) {
  if (!employee?.services?.length) return DEFAULT_SERVICES;

  return employee.services.map((item) => ({
    id: item.id,
    title: item.title,
    meta: `${item.duration.toUpperCase()} • ${item.price}`,
    icon: "cut-outline",
  }));
}

function HourRow({ item, isLast, onToggle }) {
  return (
    <View style={[styles.dayBlock, !isLast && styles.dayDivider]}>
      <View style={styles.dayHeader}>
        <CustomText bold fontSize={15} color={item.enabled ? Colors.BrandPrimary : Colors.LightGray2}>
          {item.day}
        </CustomText>
        <Switch
          value={item.enabled}
          onValueChange={onToggle}
          trackColor={{ false: "#E5E7EB", true: Colors.Gold }}
          thumbColor={Colors.White}
        />
      </View>

      {item.enabled ? (
        <View style={styles.hoursInputsRow}>
          <View style={styles.hourChip}>
            <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
              BASLANGIC
            </CustomText>
            <CustomText extraBold fontSize={14} color={Colors.BrandPrimary}>
              {item.start}
            </CustomText>
          </View>

          <CustomText interMedium fontSize={12} color={Colors.LightGray2}>
            ile
          </CustomText>

          <View style={styles.hourChip}>
            <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
              BITIS
            </CustomText>
            <CustomText extraBold fontSize={14} color={Colors.BrandPrimary}>
              {item.end}
            </CustomText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ServiceItem({ item, onRemove }) {
  return (
    <View style={styles.serviceItem}>
      <View style={styles.serviceLeft}>
        <View style={styles.serviceIconWrap}>
          <Ionicons name={item.icon} size={20} color={Colors.Gold} />
        </View>

        <View style={styles.serviceInfo}>
          <CustomText bold fontSize={14} color={Colors.BrandPrimary}>
            {item.title}
          </CustomText>
          <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
            {item.meta}
          </CustomText>
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]} onPress={onRemove}>
        <Ionicons name="remove-circle-outline" size={20} color="#D94B4B" />
      </Pressable>
    </View>
  );
}

export default function EmployeeFormScreen({
  title,
  saveButtonLabel,
  submitMessage,
  employee = null,
}) {
  const insets = useSafeAreaInsets();
  const initialHours = useMemo(() => buildHours(employee), [employee]);
  const initialServices = useMemo(() => buildServices(employee), [employee]);

  const [name, setName] = useState(employee?.name ?? "");
  const [hours, setHours] = useState(initialHours);
  const [services, setServices] = useState(initialServices);

  const imageUri = employee?.image ?? PLACEHOLDER_IMAGE;

  const toggleDay = (key) => {
    setHours((prev) => prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)));
  };

  const removeService = (id) => {
    setServices((prev) => prev.filter((item) => item.id !== id));
  };

  const addService = () => {
    Alert.alert("Yakinda", "Hizmet secme akisi daha sonra baglanacak.");
  };

  const saveEmployee = () => {
    Alert.alert(submitMessage.title, name ? `${name} icin form hazirlandi.` : submitMessage.description);
  };

  return (
    <LayoutView showBackButton title={title} paddingHorizontal={24} backgroundColor={Colors.BrandBackground}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.photoSection}>
            <View style={styles.photoWrap}>
              <View style={styles.photoFrame}>
                <CustomImage uri={imageUri} style={styles.photo} contentFit="cover" />
              </View>
              <Pressable style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]} onPress={() => Alert.alert("Yakinda", "Foto yukleme akisi daha sonra baglanacak.")}>
                <Ionicons name="camera-outline" size={16} color={Colors.White} />
              </Pressable>
            </View>

            <Pressable style={({ pressed }) => [styles.changePhotoBtn, pressed && styles.pressed]} onPress={() => Alert.alert("Yakinda", "Foto degistirme akisi daha sonra baglanacak.")}>
              <CustomText interBold fontSize={11} color={Colors.Gold} letterSpacing={1.2}>
                FOTOGRAFI DEGISTIR
              </CustomText>
            </Pressable>
          </View>

          <View style={styles.section}>
            <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.2} style={styles.sectionLabel}>
              KIMLIK
            </CustomText>

            <FormInput
              label="Ad Soyad"
              value={name}
              onChangeText={setName}
              height={64}
              style={styles.nameInput}
              backgroundColor={Colors.White}
              borderColor="transparent"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.2}>
                CALISMA SAATLERI
              </CustomText>
              <CustomText interBold fontSize={10} color={Colors.Gold} letterSpacing={1}>
                PZT - PAZ
              </CustomText>
            </View>

            <View style={styles.cardSection}>
              {hours.map((item, index) => (
                <HourRow
                  key={item.key}
                  item={item}
                  isLast={index === hours.length - 1}
                  onToggle={() => toggleDay(item.key)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.2} style={styles.sectionLabel}>
              ATANAN HIZMETLER
            </CustomText>

            <View style={styles.servicesList}>
              {services.map((item) => (
                <ServiceItem key={item.id} item={item} onRemove={() => removeService(item.id)} />
              ))}

              <Pressable style={({ pressed }) => [styles.addServiceBtn, pressed && styles.pressed]} onPress={addService}>
                <Ionicons name="add-circle-outline" size={16} color={Colors.Gold} />
                <CustomText interBold fontSize={11} color={Colors.Gold} letterSpacing={1.5}>
                  HIZMET EKLE
                </CustomText>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 18 }]}>
          <CustomButton
            title={saveButtonLabel}
            onPress={saveEmployee}
            marginTop={0}
            height={64}
            borderRadius={16}
            backgroundColor={Colors.BrandPrimary}
            titleStyle={styles.saveTitle}
            rightIcon={<Ionicons name="person-add-outline" size={20} color={Colors.White} style={styles.saveIcon} />}
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
  photoSection: {
    alignItems: "center",
    gap: 14,
  },
  photoWrap: {
    position: "relative",
  },
  photoFrame: {
    width: 128,
    height: 128,
    borderRadius: 64,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: Colors.White,
    backgroundColor: "#E8E8E8",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  cameraButton: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BrandPrimary,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  changePhotoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    paddingHorizontal: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  nameInput: {
    borderRadius: 18,
    minHeight: 64,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  cardSection: {
    backgroundColor: Colors.White,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  dayBlock: {
    paddingVertical: 14,
    gap: 12,
  },
  dayDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(241,241,241,0.7)",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hoursInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hourChip: {
    flex: 1,
    backgroundColor: Colors.BrandBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
    gap: 12,
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  serviceInfo: {
    flex: 1,
    gap: 3,
  },
  removeButton: {
    padding: 4,
  },
  addServiceBtn: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.BorderColor,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.4)",
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
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
