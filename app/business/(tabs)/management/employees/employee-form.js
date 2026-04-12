import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import DateTimePicker from "@/components/high-level/date-time-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { router, useLocalSearchParams } from "expo-router";
import { auth, db, secondaryAuth } from "@/firebase";
import LayoutView from "@/components/high-level/layout-view";
import FormBottomBar from "@/components/high-level/form-bottom-bar";
import CustomImage from "@/components/high-level/custom-image";
import FormInput from "@/components/high-level/custom-input";
import CustomText from "@/components/high-level/custom-text";
import ActivityLoading from "@/components/high-level/activity-loading";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";
import { CloudinaryConfig } from "@/config/app-config";

function timeStringToDate(str) {
  const [h, m] = str.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
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

function HourRow({ item, isLast, onToggle, onTimeChange }) {
  const [pickerOpen, setPickerOpen] = useState(null); // "start" | "end" | null

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

function PhotoSourceSheet({ visible, onSelect, onClose }) {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 300,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={photoSheetStyles.backdrop} onPress={onClose} />
      <Animated.View style={[photoSheetStyles.sheet, { transform: [{ translateY }] }]}>
        <View style={photoSheetStyles.handle} />
        <CustomText bold fontSize={13} color={Colors.LightGray2} style={photoSheetStyles.title}>
          FOTOĞRAF EKLE
        </CustomText>

        <Pressable
          style={({ pressed }) => [photoSheetStyles.option, pressed && photoSheetStyles.optionPressed]}
          onPress={() => {
            onClose();
            onSelect("gallery");
          }}
        >
          <View style={photoSheetStyles.optionIcon}>
            <Ionicons name="image-outline" size={22} color={Colors.BrandPrimary} />
          </View>
          <CustomText bold fontSize={16} color={Colors.BrandPrimary}>
            Galeriden seç
          </CustomText>
        </Pressable>

        <View style={photoSheetStyles.divider} />

        <Pressable
          style={({ pressed }) => [photoSheetStyles.option, pressed && photoSheetStyles.optionPressed]}
          onPress={() => {
            onClose();
            onSelect("camera");
          }}
        >
          <View style={photoSheetStyles.optionIcon}>
            <Ionicons name="camera-outline" size={22} color={Colors.BrandPrimary} />
          </View>
          <CustomText bold fontSize={16} color={Colors.BrandPrimary}>
            Fotoğraf çek
          </CustomText>
        </Pressable>

        <Pressable style={({ pressed }) => [photoSheetStyles.cancelBtn, pressed && photoSheetStyles.optionPressed]} onPress={onClose}>
          <CustomText bold fontSize={16} color={Colors.LightGray2}>
            İptal
          </CustomText>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const photoSheetStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.White,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", marginBottom: 16 },
  title: { textAlign: "center", letterSpacing: 1.5, marginBottom: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
  optionPressed: { backgroundColor: Colors.BrandBackground },
  optionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.BrandBackground, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginHorizontal: 24 },
  cancelBtn: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
});

function ServicePickerModal({ visible, businessServices, selectedIds, onToggle, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <CustomText extraBold fontSize={18} color={Colors.BrandPrimary}>
            Hizmet seç
          </CustomText>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={Colors.LightGray2} />
          </Pressable>
        </View>
        {businessServices.length === 0 ? (
          <View style={styles.modalEmpty}>
            <Ionicons name="cut-outline" size={32} color={Colors.LightGray2} />
            <CustomText medium fontSize={14} color={Colors.LightGray2} style={{ marginTop: 10, textAlign: "center" }}>
              Henüz işletmeye hizmet eklenmemiş.
            </CustomText>
          </View>
        ) : (
          <ScrollView style={styles.modalList} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {businessServices.map((svc) => {
              const selected = selectedIds.includes(svc.id);
              return (
                <Pressable key={svc.id} style={({ pressed }) => [styles.servicePickerItem, selected && styles.servicePickerItemSelected, pressed && styles.pressed]} onPress={() => onToggle(svc)}>
                  <View style={styles.servicePickerLeft}>
                    <View style={[styles.serviceIconWrap, selected && styles.serviceIconWrapSelected]}>
                      <Ionicons name="cut-outline" size={18} color={selected ? Colors.White : Colors.Gold} />
                    </View>
                    <View style={styles.serviceInfo}>
                      <CustomText bold fontSize={14} color={Colors.BrandPrimary}>
                        {svc.name}
                      </CustomText>
                      <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
                        {svc.durationMinutes} DK • ₺{Number(svc.price).toLocaleString("tr-TR")}
                      </CustomText>
                    </View>
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected && <Ionicons name="checkmark" size={14} color={Colors.White} />}</View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

export default function EmployeeForm() {
  const { id: employeeId } = useLocalSearchParams();
  const isEdit = !!employeeId;

  const [employee, setEmployee] = useState(null);
  const [loadingEmployee, setLoadingEmployee] = useState(isEdit);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [selectedServices, setSelectedServices] = useState([]);
  const [businessServices, setBusinessServices] = useState([]);
  const [servicePickerVisible, setServicePickerVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  // Hizmetleri ve (edit modunda) çalışan verisini birlikte yükle.
  // İki ayrı effect yerine tek bir Promise.all — edit modunda hizmet ID'lerini
  // tam objelere dönüştürmek için hizmet listesinin hazır olması gerekiyor.
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoadingEmployee(false);
      setLoadingServices(false);
      return;
    }

    const servicesPromise = getDocs(
      query(collection(db, "businesses", uid, "services"), orderBy("createdAt", "desc"))
    );
    const employeePromise = isEdit
      ? getDoc(doc(db, "businesses", uid, "employees", employeeId))
      : Promise.resolve(null);

    Promise.all([servicesPromise, employeePromise])
      .then(([servicesSnap, employeeSnap]) => {
        const allServices = servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBusinessServices(allServices);

        if (employeeSnap?.exists()) {
          const data = { id: employeeSnap.id, ...employeeSnap.data() };
          setEmployee(data);
          setName(data.name ?? "");
          setEmail(data.email ?? "");
          setPhone(data.phone ?? "");
          setPhotoUri(data.photoUrl ?? null);
          // Kaydedilen değer artık string ID array. Eski format (object array) için de
          // backward-compat: her iki formattan da tam objeye dönüştürüyoruz.
          const stored = data.services ?? [];
          setSelectedServices(
            stored
              .map((s) => allServices.find((svc) => svc.id === (typeof s === "string" ? s : s.id)))
              .filter(Boolean)
          );
          if (data.workingHours) {
            setHours(DEFAULT_HOURS.map((base) => ({ ...base, ...(data.workingHours[String(base.dayIndex)] ?? {}) })));
          }
        }
      })
      .catch((err) => console.error("Load error:", err))
      .finally(() => {
        setLoadingEmployee(false);
        setLoadingServices(false);
      });
  }, [employeeId, isEdit]);

  const selectedIds = useMemo(() => selectedServices.map((s) => s.id), [selectedServices]);

  const toggleService = useCallback((svc) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === svc.id);
      if (exists) return prev.filter((s) => s.id !== svc.id);
      return [...prev, { id: svc.id, name: svc.name, price: svc.price, durationMinutes: svc.durationMinutes }];
    });
  }, []);

  const removeService = useCallback((id) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const pickPhoto = useCallback(async (source) => {
    try {
      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          CommandBus.sc.alertInfo("İzin gerekli", "Kamera kullanmak için izin vermeniz gerekiyor.", 2800);
          return;
        }
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          CommandBus.sc.alertInfo("İzin gerekli", "Fotoğraflara erişmek için izin vermeniz gerekiyor.", 2800);
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      }
      if (!result.canceled) setPhotoUri(result.assets[0].uri);
    } catch (err) {
      console.error("pickPhoto error:", err);
      CommandBus.sc.alertError("Hata", "Fotoğraf seçilirken bir sorun oluştu.", 2800);
    }
  }, []);

  const handlePhotoPress = useCallback(() => {
    setPhotoSheetVisible(true);
  }, []);

  const uploadPhoto = useCallback(async (uri) => {
    const formData = new FormData();
    formData.append("file", { uri, type: "image/jpeg", name: `employee_${Date.now()}.jpg` });
    formData.append("upload_preset", CloudinaryConfig.UPLOAD_PRESET);
    formData.append("folder", "burandevu/employees");
    formData.append("quality", "auto");
    formData.append("fetch_format", "auto");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CloudinaryConfig.CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error(data.error?.message ?? "Upload failed");
    return { url: data.secure_url, publicId: data.public_id };
  }, []);

  const saveEmployee = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      CommandBus.sc.alertError("Hata", "Kullanıcı bulunamadı.", 2600);
      return;
    }
    if (!name.trim()) {
      CommandBus.sc.alertError("Eksik bilgi", "Çalışan adı gereklidir.", 2400);
      return;
    }
    if (!isEdit && !email.trim()) {
      CommandBus.sc.alertError("Eksik bilgi", "Çalışan e-posta adresi gereklidir.", 2400);
      return;
    }

    setIsSaving(true);
    try {
      let photoUrl = employee?.photoUrl ?? null;
      let photoPublicId = employee?.photoPublicId ?? null;

      if (photoUri && photoUri !== employee?.photoUrl) {
        const uploaded = await uploadPhoto(photoUri);
        photoUrl = uploaded.url;
        photoPublicId = uploaded.publicId;
      }

      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        photoUrl,
        photoPublicId,
        services: selectedServices.map((s) => s.id),
        workingHours: hoursToMap(hours),
      };

      if (isEdit) {
        await updateDoc(doc(db, "businesses", uid, "employees", employeeId), payload);
        CommandBus.sc.alertSuccess("Güncellendi", `${name.trim()} güncellendi.`, 2600);
        router.back();
      } else {
        // Çalışan için Firebase Auth hesabı oluştur (ikinci app instance üzerinden —
        // işletme sahibinin oturumu kapanmaz).
        const tempPassword = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).toUpperCase().slice(2, 5) + "1!";

        let employeeUid;
        try {
          const { user: employeeUser } = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), tempPassword);
          employeeUid = employeeUser.uid;
          await updateProfile(employeeUser, { displayName: name.trim() });
          await secondaryAuth.signOut();
        } catch (authErr) {
          const code = authErr?.code;
          if (code === "auth/email-already-in-use") {
            CommandBus.sc.alertError("Hata", "Bu e-posta adresi zaten kullanımda.", 3200);
          } else if (code === "auth/invalid-email") {
            CommandBus.sc.alertError("Hata", "Geçersiz e-posta adresi.", 3000);
          } else {
            CommandBus.sc.alertError("Hata", "Hesap oluşturulamadı. Lütfen tekrar deneyin.", 3200);
          }
          return;
        }

        // Firestore: kullanıcı dokümanı oluştur
        await setDoc(doc(db, "users", employeeUid), {
          uid: employeeUid,
          name: name.trim(),
          email: email.trim(),
          userType: "employee",
          businessId: uid,
          createdAt: serverTimestamp(),
        });

        // Firestore: çalışan dokümanı (UID'yi doküman ID olarak kullan)
        await setDoc(doc(db, "businesses", uid, "employees", employeeUid), {
          ...payload,
          uid: employeeUid,
          createdAt: serverTimestamp(),
        });

        // Çalışana şifre belirleme daveti gönder
        await sendPasswordResetEmail(auth, email.trim());

        CommandBus.sc.alertSuccess("Kaydedildi", `${name.trim()} eklendi. Giriş bilgileri ${email.trim()} adresine gönderildi.`, 4000);
        router.back();
      }
    } catch (err) {
      console.error("saveEmployee error:", err);
      CommandBus.sc.alertError("Hata", "Çalışan kaydedilirken bir sorun oluştu.", 3200);
    } finally {
      setIsSaving(false);
    }
  }, [name, email, phone, photoUri, hours, selectedServices, employee, isEdit, employeeId, uploadPhoto]);

  const toggleDay = useCallback((dayIndex) => {
    setHours((prev) => prev.map((item) => (item.dayIndex === dayIndex ? { ...item, enabled: !item.enabled } : item)));
  }, []);

  const changeTime = useCallback((dayIndex, field, value) => {
    setHours((prev) => prev.map((item) => (item.dayIndex === dayIndex ? { ...item, [field]: value } : item)));
  }, []);

  if (loadingEmployee) {
    return (
      <LayoutView showBackButton title="Çalışanı düzenle" paddingHorizontal={24} backgroundColor={Colors.BrandBackground}>
        <ActivityLoading style={{ flex: 1 }} />
      </LayoutView>
    );
  }

  return (
    <LayoutView showBackButton title={isEdit ? "Çalışanı düzenle" : "Çalışan ekle"} paddingHorizontal={24} backgroundColor={Colors.BrandBackground}>
      <View style={styles.root}>
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={24}
          keyboardOpeningTime={0}
        >
          {/* Fotoğraf */}
          <View style={styles.photoSection}>
            <Pressable style={({ pressed }) => [styles.photoWrap, pressed && styles.pressed]} onPress={handlePhotoPress}>
              {photoUri ? (
                <CustomImage uri={photoUri} style={styles.photo} contentFit="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person-outline" size={40} color="#C0C0C0" />
                </View>
              )}
              <View style={styles.cameraButton}>
                <Ionicons name="camera-outline" size={16} color={Colors.White} />
              </View>
            </Pressable>
          </View>

          {/* Temel bilgiler */}
          <View style={styles.section}>
            <FormInput label="Ad Soyad" value={name} onChangeText={setName} />
            <FormInput label="E-posta adresi" value={email} onChangeText={isEdit ? undefined : setEmail} editable={!isEdit} keyboardType="email-address" autoCapitalize="none" />
            <FormInput label="Telefon numarası" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          {/* Çalışma saatleri */}
          <View style={styles.section}>
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
          </View>

          {/* Atanan hizmetler */}
          <View style={styles.section}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.2} style={styles.sectionLabel}>
              ATANAN HİZMETLER
            </CustomText>

            <View style={styles.servicesList}>
              {selectedServices.map((svc) => (
                <View key={svc.id} style={styles.serviceItem}>
                  <View style={styles.serviceLeft}>
                    <View style={styles.serviceIconWrap}>
                      <Ionicons name="cut-outline" size={20} color={Colors.Gold} />
                    </View>
                    <View style={styles.serviceInfo}>
                      <CustomText bold fontSize={14} color={Colors.BrandPrimary}>
                        {svc.name}
                      </CustomText>
                      <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
                        {svc.durationMinutes} DK • ₺{Number(svc.price).toLocaleString("tr-TR")}
                      </CustomText>
                    </View>
                  </View>
                  <Pressable style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]} onPress={() => removeService(svc.id)}>
                    <Ionicons name="remove-circle-outline" size={20} color="#D94B4B" />
                  </Pressable>
                </View>
              ))}

              <Pressable style={({ pressed }) => [styles.addServiceBtn, pressed && styles.pressed]} onPress={() => setServicePickerVisible(true)}>
                {loadingServices ? (
                  <ActivityLoading size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={16} color={Colors.Gold} />
                    <CustomText bold fontSize={11} color={Colors.Gold} letterSpacing={1.5}>
                      HİZMET EKLE
                    </CustomText>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAwareScrollView>

        <FormBottomBar label={isEdit ? "Değişiklikleri kaydet" : "Çalışanı kaydet"} onPress={saveEmployee} loading={isSaving} icon="person-add-outline" />
      </View>

      <ServicePickerModal visible={servicePickerVisible} businessServices={businessServices} selectedIds={selectedIds} onToggle={toggleService} onClose={() => setServicePickerVisible(false)} />

      <PhotoSourceSheet visible={photoSheetVisible} onSelect={(source) => pickPhoto(source)} onClose={() => setPhotoSheetVisible(false)} />
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 120, gap: 28 },

  // Fotoğraf
  photoSection: { alignItems: "center" },
  photoWrap: { position: "relative", width: 128, height: 128 },
  photo: { width: 128, height: 128, borderRadius: 64 },
  photoPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.White,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
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

  // Bölümler
  section: { gap: 12 },
  sectionLabel: { paddingHorizontal: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },

  // Çalışma saatleri
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
  hoursInputsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  hourChip: {
    flex: 1,
    backgroundColor: Colors.BrandBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },

  // Hizmetler listesi
  servicesList: { gap: 12 },
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
  serviceLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  serviceInfo: { flex: 1, gap: 3 },
  removeButton: { padding: 4 },
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

  // Service Picker Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    backgroundColor: Colors.White,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "75%",
    paddingBottom: 16,
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modalList: { paddingHorizontal: 16, paddingTop: 8 },
  modalEmpty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },
  servicePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  servicePickerItemSelected: { backgroundColor: "transparent" },
  servicePickerLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  serviceIconWrapSelected: { backgroundColor: Colors.BrandPrimary },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.BorderColor,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: Colors.BrandPrimary, borderColor: Colors.BrandPrimary },

  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
