import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { openModal, ModalTypeEnum } from "@/components/high-level/modal-renderer";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { router, useNavigation } from "expo-router";
import useAuthStore from "@/store/auth-store";
import { Calendar as RNCalendar, LocaleConfig } from "react-native-calendars";
import DateTimePicker from "@/components/high-level/date-time-picker";
import LayoutView from "@/components/high-level/layout-view";
import FormBottomBar from "@/components/high-level/form-bottom-bar";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import { auth, db } from "@/firebase";
import CommandBus from "@/infrastructures/command-bus/command-bus";

LocaleConfig.locales.tr = {
  monthNames: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  monthNamesShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  dayNames: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
  dayNamesShort: ["Pa", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
  today: "Bugün",
};
LocaleConfig.defaultLocale = "tr";

function timeStringToDate(str) {
  const [h, m] = str.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(date) {
  const safeHours = Math.min(Math.max(date.getHours(), 0), 23);
  const safeMinutes = safeHours === 23 ? Math.min(date.getMinutes(), 59) : Math.min(Math.max(date.getMinutes(), 0), 59);
  const h = String(safeHours).padStart(2, "0");
  const m = String(safeMinutes).padStart(2, "0");
  return `${h}:${m}`;
}

function timeStringToMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function isAfterMaxTime(str, max = "23:59") {
  return timeStringToMinutes(str) > timeStringToMinutes(max);
}

function validateTimeSelection({ start, end, field, nextValue }) {
  if (isAfterMaxTime(nextValue)) {
    return "Saat en fazla 23:59 olabilir.";
  }

  if (field === "start" && timeStringToMinutes(nextValue) > timeStringToMinutes(end)) {
    return "Başlangıç saati bitiş saatinden daha sonra olamaz.";
  }

  if (field === "end" && timeStringToMinutes(nextValue) < timeStringToMinutes(start)) {
    return "Bitiş saati başlangıç saatinden daha erken olamaz.";
  }

  return null;
}

function getPickerBounds(start, end, field) {
  return {
    minimumDate: timeStringToDate(field === "end" ? start : "00:00"),
    maximumDate: timeStringToDate(field === "start" ? end : "23:59"),
  };
}

const DEFAULT_HOURS = [
  { dayIndex: 1, day: "Pazartesi", enabled: true, start: "09:00", end: "18:00" },
  { dayIndex: 2, day: "Salı", enabled: true, start: "09:00", end: "18:00" },
  { dayIndex: 3, day: "Çarşamba", enabled: true, start: "09:00", end: "18:00" },
  { dayIndex: 4, day: "Perşembe", enabled: true, start: "09:00", end: "18:00" },
  { dayIndex: 5, day: "Cuma", enabled: true, start: "09:00", end: "18:00" },
  { dayIndex: 6, day: "Cumartesi", enabled: true, start: "10:00", end: "17:00" },
  { dayIndex: 0, day: "Pazar", enabled: false, start: "09:00", end: "18:00" },
];

function hoursToMap(hoursArray) {
  return Object.fromEntries(hoursArray.map(({ dayIndex, enabled, start, end }) => [String(dayIndex), { enabled, start, end }]));
}

function toDateId(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHoursTemplateForDate(dateId, regularHours) {
  const [year, month, day] = dateId.split("-").map(Number);
  const dayIndex = new Date(year, month - 1, day).getDay();
  return regularHours.find((item) => item.dayIndex === dayIndex) ?? DEFAULT_HOURS[0];
}

function buildSpecialDay(dateId, regularHours) {
  const template = getHoursTemplateForDate(dateId, regularHours);
  return {
    id: dateId,
    date: dateId,
    name: "",
    enabled: template.enabled,
    start: template.start,
    end: template.end,
  };
}

function createHoursSnapshot(hours, specialDays) {
  return JSON.stringify({
    hours,
    specialDays: [...specialDays].sort((a, b) => a.date.localeCompare(b.date)),
  });
}

function HourRow({ item, isLast, onToggle, onTimeChange }) {
  const [pickerOpen, setPickerOpen] = useState(null);
  const pickerBounds = pickerOpen ? getPickerBounds(item.start, item.end, pickerOpen) : null;

  return (
    <View style={[styles.dayBlock, !isLast && styles.dayDivider]}>
      <View style={styles.dayHeader}>
        <CustomText bold fontSize={15} color={item.enabled ? Colors.BrandPrimary : Colors.LightGray2}>
          {item.day}
        </CustomText>
        <Switch value={item.enabled} onValueChange={onToggle} trackColor={{ false: "#E5E7EB", true: Colors.Gold }} thumbColor={Colors.White} />
      </View>

      {item.enabled ? (
        <View style={styles.hoursInputsRow}>
          <Pressable style={({ pressed }) => [styles.hourChip, pressed && styles.pressed]} onPress={() => setPickerOpen("start")}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
              BAŞLANGIÇ
            </CustomText>
            <CustomText extraBold fontSize={14} color={Colors.BrandPrimary}>
              {item.start}
            </CustomText>
          </Pressable>
          <CustomText medium fontSize={12} color={Colors.LightGray2}>
            ile
          </CustomText>
          <Pressable style={({ pressed }) => [styles.hourChip, pressed && styles.pressed]} onPress={() => setPickerOpen("end")}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
              BİTİŞ
            </CustomText>
            <CustomText extraBold fontSize={14} color={Colors.BrandPrimary}>
              {item.end}
            </CustomText>
          </Pressable>
        </View>
      ) : null}

      <DateTimePicker
        visible={pickerOpen !== null}
        mode="time"
        value={timeStringToDate(pickerOpen === "end" ? item.end : item.start)}
        minimumDate={pickerBounds?.minimumDate}
        maximumDate={pickerBounds?.maximumDate}
        title={pickerOpen === "start" ? "Başlangıç saati" : "Bitiş saati"}
        onConfirm={(date) => {
          onTimeChange(item.dayIndex, pickerOpen, dateToTimeString(date));
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
    </View>
  );
}

function SpecialDayRow({ item, isLast, onToggle, onTimeChange, onRemove }) {
  const [pickerOpen, setPickerOpen] = useState(null);
  const pickerBounds = pickerOpen ? getPickerBounds(item.start, item.end, pickerOpen) : null;

  return (
    <View style={[styles.dayBlock, !isLast && styles.dayDivider]}>
      <View style={styles.specialDayHeader}>
        <View style={styles.specialDayTitleWrap}>
          <View style={styles.specialDayIconWrap}>
            <Ionicons name="calendar-clear-outline" size={16} color={Colors.Gold} />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText bold fontSize={15} color={item.enabled ? Colors.BrandPrimary : Colors.LightGray2}>
              {item.name?.trim() ? `${item.name.trim()}` : "Özel gün"}
            </CustomText>
            <CustomText medium fontSize={11} color={Colors.LightGray2}>
              Özel gün çalışma saati
            </CustomText>
          </View>
        </View>

        <View style={styles.specialDayActions}>
          <Switch value={item.enabled} onValueChange={onToggle} trackColor={{ false: "#E5E7EB", true: Colors.Gold }} thumbColor={Colors.White} />
          <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} onPress={onRemove}>
            <Ionicons name="trash-outline" size={18} color={Colors.ErrorColor} />
          </Pressable>
        </View>
      </View>

      {item.enabled ? (
        <View style={styles.hoursInputsRow}>
          <Pressable style={({ pressed }) => [styles.hourChip, pressed && styles.pressed]} onPress={() => setPickerOpen("start")}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
              BAŞLANGIÇ
            </CustomText>
            <CustomText extraBold fontSize={14} color={Colors.BrandPrimary}>
              {item.start}
            </CustomText>
          </Pressable>
          <CustomText medium fontSize={12} color={Colors.LightGray2}>
            ile
          </CustomText>
          <Pressable style={({ pressed }) => [styles.hourChip, pressed && styles.pressed]} onPress={() => setPickerOpen("end")}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
              BİTİŞ
            </CustomText>
            <CustomText extraBold fontSize={14} color={Colors.BrandPrimary}>
              {item.end}
            </CustomText>
          </Pressable>
        </View>
      ) : null}

      <DateTimePicker
        visible={pickerOpen !== null}
        mode="time"
        value={timeStringToDate(pickerOpen === "end" ? item.end : item.start)}
        minimumDate={pickerBounds?.minimumDate}
        maximumDate={pickerBounds?.maximumDate}
        title={pickerOpen === "start" ? "Başlangıç saati" : "Bitiş saati"}
        onConfirm={(date) => {
          onTimeChange(item.id, pickerOpen, dateToTimeString(date));
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
    </View>
  );
}

export default function WorkingHours() {
  const navigation = useNavigation();
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [specialDays, setSpecialDays] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [pendingSelectedDates, setPendingSelectedDates] = useState({});
  const [pendingSpecialDayName, setPendingSpecialDayName] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const todayDateId = useMemo(() => toDateId(new Date()), []);
  const initialSnapshotRef = useRef(createHoursSnapshot(DEFAULT_HOURS, []));
  const allowRemoveRef = useRef(false);

  const isAdmin = useAuthStore((s) => s.isAdmin);
  const userType = useAuthStore((s) => s.userType);
  const storedBusinessId = useAuthStore((s) => s.businessId);
  const isEmployee = userType === "business" && !isAdmin;
  const currentUid = auth.currentUser?.uid;

  // Okunacak/yazılacak Firestore doküman referansı
  const hoursDocRef = useMemo(() => {
    if (!currentUid) return null;
    if (isEmployee && storedBusinessId) {
      // Çalışan: kendi çalışan dokümanını günceller
      return doc(db, "businesses", storedBusinessId, "employees", currentUid);
    }
    // İşletme sahibi: business dokümanını günceller
    return doc(db, "businesses", currentUid);
  }, [isEmployee, storedBusinessId, currentUid]);

  useEffect(() => {
    if (!hoursDocRef) {
      setLoading(false);
      return;
    }

    getDoc(hoursDocRef)
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.workingHours) {
          setHours(DEFAULT_HOURS.map((base) => ({ ...base, ...(data.workingHours[String(base.dayIndex)] ?? {}) })));
        }

        if (Array.isArray(data.specialWorkingHours)) {
          const loadedSpecialDays = data.specialWorkingHours
            .map((item) => ({
              id: item.date,
              date: item.date,
              name: item.name ?? "",
              enabled: item.enabled ?? true,
              start: item.start ?? "09:00",
              end: item.end ?? "18:00",
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
          setSpecialDays(loadedSpecialDays);
          initialSnapshotRef.current = createHoursSnapshot(
            data.workingHours ? DEFAULT_HOURS.map((base) => ({ ...base, ...(data.workingHours[String(base.dayIndex)] ?? {}) })) : DEFAULT_HOURS,
            loadedSpecialDays,
          );
          return;
        }

        initialSnapshotRef.current = createHoursSnapshot(data.workingHours ? DEFAULT_HOURS.map((base) => ({ ...base, ...(data.workingHours[String(base.dayIndex)] ?? {}) })) : DEFAULT_HOURS, []);
      })
      .catch((err) => console.error("Business hours load error:", err))
      .finally(() => setLoading(false));
  }, [hoursDocRef]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const toggleDay = useCallback((dayIndex) => {
    setHours((prev) => prev.map((item) => (item.dayIndex === dayIndex ? { ...item, enabled: !item.enabled } : item)));
  }, []);

  const changeTime = useCallback((dayIndex, field, value) => {
    setHours((prev) => prev.map((item) => (item.dayIndex === dayIndex ? { ...item, [field]: value } : item)));
  }, []);

  const toggleSpecialDay = useCallback((id) => {
    setSpecialDays((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  }, []);

  const changeSpecialDayTime = useCallback((id, field, value) => {
    setSpecialDays((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }, []);

  const confirmRemoveSpecialDay = useCallback(
    (id) => {
      const target = specialDays.find((item) => item.id === id);
      openModal(ModalTypeEnum.ConfirmModal, {
        title: "Özel gün silinsin mi?",
        message: `"${target?.name?.trim() ? `${target.name.trim()}` : "Özel gün"}" kaydı kaldırılacak. Emin misiniz?`,
        confirmText: "Sil",
        cancelText: "Vazgeç",
        destructiveConfirm: true,
        onConfirm: () => setSpecialDays((prev) => prev.filter((item) => item.id !== id)),
      });
    },
    [specialDays],
  );

  const markedDates = useMemo(() => {
    const marks = {};

    specialDays.forEach((item) => {
      marks[item.date] = {
        selected: true,
        selectedColor: "rgba(212,175,55,0.22)",
        selectedTextColor: Colors.BrandPrimary,
      };
    });

    Object.keys(pendingSelectedDates).forEach((dateId) => {
      marks[dateId] = {
        selected: true,
        selectedColor: Colors.Gold,
        selectedTextColor: Colors.BrandPrimary,
      };
    });

    return marks;
  }, [pendingSelectedDates, specialDays]);

  const handleDayPress = useCallback((day) => {
    setPendingSelectedDates((prev) => {
      const next = { ...prev };
      if (next[day.dateString]) {
        delete next[day.dateString];
      } else {
        next[day.dateString] = true;
      }
      return next;
    });
  }, []);

  const handleAddSpecialDays = useCallback(() => {
    const selectedDates = Object.keys(pendingSelectedDates);
    if (selectedDates.length === 0) {
      setCalendarVisible(false);
      return;
    }

    const existingDateSet = new Set(specialDays.map((item) => item.date));
    const alreadyAddedDates = selectedDates.filter((dateId) => existingDateSet.has(dateId));
    const newDates = selectedDates.filter((dateId) => !existingDateSet.has(dateId));

    if (newDates.length === 0) {
      CommandBus.sc.alertInfo("Zaten ekli", "Sectigin tarih zaten ozel gun olarak ekli. Duzenlemek icin alttaki karti kullanabilirsin.", 2800);
      return;
    }

    setSpecialDays((prev) => {
      const existing = new Map(prev.map((item) => [item.date, item]));
      newDates.forEach((dateId) => {
        if (!existing.has(dateId)) {
          existing.set(dateId, { ...buildSpecialDay(dateId, hours), name: pendingSpecialDayName.trim() });
        }
      });
      return Array.from(existing.values()).sort((a, b) => a.date.localeCompare(b.date));
    });

    setPendingSpecialDayName("");
    setPendingSelectedDates({});
    setCalendarVisible(false);

    if (alreadyAddedDates.length > 0) {
      CommandBus.sc.alertInfo("Bazi tarihler atlandi", `${alreadyAddedDates.length} tarih zaten ozel gun olarak kayitliydi. Yeni tarihleri ekledim.`, 3000);
    }
  }, [hours, pendingSelectedDates, pendingSpecialDayName, specialDays]);

  const hasUnsavedChanges = useMemo(() => createHoursSnapshot(hours, specialDays) !== initialSnapshotRef.current, [hours, specialDays]);

  const continueNavigation = useCallback(
    (action) => {
      allowRemoveRef.current = true;
      if (action) {
        navigation.dispatch(action);
        return;
      }
      router.back();
    },
    [navigation],
  );

  const findInvalidRange = useCallback(() => {
    const regularInvalid = hours.find((item) => item.enabled && validateTimeSelection({ start: item.start, end: item.end, field: "end", nextValue: item.end }));
    if (regularInvalid) {
      return `"${regularInvalid.day}" icin saat araligi gecersiz.`;
    }

    const specialInvalid = specialDays.find((item) => item.enabled && validateTimeSelection({ start: item.start, end: item.end, field: "end", nextValue: item.end }));
    if (specialInvalid) {
      return `"${specialInvalid.name?.trim() ? `${specialInvalid.name.trim()}` : "Özel gün"}" icin saat araligi gecersiz.`;
    }

    return null;
  }, [hours, specialDays]);

  const handleSave = useCallback(async () => {
    if (!hoursDocRef) {
      CommandBus.sc.alertError("Hata", "Kullanıcı bulunamadı.", 2600);
      return;
    }

    const invalidRangeMessage = findInvalidRange();
    if (invalidRangeMessage) {
      CommandBus.sc.alertError("Geçersiz saat aralığı", invalidRangeMessage, 3200);
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(hoursDocRef, {
        workingHours: hoursToMap(hours),
        specialWorkingHours: specialDays.map((item) => ({
          date: item.date,
          name: item.name?.trim() ?? "",
          enabled: item.enabled,
          start: item.start,
          end: item.end,
        })),
      });
      initialSnapshotRef.current = createHoursSnapshot(hours, specialDays);
      allowRemoveRef.current = true;
      CommandBus.sc.alertSuccess("Kaydedildi", "Çalışma saatleri güncellendi.", 2400);
      router.back();
    } catch (err) {
      console.error("Business hours save error:", err);
      CommandBus.sc.alertError("Hata", "Çalışma saatleri kaydedilirken bir sorun oluştu.", 3200);
    } finally {
      setIsSaving(false);
    }
  }, [findInvalidRange, hours, specialDays, hoursDocRef]);

  const handleAttemptLeave = useCallback(
    (action) => {
      if (isSaving) return;

      if (!hasUnsavedChanges) {
        continueNavigation(action);
        return;
      }

      openModal(ModalTypeEnum.ConfirmModal, {
        title: "Kaydedilmemiş değişiklikler var",
        message: "Yaptığınız değişiklikler kaydedilmedi. Çıkmadan önce kaydetmek ister misiniz?",
        confirmText: "Kaydet",
        cancelText: "Vazgeç",
        onConfirm: () => handleSave(),
        secondaryAction: { text: "Kaydetmeden çık", destructive: true, onPress: () => continueNavigation(action) },
      });
    },
    [continueNavigation, handleSave, hasUnsavedChanges, isSaving],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (allowRemoveRef.current || isSaving || !hasUnsavedChanges) return;

      event.preventDefault();
      handleAttemptLeave(event.data.action);
    });

    return unsubscribe;
  }, [handleAttemptLeave, hasUnsavedChanges, isSaving, navigation]);

  return (
    <LayoutView showBackButton title="Çalışma saatleri" backgroundColor={Colors.BrandBackground} onBackPress={() => handleAttemptLeave()} paddingHorizontal={0}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingTop: 14, paddingBottom: 120, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.Gold} />
            <CustomText medium fontSize={12} color={Colors.LightGray2} style={styles.noteText}>
              {loading ? "Çalışma saatleri yükleniyor..." : "Buradaki saatler işletmenizin genel çalışma düzenini temsil eder."}
            </CustomText>
          </View>

          <View style={styles.sectionHeader}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.2}>
              ÇALIŞMA SAATLERİ
            </CustomText>
            <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={1}>
              PZT - PAZ
            </CustomText>
          </View>

          <View style={styles.cardSection}>
            {hours.map((item, index) => (
              <HourRow key={item.dayIndex} item={item} isLast={index === hours.length - 1} onToggle={() => toggleDay(item.dayIndex)} onTimeChange={changeTime} />
            ))}
          </View>

          <View style={styles.specialDaysSection}>
            <View style={styles.sectionHeader}>
              <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.2}>
                ÖZEL GÜNLER
              </CustomText>
              <Pressable style={({ pressed }) => [styles.specialDayAddButton, pressed && styles.pressed]} onPress={() => setCalendarVisible(true)}>
                <Ionicons name="calendar-outline" size={15} color={Colors.Gold} />
                <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={1}>
                  EKLE
                </CustomText>
              </Pressable>
            </View>

            {specialDays.length === 0 ? (
              <View style={styles.emptySpecialDaysCard}>
                <Ionicons name="calendar-clear-outline" size={24} color={Colors.LightGray2} />
                <CustomText bold fontSize={14} color={Colors.BrandPrimary}>
                  Henüz özel gün eklenmedi
                </CustomText>
                <CustomText medium fontSize={12} color={Colors.LightGray2} style={styles.emptySpecialDaysText}>
                  Resmi tatil, bayram veya kampanya günleri için farklı çalışma saati tanımlayabilirsin.
                </CustomText>
              </View>
            ) : (
              <View style={styles.cardSection}>
                {specialDays.map((item, index) => (
                  <SpecialDayRow
                    key={item.id}
                    item={item}
                    isLast={index === specialDays.length - 1}
                    onToggle={() => toggleSpecialDay(item.id)}
                    onTimeChange={changeSpecialDayTime}
                    onRemove={() => confirmRemoveSpecialDay(item.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <FormBottomBar label="Kaydet" onPress={handleSave} loading={isSaving} />

      <Modal visible={calendarVisible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setCalendarVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCalendarVisible(false)} />
        <View style={styles.modalSheetWrap}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View>
                  <CustomText extraBold fontSize={18} color={Colors.BrandPrimary}>
                    Özel gün seç
                  </CustomText>
                  <CustomText medium fontSize={12} color={Colors.LightGray2}>
                    Bir veya birden fazla tarih seçip özel saat ekleyebilirsin.
                  </CustomText>
                </View>
                <Pressable onPress={() => setCalendarVisible(false)} hitSlop={12}>
                  <Ionicons name="close" size={22} color={Colors.LightGray2} />
                </Pressable>
              </View>

              <View style={styles.modalInputWrap}>
                <TextInput
                  value={pendingSpecialDayName}
                  onChangeText={setPendingSpecialDayName}
                  placeholder="Örn. Bayram mesaisi"
                  placeholderTextColor={Colors.InputPlaceholderColor}
                  style={styles.modalTextInput}
                />
              </View>

              <RNCalendar
                firstDay={1}
                minDate={todayDateId}
                markingType="simple"
                markedDates={markedDates}
                onDayPress={handleDayPress}
                enableSwipeMonths
                theme={{
                  calendarBackground: "transparent",
                  textSectionTitleColor: Colors.LightGray2,
                  dayTextColor: Colors.BrandPrimary,
                  monthTextColor: Colors.BrandPrimary,
                  arrowColor: Colors.BrandPrimary,
                  todayTextColor: Colors.Gold,
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 11,
                  textDayFontWeight: "600",
                  textMonthFontWeight: "700",
                  textDayHeaderFontWeight: "600",
                }}
                style={styles.calendar}
              />

              <View style={styles.selectedDatesInfo}>
                <CustomText medium fontSize={12} color={Colors.LightGray2}>
                  {Object.keys(pendingSelectedDates).length > 0 ? `${Object.keys(pendingSelectedDates).length} tarih secildi` : "Eklemek istedigin tarihlere dokun."}
                </CustomText>
              </View>

              <View style={styles.modalFooter}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                  onPress={() => {
                    setPendingSpecialDayName("");
                    setPendingSelectedDates({});
                    setCalendarVisible(false);
                  }}
                >
                  <CustomText bold fontSize={14} color={Colors.LightGray2}>
                    İptal
                  </CustomText>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={handleAddSpecialDays}>
                  <CustomText bold fontSize={14} color={Colors.BrandPrimary}>
                    Seçilenleri ekle
                  </CustomText>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
        {keyboardHeight > 0 ? (
          <Pressable style={[styles.keyboardDismissBar, { bottom: keyboardHeight }]} onPress={Keyboard.dismiss}>
            <Ionicons name="chevron-down-outline" size={16} color={Colors.White} />
            <CustomText bold fontSize={12} color={Colors.White} letterSpacing={0.4}>
              Kapat
            </CustomText>
          </Pressable>
        ) : null}
      </Modal>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  section: { gap: 12 },
  specialDaysSection: { gap: 12, marginBottom: 50 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
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
  dayBlock: { paddingVertical: 14, gap: 12 },
  dayDivider: { borderBottomWidth: 1, borderBottomColor: "rgba(241,241,241,0.7)" },
  dayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  specialDayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  specialDayTitleWrap: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  specialDayIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  specialDayActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  hoursInputsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  hourChip: {
    flex: 1,
    backgroundColor: Colors.BrandBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,59,48,0.08)",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  specialDayAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  emptySpecialDaysCard: {
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.White,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 24,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  emptySpecialDaysText: { textAlign: "center", lineHeight: 18, maxWidth: 260 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheetWrap: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.White,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 18,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalInputWrap: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  modalInputLabel: { paddingHorizontal: 2 },
  modalTextInput: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.InputBorderColor,
    backgroundColor: Colors.White,
    color: Colors.TextColor,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  calendar: { marginHorizontal: 12, marginTop: 10 },
  keyboardDismissBar: {
    position: "absolute",
    right: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.Black,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedDatesInfo: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8 },
  modalFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 8, marginBottom: 12 },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BrandBackground,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.Gold,
  },
  noteText: { flex: 1, lineHeight: 18 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
