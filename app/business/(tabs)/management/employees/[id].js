import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { collection, deleteDoc, doc, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import LayoutView from "@/components/high-level/layout-view";
import ActivityLoading from "@/components/high-level/activity-loading";
import { openModal, ModalTypeEnum } from "@/components/high-level/modal-renderer";
import CommandBus from "@/infrastructures/command-bus/command-bus";
import { Colors } from "@/constants/colors";

const ORDERED_DAYS = [
  { dayIndex: 1, day: "Pazartesi" },
  { dayIndex: 2, day: "Salı" },
  { dayIndex: 3, day: "Çarşamba" },
  { dayIndex: 4, day: "Perşembe" },
  { dayIndex: 5, day: "Cuma" },
  { dayIndex: 6, day: "Cumartesi" },
  { dayIndex: 0, day: "Pazar" },
];

export default function EmployeeDetail() {
  const { id } = useLocalSearchParams();
  const employeeId = Array.isArray(id) ? id[0] : id;

  const [employee, setEmployee] = useState(null);
  const [businessServices, setBusinessServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !employeeId) {
      setLoading(false);
      return;
    }

    // İşletme hizmetlerini yükle — çalışanın service ID'lerini isimle göstermek için
    getDocs(collection(db, "businesses", uid, "services"))
      .then((snap) => setBusinessServices(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => console.error("Services load error:", err));

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "businesses", uid, "employees", employeeId),
      (snap) => {
        if (snap.exists()) setEmployee({ id: snap.id, ...snap.data() });
        else setEmployee(null);
        setLoading(false);
      },
      (err) => {
        console.error("Employee snapshot error:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, [employeeId]);

  // Çalışanın services alanı artık string ID array. Tam objeye dönüştür.
  // Eski format (object array) için de backward-compat sağlanır.
  const employeeServices = useMemo(() => {
    const stored = employee?.services ?? [];
    return stored
      .map((s) => {
        const id = typeof s === "string" ? s : s.id;
        return businessServices.find((svc) => svc.id === id) ?? null;
      })
      .filter(Boolean);
  }, [employee, businessServices]);

  const handleDelete = useCallback(() => {
    openModal(ModalTypeEnum.ConfirmModal, {
      title: "Çalışanı sil",
      message: `"${employee?.name ?? "Bu çalışan"}" kalıcı olarak silinecek. Emin misiniz?`,
      confirmText: "Sil",
      cancelText: "İptal",
      destructiveConfirm: true,
      onConfirm: async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        setDeleting(true);
        try {
          await deleteDoc(doc(db, "businesses", uid, "employees", employeeId));
          router.back();
          CommandBus.sc.alertSuccess("Silindi", `${employee?.name ?? "Çalışan"} silindi.`, 2400);
        } catch (err) {
          console.error("Employee delete error:", err);
          CommandBus.sc.alertError("Hata", "Çalışan silinirken bir sorun oluştu.", 3200);
        } finally {
          setDeleting(false);
        }
      },
    });
  }, [employee, employeeId]);

  if (loading) {
    return (
      <LayoutView showBackButton title="Çalışan profili" paddingHorizontal={24} backgroundColor={Colors.BrandBackground}>
        <ActivityLoading style={styles.loader} />
      </LayoutView>
    );
  }

  if (!employee) {
    return (
      <LayoutView showBackButton title="Çalışan profili" paddingHorizontal={24} backgroundColor={Colors.BrandBackground}>
        <View style={styles.loader}>
          <CustomText medium fontSize={14} color={Colors.LightGray2}>Çalışan bulunamadı.</CustomText>
        </View>
      </LayoutView>
    );
  }

  return (
    <LayoutView
      showBackButton
      title="Çalışan profili"
      paddingHorizontal={24}
      backgroundColor={Colors.BrandBackground}
      rightButton={
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: "/business/management/employees/form", params: { id: employeeId } })}
        >
          <Ionicons name="create-outline" size={20} color={Colors.BrandPrimary} />
        </Pressable>
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profil */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            {employee.photoUrl ? (
              <CustomImage uri={employee.photoUrl} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={40} color="#C0C0C0" />
              </View>
            )}
          </View>
          <CustomText extraBold fontSize={26} color={Colors.BrandPrimary} style={styles.profileName}>
            {employee.name}
          </CustomText>
          {!!employee.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={14} color={Colors.LightGray2} />
              <CustomText medium fontSize={13} color={Colors.LightGray2}>{employee.phone}</CustomText>
            </View>
          )}
        </View>

        {/* İstatistikler */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="calendar-clear-outline" size={18} color={Colors.BrandPrimary} />
            </View>
            <View style={styles.statTextWrap}>
              <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>TOPLAM RANDEVU</CustomText>
              <CustomText extraBold fontSize={22} color={Colors.BrandPrimary}>—</CustomText>
            </View>
          </View>
          <View style={[styles.statCard, styles.statCardHighlighted]}>
            <View style={[styles.statIconWrap, styles.statIconWrapHighlighted]}>
              <Ionicons name="wallet-outline" size={18} color={Colors.Gold} />
            </View>
            <View style={styles.statTextWrap}>
              <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>TOPLAM CİRO</CustomText>
              <CustomText extraBold fontSize={22} color={Colors.BrandPrimary}>—</CustomText>
            </View>
          </View>
        </View>

        {/* Atanan hizmetler */}
        {employeeServices.length > 0 && (
          <View style={styles.section}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
              ATANAN HİZMETLER
            </CustomText>
            <View style={styles.sectionCard}>
              {employeeServices.map((svc, index) => (
                <View
                  key={svc.id}
                  style={[styles.serviceRow, index < employeeServices.length - 1 && styles.rowDivider]}
                >
                  <View style={styles.serviceIconWrap}>
                    <Ionicons name="cut-outline" size={18} color={Colors.Gold} />
                  </View>
                  <View style={styles.serviceInfo}>
                    <CustomText bold fontSize={14} color={Colors.BrandPrimary}>{svc.name}</CustomText>
                    <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
                      {svc.durationMinutes} DK  •  ₺{Number(svc.price).toLocaleString("tr-TR")}
                    </CustomText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Çalışma saatleri */}
        {!!employee.workingHours && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
                ÇALIŞMA SAATLERİ
              </CustomText>
              <Ionicons name="time-outline" size={16} color={Colors.LightGray2} />
            </View>
            <View style={styles.sectionCard}>
              {ORDERED_DAYS.map(({ dayIndex, day }, index) => {
                const item = employee.workingHours[String(dayIndex)];
                if (!item) return null;
                return (
                  <View
                    key={dayIndex}
                    style={[
                      styles.hoursRow,
                      index < ORDERED_DAYS.length - 1 && styles.rowDivider,
                      !item.enabled && styles.hoursRowMuted,
                    ]}
                  >
                    <CustomText bold fontSize={14} color={Colors.BrandPrimary}>{day}</CustomText>
                    <CustomText bold fontSize={item.enabled ? 14 : 11} color={item.enabled ? Colors.BrandPrimary : Colors.LightGray2} letterSpacing={item.enabled ? 0 : 1.5}>
                      {item.enabled ? `${item.start} — ${item.end}` : "KAPALI"}
                    </CustomText>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Sil butonu */}
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, deleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.ErrorColor} />
          <CustomText bold fontSize={10} color={Colors.ErrorColor} letterSpacing={1.8}>
            ÇALIŞANI SİL
          </CustomText>
        </Pressable>

      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.86)",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 18, paddingBottom: 120, gap: 28 },

  // Profil
  profileSection: { alignItems: "center", gap: 10 },
  avatarWrap: {
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  avatar: { width: 108, height: 108, borderRadius: 54, borderWidth: 4, borderColor: Colors.White },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.White,
  },
  profileName: { letterSpacing: -0.8, marginTop: 4 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  // İstatistikler
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.White,
    borderRadius: 18,
    padding: 18,
    minHeight: 128,
    justifyContent: "space-between",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  statCardHighlighted: { borderLeftWidth: 4, borderLeftColor: Colors.Gold },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F1F1F1",
  },
  statIconWrapHighlighted: { backgroundColor: "rgba(212,175,55,0.12)" },
  statTextWrap: { gap: 6 },

  // Bölümler
  section: { gap: 10 },
  sectionLabel: { paddingHorizontal: 2 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  sectionCard: {
    backgroundColor: Colors.White,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 4,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#F1F1F1" },

  // Hizmetler
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  serviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  serviceInfo: { flex: 1, gap: 3 },

  // Çalışma saatleri
  hoursRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13 },
  hoursRowMuted: { opacity: 0.4 },

  // Sil butonu
  deleteButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,59,48,0.02)",
    marginTop: 8,
  },
  deleteButtonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
