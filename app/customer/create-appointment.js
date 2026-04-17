import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { auth, db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import CustomSelect from "@/components/high-level/custom-select";
import FormBottomBar from "@/components/high-level/form-bottom-bar";
import { Colors } from "@/constants/colors";
import Validator from "@/infrastructures/validation";
import useReRender from "@/hooks/use-re-render";
import CommandBus from "@/infrastructures/command-bus/command-bus";

const SLOT_INTERVAL = 30; // dakika

const toMins = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minsToTime = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

const generateSlots = (start, end) => {
  const slots = [];
  let cur = toMins(start);
  const endMins = toMins(end);
  while (cur + SLOT_INTERVAL <= endMins) {
    slots.push(minsToTime(cur));
    cur += SLOT_INTERVAL;
  }
  return slots;
};

const WEEKDAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const WEEKDAY_FULL = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const MONTH_LABELS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const localDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildDateOptions = () => {
  const today = new Date();
  return Array.from({ length: 60 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = localDateStr(date);
    return {
      id: dateStr,
      date,
      dateStr,
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
  const reRender = useReRender();
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
  const [businessWorkingHours, setBusinessWorkingHours] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Her hizmet için ayrı çalışan seçimi: { [serviceId]: employeeId }
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState({});
  const [selectedDateId, setSelectedDateId] = useState(DATE_OPTIONS[0].id);
  const [selectedTime, setSelectedTime] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validator] = useState(() => new Validator());
  const user = useAuthStore((s) => s.user);
  const validatorScopeKey = validator.scopeKey;

  // Tarih değişince seçili saat geçersizleşebilir
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDateId]);

  useEffect(() => {
    if (!businessId) return;
    const todayIndex = String(new Date().getDay());

    Promise.all([
      getDocs(collection(db, "businesses", businessId, "services")),
      getDocs(collection(db, "businesses", businessId, "employees")),
      getDoc(doc(db, "businesses", businessId)),
      getDocs(query(collection(db, "appointments"), where("businessId", "==", businessId))),
    ])
      .then(([servicesSnap, employeesSnap, businessSnap, appointmentsSnap]) => {
        const fetchedServices = servicesSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              durationMinutes: data.durationMinutes,
              duration: `${data.durationMinutes} dk`,
              rawPrice: Number(data.price) || 0,
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
            serviceIds: (data.services ?? []).map((s) => (typeof s === "string" ? s : s.id)),
            photoUrl: data.photoUrl ?? null,
            workingHours: data.workingHours ?? {},
          };
        });

        const fetchedAppointments = appointmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setServices(fetchedServices);
        setEmployees(fetchedEmployees);
        setBusinessWorkingHours(businessSnap.data()?.workingHours ?? null);
        setAppointments(fetchedAppointments);
      })
      .finally(() => setLoading(false));
  }, [businessId]);

  const selectedServices = services.filter((s) => incomingServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.rawPrice ?? 0), 0);

  // Seçili güne ait çalışma saatleri ve slot hesabı
  const selectedDate = DATE_OPTIONS.find((d) => d.id === selectedDateId);
  const dayIndex = selectedDate ? String(selectedDate.date.getDay()) : null;
  const businessDayHours = dayIndex && businessWorkingHours ? businessWorkingHours[dayIndex] : null;
  const businessClosed = !businessDayHours?.enabled;

  const timeSlots = useMemo(() => {
    if (!businessDayHours?.enabled) return [];
    const base = generateSlots(businessDayHours.start, businessDayHours.end);
    const dateStr = selectedDate?.dateStr ?? "";

    return base.map((slot) => {
      const slotMins = toMins(slot);
      let status = "available"; // "available" | "employee_off" | "booked"

      for (const service of selectedServices) {
        const empId = selectedEmployeeIds[service.id];
        if (!empId || empId === "any") continue;

        const emp = employees.find((e) => e.id === empId);
        if (!emp) continue;

        // Çalışan o gün çalışıyor mu?
        const empDay = emp.workingHours?.[dayIndex];
        if (!empDay?.enabled || slotMins < toMins(empDay.start) || slotMins >= toMins(empDay.end)) {
          status = "employee_off";
          break;
        }

        // O saatte mevcut randevu var mı?
        const conflict = appointments.some(
          (apt) =>
            apt.date === dateStr &&
            apt.time === slot &&
            apt.employeeIds?.[service.id] === empId &&
            apt.status !== "cancelled",
        );
        if (conflict) {
          status = "booked";
          break;
        }
      }

      return { slot, status };
    });
  }, [businessDayHours, selectedDate, selectedEmployeeIds, selectedServices, employees, appointments, dayIndex]);

  // Hangi çalışanlar nedeniyle slotlar kısıtlı? — aynı çalışan tekrarlanmaz
  const offReasons = useMemo(() => {
    if (!dayIndex || !timeSlots.some((t) => t.status === "employee_off")) return [];
    const seen = new Set();
    const reasons = [];
    for (const service of selectedServices) {
      const empId = selectedEmployeeIds[service.id];
      if (!empId || empId === "any" || seen.has(empId)) continue;
      const emp = employees.find((e) => e.id === empId);
      if (!emp) continue;
      const empDay = emp.workingHours?.[dayIndex];
      const hasOffSlot = timeSlots.some((t) => {
        if (t.status !== "employee_off") return false;
        const slotMins = toMins(t.slot);
        if (!empDay?.enabled) return true;
        return slotMins < toMins(empDay.start) || slotMins >= toMins(empDay.end);
      });
      if (!hasOffSlot) continue;
      seen.add(empId);
      reasons.push({
        empName: emp.name,
        hours: empDay?.enabled ? `${empDay.start} – ${empDay.end}` : null,
      });
    }
    return reasons;
  }, [dayIndex, timeSlots, selectedServices, selectedEmployeeIds, employees]);

  const getEmployeeItemsForService = (serviceId) => {
    const eligible = employees.filter((e) => e.serviceIds.includes(serviceId));
    return [ANY_EMPLOYEE, ...eligible];
  };

  const timeError = validator.registerDestructuring({
    name: "time",
    value: selectedTime,
    rules: [{ rule: "required", value: 1 }],
    validatorScopeKey,
  });

  const setEmployeeForService = (serviceId, employeeId) => {
    setSelectedEmployeeIds((prev) => ({ ...prev, [serviceId]: employeeId }));
  };

  const handleConfirm = async () => {
    reRender();
    if (!validator.allValid()) return;

    const customerId = user?.uid ?? auth.currentUser?.uid;
    if (!customerId) return;

    setSaving(true);
    try {
      const dateStr = selectedDate.dateStr;

      const customerSnap = await getDoc(doc(db, "users", customerId));
      const customerData = customerSnap.exists() ? customerSnap.data() : {};
      const customerName = customerData.name ?? "";
      const customerPhone = customerData.phone ?? "";

      const appointmentRef = doc(collection(db, "appointments"));

      const appointmentData = {
        businessId,
        customerId,
        customerName,
        customerPhone,
        serviceIds: incomingServiceIds,
        employeeIds: selectedEmployeeIds,
        date: dateStr,
        time: selectedTime,
        status: "pending",
        createdAt: serverTimestamp(),
        // Denormalized display fields
        serviceNames: selectedServices.map((s) => s.name),
        totalDuration,
        totalPrice,
        employeeNames: Object.fromEntries(
          selectedServices.map((s) => [
            s.id,
            employees.find((e) => e.id === selectedEmployeeIds[s.id])?.name ?? "Fark etmez",
          ])
        ),
      };

      await setDoc(appointmentRef, appointmentData);

      CommandBus.sc.alertSuccess(
        "Randevu Oluşturuldu",
        "Randevunuz alındı. İşletmenin onaylaması bekleniyor.",
        4000
      );
      router.replace(`/customer/appointments?date=${dateStr}`);
    } catch (e) {
      console.error("Randevu oluşturulamadı:", e);
      CommandBus.sc.alertError("Hata", "Randevu oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
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
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
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
                    required
                    error={validator.registerDestructuring({ name: `employee_${service.id}`, value: selectedEmployeeIds[service.id] ?? null, rules: [{ rule: "required", value: 1 }], validatorScopeKey })}
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
              <View style={styles.totalLeft}>
                <View style={styles.totalIconWrap}>
                  <Ionicons name="time-outline" size={15} color={Colors.BrandPrimary} />
                </View>
                <CustomText sm color={Colors.LightGray}>
                  Tahmini toplam süre
                </CustomText>
              </View>
              <View style={styles.totalBadge}>
                <CustomText semibold sm color={Colors.BrandPrimary}>
                  {totalDuration} dk
                </CustomText>
              </View>
            </View>
          )}
        </View>

        {/* Tarih Seçimi */}
        <View style={styles.section}>
          <CustomText semibold xs color={Colors.LightGray2} style={styles.sectionLabel}>
            TARİH <CustomText xs color={Colors.ErrorColor ?? "#EF4444"}>*</CustomText>
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
            SAAT <CustomText xs color={Colors.ErrorColor ?? "#EF4444"}>*</CustomText>
          </CustomText>

          <View style={[styles.timeCard, timeError && styles.cardError]}>
            {businessClosed ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="moon-outline" size={28} color={Colors.LightGray} />
                </View>
                <CustomText semibold sm color={Colors.BrandPrimary} style={styles.emptyTitle}>
                  Bu gün kapalı
                </CustomText>
                <CustomText xs color={Colors.LightGray} style={styles.emptySubtitle}>
                  Seçili tarihe ait çalışma saati bulunmuyor.{"\n"}Lütfen başka bir gün seçin.
                </CustomText>
              </View>
            ) : timeSlots.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="time-outline" size={28} color={Colors.LightGray} />
                </View>
                <CustomText semibold sm color={Colors.BrandPrimary} style={styles.emptyTitle}>
                  Uygun saat yok
                </CustomText>
                <CustomText xs color={Colors.LightGray} style={styles.emptySubtitle}>
                  Bu tarih için müsait zaman dilimi bulunamadı.
                </CustomText>
              </View>
            ) : (
              <>
                <View style={styles.slotGrid}>
                  {timeSlots.map(({ slot, status }) => {
                    const isSelected = selectedTime === slot;
                    const isBooked = status === "booked";
                    const isOff = status === "employee_off";
                    const isDisabled = isBooked || isOff;
                    return (
                      <CustomTouchableOpacity
                        key={slot}
                        style={[styles.timeSlot, isSelected && styles.timeSlotActive, isBooked && styles.timeSlotBooked, isOff && styles.timeSlotOff]}
                        activeOpacity={isDisabled ? 1 : 0.8}
                        onPress={() => { if (!isDisabled) setSelectedTime(slot); }}
                      >
                        <CustomText semibold style={styles.timeSlotText} color={isSelected ? Colors.BrandGold : isBooked ? "#BDBDBD" : isOff ? "#BDBDBD" : Colors.BrandPrimary}>
                          {slot}
                        </CustomText>
                        {(isBooked || isOff) && (
                          <CustomText style={styles.slotBadgeText} color="#BDBDBD">
                            {isBooked ? "Dolu" : "Kapalı"}
                          </CustomText>
                        )}
                      </CustomTouchableOpacity>
                    );
                  })}
                </View>

                {offReasons.length > 0 && (
                  <View style={styles.offReasonBox}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.LightGray} style={styles.offReasonIcon} />
                    <View style={styles.offReasonLines}>
                      {offReasons.map((r, i) => (
                        <CustomText key={i} xs color={Colors.LightGray} style={styles.offReasonText}>
                          <CustomText xs semibold color={Colors.LightGray2}>{r.empName}</CustomText>
                          {r.hours ? ` bu gün ${r.hours} saatleri arasında çalışıyor` : " bu gün çalışmıyor"}
                        </CustomText>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
          {!!timeError && (
            <CustomText xs color={Colors.ErrorColor ?? "#EF4444"} style={styles.fieldErrorText}>
              {timeError}
            </CustomText>
          )}
        </View>

        {/* Seçim özeti */}
        {(selectedDateId || selectedTime) && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar-outline" size={15} color={Colors.LightGray} />
                <View>
                  <CustomText xs color={Colors.LightGray}>
                    Tarih
                  </CustomText>
                  <CustomText semibold sm color={Colors.BrandPrimary}>
                    {selectedDate
                      ? `${WEEKDAY_FULL[selectedDate.date.getDay()]}, ${selectedDate.date.getDate()} ${MONTH_LABELS[selectedDate.date.getMonth()]}`
                      : "—"}
                  </CustomText>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={15} color={Colors.LightGray} />
                <View>
                  <CustomText xs color={Colors.LightGray}>
                    Saat
                  </CustomText>
                  <CustomText semibold sm color={Colors.BrandPrimary}>
                    {selectedTime ?? "—"}
                  </CustomText>
                </View>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      <FormBottomBar label={saving ? "Kaydediliyor..." : "Randevuyu Onayla"} onPress={handleConfirm} icon="calendar-outline" disabled={saving} />
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
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  totalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  totalBadge: {
    backgroundColor: "rgba(212,175,55,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  /* Tarih kartı */
  dateCard: {
    ...CARD_STYLE,
    paddingTop: 12,
    paddingBottom: 20,
    overflow: "visible",
  },
  dateList: {
    paddingHorizontal: 16,
    paddingVertical: 6,
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
  cardError: {
    borderWidth: 1.5,
    borderColor: Colors.ErrorColor ?? "#EF4444",
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
  timeSlotBooked: {
    backgroundColor: "#F5F5F5",
    borderColor: "#EBEBEB",
  },
  timeSlotOff: {
    backgroundColor: "#F9F9F9",
    borderColor: "#EBEBEB",
  },
  timeSlotText: { fontSize: 13 },
  slotBadgeText: {
    fontSize: 9,
    marginTop: 1,
  },
  offReasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  offReasonIcon: {
    marginTop: 1,
  },
  offReasonLines: {
    flex: 1,
    gap: 4,
  },
  offReasonText: {
    lineHeight: 17,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 18,
  },
  fieldErrorText: {
    paddingHorizontal: 4,
  },

  /* Özet */
  summaryCard: {
    ...CARD_STYLE,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#F0F0F0",
  },

});
