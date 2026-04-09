import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import LayoutView from "@/components/high-level/layout-view";
import CustomButton from "@/components/high-level/custom-button";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import CustomSelect from "@/components/high-level/custom-select";
import { Colors } from "@/constants/colors";

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];

const WEEKDAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const MONTH_LABELS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const buildDateOptions = () => {
  const today = new Date();
  return Array.from({ length: 60 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return {
      id: date.toISOString(),
      date,
      dayLabel: i === 0 ? "Bugün" : i === 1 ? "Yarın" : WEEKDAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
      month: MONTH_LABELS[date.getMonth()],
      isFirstOfMonth: date.getDate() === 1,
    };
  });
};

const DATE_OPTIONS = buildDateOptions();
const ANY_EMPLOYEE = { id: "any", name: "Fark etmez" };

const CreateAppointment = () => {
  const insets = useSafeAreaInsets();
  const { id, serviceIds: serviceIdsParam } = useLocalSearchParams();
  const businessId = Array.isArray(id) ? id[0] : id;

  const incomingServiceIds = useMemo(() => {
    try {
      const parsed = JSON.parse(Array.isArray(serviceIdsParam) ? serviceIdsParam[0] : serviceIdsParam);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [serviceIdsParam]);

  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Her hizmet için ayrı çalışan seçimi: { [serviceId]: employeeId }
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState({});
  const [selectedDateId, setSelectedDateId] = useState(DATE_OPTIONS[0].id);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    if (!businessId) return;
    const todayIndex = String(new Date().getDay());

    Promise.all([getDocs(collection(db, "businesses", businessId, "services")), getDocs(collection(db, "businesses", businessId, "employees"))])
      .then(([servicesSnap, employeesSnap]) => {
        const fetchedServices = servicesSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              durationMinutes: data.durationMinutes,
              duration: `${data.durationMinutes} dk`,
              price: `₺${Number(data.price).toLocaleString("tr-TR")}`,
              isActive: data.isActive ?? true,
            };
          })
          .filter((s) => s.isActive);

        const fetchedEmployees = employeesSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            serviceIds: (data.services ?? []).map((s) => s.id),
            photoUrl: data.photoUrl ?? null,
          };
        });

        setServices(fetchedServices);
        setEmployees(fetchedEmployees);
      })
      .finally(() => setLoading(false));
  }, [businessId]);

  const selectedServices = services.filter((s) => incomingServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);

  const getEmployeeItemsForService = (serviceId) => {
    const eligible = employees.filter((e) => e.serviceIds.includes(serviceId));
    return [ANY_EMPLOYEE, ...eligible];
  };

  const setEmployeeForService = (serviceId, employeeId) => {
    setSelectedEmployeeIds((prev) => ({ ...prev, [serviceId]: employeeId }));
  };

  if (loading) {
    return (
      <LayoutView showBackButton title="Randevu Al" paddingHorizontal={0} backgroundColor={Colors.BrandBackground}>
        <ActivityIndicator size="large" color={Colors.BrandPrimary} style={styles.loader} />
      </LayoutView>
    );
  }

  return (
    <LayoutView showBackButton title="Randevu Al" paddingHorizontal={0} backgroundColor={Colors.BrandBackground}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {/* Hizmetler — her biri ayrı kart */}
        <View style={styles.section}>
          <CustomText semibold xs color={Colors.LightGray2} style={styles.sectionLabel}>
            HİZMETLER
          </CustomText>

          {selectedServices.map((service) => {
            const employeeItems = getEmployeeItemsForService(service.id);
            const selectedEmpId = selectedEmployeeIds[service.id] ?? null;
            const selectedEmp = employeeItems.find((e) => e.id === selectedEmpId);

            return (
              <View key={service.id} style={styles.serviceCard}>
                {/* Hizmet bilgisi */}
                <View style={styles.serviceCardHeader}>
                  <View style={styles.serviceCardLeft}>
                    <CustomText semibold sm color={Colors.BrandPrimary}>
                      {service.name}
                    </CustomText>
                    <View style={styles.serviceMeta}>
                      <Ionicons name="time-outline" size={12} color={Colors.LightGray} />
                      <CustomText xs color={Colors.LightGray}>
                        {service.duration}
                      </CustomText>
                    </View>
                  </View>
                  <CustomText semibold sm color={Colors.BrandPrimary}>
                    {service.price}
                  </CustomText>
                </View>

                {/* Çalışan seçimi */}
                <View style={styles.serviceCardSelect}>
                  <CustomSelect
                    label="Çalışan"
                    value={selectedEmp?.name ?? null}
                    style={styles.selectField}
                    selectModalProps={{
                      title: "Çalışan Seçin",
                      items: employeeItems,
                      labelKey: "name",
                      valueKey: "id",
                      selectedValue: selectedEmpId,
                      avatarKey: "photoUrl",
                      onSelect: (item) => setEmployeeForService(service.id, item.value),
                    }}
                  />
                </View>
              </View>
            );
          })}

          {selectedServices.length > 1 && (
            <View style={styles.totalCard}>
              <CustomText sm color={Colors.LightGray}>
                Tahmini Toplam süre
              </CustomText>
              <CustomText sm semibold color={Colors.BrandPrimary}>
                {totalDuration} dk
              </CustomText>
            </View>
          )}
        </View>

        {/* Tarih Seçimi */}
        <View style={styles.section}>
          <CustomText semibold xs color={Colors.LightGray2} style={styles.sectionLabel}>
            TARİH
          </CustomText>

          <View style={styles.dateCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
              {DATE_OPTIONS.map((item, index) => {
                const isSelected = item.id === selectedDateId;
                const showMonthLabel = index === 0 || item.isFirstOfMonth;
                return (
                  <View key={item.id} style={styles.dateColumn}>
                    <CustomText style={[styles.monthChip, !showMonthLabel && styles.monthChipHidden]} color={Colors.LightGray}>
                      {item.month}
                    </CustomText>
                    <CustomTouchableOpacity style={[styles.datePill, isSelected && styles.datePillActive]} activeOpacity={0.85} onPress={() => setSelectedDateId(item.id)}>
                      <CustomText semibold style={[styles.dayLabelText, item.dayLabel.length > 3 && styles.dayLabelSmall]} color={isSelected ? "rgba(255,255,255,0.75)" : Colors.LightGray}>
                        {item.dayLabel}
                      </CustomText>
                      <CustomText bold style={styles.dayNumberText} color={isSelected ? Colors.BrandGold : Colors.BrandPrimary}>
                        {item.dayNumber}
                      </CustomText>
                      <View style={[styles.dateDot, isSelected && styles.dateDotActive]} />
                    </CustomTouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Saat Seçimi */}
        <View style={styles.section}>
          <CustomText semibold xs color={Colors.LightGray2} style={styles.sectionLabel}>
            SAAT
          </CustomText>

          <View style={styles.timeCard}>
            <View style={styles.slotGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <CustomTouchableOpacity key={slot} style={[styles.timeSlot, isSelected && styles.timeSlotActive]} activeOpacity={0.8} onPress={() => setSelectedTime(slot)}>
                    <CustomText semibold style={styles.timeSlotText} color={isSelected ? Colors.BrandGold : Colors.BrandPrimary}>
                      {slot}
                    </CustomText>
                  </CustomTouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.confirmSection}>
          <CustomButton
            title="Randevuyu Onayla"
            onPress={() => {}}
            marginTop={0}
            height={56}
            borderRadius={999}
            backgroundColor={Colors.BrandPrimary}
            style={styles.confirmButton}
            disabled={!selectedDateId || !selectedTime}
          />
        </View>
      </ScrollView>
    </LayoutView>
  );
};

export default CreateAppointment;

const CARD_STYLE = {
  backgroundColor: Colors.White,
  borderRadius: 22,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignSelf: "center",
    marginTop: 80,
  },
  scrollView: { flex: 1 },
  container: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 0,
  },

  /* Bölüm */
  section: {
    marginBottom: 24,
    gap: 10,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    paddingHorizontal: 4,
  },

  /* Hizmet kartı */
  serviceCard: {
    ...CARD_STYLE,
    overflow: "hidden",
  },
  serviceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  serviceCardLeft: {
    flex: 1,
    gap: 5,
    marginRight: 12,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceCardSelect: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    padding: 12,
  },
  selectField: {
    borderRadius: 18,
  },

  /* Toplam süre */
  totalCard: {
    ...CARD_STYLE,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  /* Tarih kartı */
  dateCard: {
    ...CARD_STYLE,
    paddingVertical: 16,
  },
  dateList: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: "flex-end",
  },
  dateColumn: {
    alignItems: "center",
    gap: 6,
  },
  monthChip: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  monthChipHidden: {
    opacity: 0,
  },
  datePill: {
    width: 62,
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#EDEEF0",
    backgroundColor: Colors.White,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  datePillActive: {
    backgroundColor: Colors.BrandPrimary,
    borderColor: Colors.BrandPrimary,
    transform: [{ scale: 1.06 }],
  },
  dayLabelText: { fontSize: 11 },
  dayLabelSmall: { fontSize: 9 },
  dayNumberText: {
    fontSize: 22,
    lineHeight: 26,
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
    marginTop: 2,
  },
  dateDotActive: {
    backgroundColor: Colors.BrandGold,
  },

  /* Saat kartı */
  timeCard: {
    ...CARD_STYLE,
    padding: 16,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeSlot: {
    width: "22%",
    flexGrow: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EDEEF0",
    backgroundColor: Colors.White,
    alignItems: "center",
    justifyContent: "center",
  },
  timeSlotActive: {
    backgroundColor: Colors.BrandPrimary,
    borderColor: Colors.BrandPrimary,
  },
  timeSlotText: { fontSize: 13 },

  /* Onayla */
  confirmSection: {
    marginTop: 8,
  },
  confirmButton: {
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
});
