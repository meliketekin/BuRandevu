import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomImage from "@/components/high-level/custom-image";
import { Colors } from "@/constants/colors";

const TERTIARY = "#735C00";
const TERTIARY_CONTAINER = "#CCA830";
const ON_TERTIARY_CONTAINER = "#4F3E00";
const SURFACE_HIGH = "#E8E8E8";
const ERROR_CONTAINER = "#FFDAD6";
const ON_ERROR_CONTAINER = "#93000A";

const PALETTE = {
  bg: "#F7F7F7",
  surface: "#FFFFFF",
  muted: "#7B7B7B",
  border: "rgba(20,20,20,0.08)",
  softFill: "rgba(20,20,20,0.04)",
  gold: Colors.Gold,
  goldSoft: "rgba(212,175,55,0.14)",
};

const OWNER_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDEGkBeRlkf0bFGNdv483wwa4oqEvgXXEiPvCzJ2EhjwcSr1LZuiRRE9QDbxAzkmUjpT4PeTOBCihWxiT3lV2-tjaPOHVCWmrp-xCOspZxn6BK2cQAO1E1EYDyldak4lshZOJERQo9SGRdBWYzOG4OMbk8z-DXNoDf2CXfRJAGSo78zLZSOAlKtRm4Rk44WgVFLYWj7T-uOnx6RfjPd9HrhRoIXXbxhP5oAwaSpdvo-Vpg66LeJP6yNCBxECBaiT7GvjBiknqi5jKw";

const DATE_FILTER_OPTIONS = ["Bugün", "Yarın", "Bu hafta"];
const EMPLOYEE_OPTIONS = ["Tümü", "Murat Atasoy", "Ayşe Kaya", "Elif Şahin"];

const UPCOMING_APPOINTMENTS = [
  {
    id: "1",
    name: "Caner Yıldız",
    service: "Sakal Tasarımı",
    time: "10:30",
    status: "confirmed",
    showActiveDot: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC-qgcuI7i344wfmRMwtLho875ffrjvQnSUVrCMN6Iw9MO0gYrKLPRhk0kuayg4KG2eNNcuMSYzjNwDumWPKq7WfmJgxMqjPJoq_x91OvzYAzSHuRB9ZGgmG66i9j3cI5y7myqdaXy6ceGO_THziiQJEv8p7bvXJ8MlFXtF8_F_qQarTLNut7ahRxkE4K0X1gRbf0f7Iv7TtzTD1UAutqNY6pjSLT9pL_xNvmNNQVoWuwE8i3eOmOvY7mz_M5mgY-w78OYmasVMgso",
    expert: "Murat Atasoy",
    price: "₺450,00",
  },
  {
    id: "2",
    name: "Merve Demir",
    service: "Cilt Bakımı",
    time: "11:45",
    status: "pending",
    showActiveDot: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCtOE8kOOLSxi0YhaNL4yhBZdlHCnHduBOsOP856xHC9y_TIiTo2NeKsQXQVG09yT-9gpPuT06wrI1fpxBriVP67f9Wg5mfrmc9FJhMAK3-7qwa5R-m7wQPIZ6Qfvb5mus9h8PimRmEcoTxpEIosLAMaRyrbZnlGPqbgtIli7us8S1CstqVsYaDB4JGFmQyXJ9Itiokch6oRXu5W28Syk3JpBBlZGlcnK-MvhFzy6hlTL58KHrOlTP4Y7gfGIGbigY0y1Jt5b98nOM",
    expert: "Ayşe Kaya",
    price: "₺680,00",
  },
  {
    id: "3",
    name: "Ahmet Ak",
    service: "Saç Kesimi",
    time: "14:00",
    status: "confirmed",
    showActiveDot: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJgPLMaj7HlwYLp7lN9ikAT5N7Nd_o2XLeLasPq2b1DiEi6ce2whHxqvnHFiWZFw941_ASwjRs1-hKuCzYDkb2uy_jwGZUTptcrGRnIJPW21XQ4KScBoTHl4hhxoC_2QK6VojE4SGgnKCmM0icXcG-jFwyBjXK0tbVsqc8EpbYvuyHkVO9H5k-8wfjNPNXfVTZHLM89phpjumw31oL8OOULPZTu9tmn482DtmdHrVOiaHwXe0yQC778Oi2COi4ORAA_-LcoT-fplQ",
    expert: "Murat Atasoy",
    price: "₺320,00",
  },
  {
    id: "4",
    name: "Selin Yılmaz",
    service: "Saç Boyama",
    time: "15:30",
    status: "confirmed",
    showActiveDot: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBpRni3HgJ9ExBzXRnjQeNDOEEVxa0fpJnUusuxbk1v3vPq_Q4hEz1Ob4NzduLHtUW_aS0gG3xmPSre4tAaKdFurhQjdeu_s-IqgOITasQzt5qgDNl3vK7IVRtUVRmZ9BVkhKr5lLCXyuL4-HhmQqX2tKe0avRODW-7aWbUic8t5272_IFw2cRH8RN6nhbY_dZg19Fznnvy2sgTORkjKenbxVLzYCYoTEpOjqvJDNBAoeIx9q5bCCfsz-mi8Kvaq3wX29Upkf6mH4Q",
    expert: "Elif Şahin",
    price: "₺1.200,00",
  },
];

const PAST_APPOINTMENTS = [
  {
    id: "p1",
    name: "Ozan Kurt",
    service: "Saç & Sakal",
    time: "16:00",
    status: "confirmed",
    showActiveDot: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCWtK62fM0gljowf5MWovVCt_CaqDMtmIaDA1L7OPURppJd_q-egCapwlKYJuahViLF0X4CZUmdUlAZ5bAgcfAw5Q9kEBXITCN-w80w_9jekI1LFYfREIJ5ZWfy5GA_HJ_H8wsr8NzYTK1-QB8QIvZUJ6YHsUjxk1c4HE0QgofuRY7VP3IvY8bBt6-p019B4PGdkEbMwfFhU3C5MmvuMU_1r9afUhmlbFiFezZFampFKguSt7FJuHnHONckhO82cNtfWsp7r4MKF2k",
    expert: "Murat Atasoy",
    price: "₺380,00",
    completedDay: "Dün",
  },
  {
    id: "p2",
    name: "Deniz Arslan",
    service: "Cilt Bakımı",
    time: "11:00",
    status: "confirmed",
    showActiveDot: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB5cFMAd99Go-AbrQy68MTiNXS5bxSFyMPCYfnO6VU2uUeFVKPXW3ydoleJoSOpeeqYzJEDac6U93HoNYgLukep7RAOq068cJACv8w52yqWi2fntN35DnI1yXbctyEmQpGvF5EtRXnEIJ3W4ex5ApmaEZ7hLkrIh8f2VJDCYNxLKmCPaEVCsjzBmZgSYEnNjnj54bwSoZqClpxqk5zBCUqpJMq4HV8NB-fGQ1eTL8aQoS0z-NFINJbZ4_8yw1-0iPQNrMYhIocGPs8",
    expert: "Ayşe Kaya",
    price: "₺520,00",
    completedDay: "Dün",
  },
  {
    id: "p3",
    name: "Cem Yücel",
    service: "Klasik Tıraş",
    time: "09:30",
    status: "confirmed",
    showActiveDot: false,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4c0XEUq-Q1S_EUfk5iy291p53yD_mo37wZ2y86Ibb42y-1T0tKoJA5KuWZqM1cqYfYFQZZlN6RX9YdCGljy53fvFteLj5Cqul4qJQ6wpTMoo7qVarDOglCzK0G2SHvMU5lQXWlvUz8jPZOXpdWJdoFVDwxaeduP8_1qar_B5mXfn3UR7OxoyGgGNTMOOKKjR9ujCnVtJ0HE-KqagUJr55O1ZiJaz43u1-sJboelic_MqNbl4Ifrvf6cwdg4JkOhnUp6RE6pgZ1as",
    expert: "Murat Atasoy",
    price: "₺290,00",
    completedDay: "2 gün önce",
  },
];

function filterByEmployee(list, employee) {
  if (!employee || employee === "Tümü") return list;
  return list.filter((item) => item.expert === employee);
}

function filterUpcomingByDate(list, dateFilter) {
  if (dateFilter === "Bugün") return list;
  if (dateFilter === "Yarın") return list.filter((item) => ["2", "3", "4"].includes(item.id));
  return list;
}

function StatusBadge({ status }) {
  const isConfirmed = status === "confirmed";
  return (
    <View style={[styles.statusPill, isConfirmed ? styles.statusConfirmed : styles.statusPending]}>
      <CustomText min bold color={isConfirmed ? ON_TERTIARY_CONTAINER : Colors.LightGray2}>
        {isConfirmed ? "Onaylandı" : "Beklemede"}
      </CustomText>
    </View>
  );
}

export default function Appointments() {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const [selected, setSelected] = useState(null);
  const [periodTab, setPeriodTab] = useState("upcoming");
  const [dateFilter, setDateFilter] = useState("Bugün");
  const [employeeFilter, setEmployeeFilter] = useState("Tümü");
  const [sortLabel, setSortLabel] = useState("En yakın saat");
  const [pickerKind, setPickerKind] = useState(null);

  const closeSheet = useCallback(() => setSelected(null), []);
  const closePicker = useCallback(() => setPickerKind(null), []);

  const filteredAppointments = useMemo(() => {
    const base = periodTab === "upcoming" ? UPCOMING_APPOINTMENTS : PAST_APPOINTMENTS;
    let list = filterByEmployee(base, employeeFilter);
    if (periodTab === "upcoming") {
      list = filterUpcomingByDate(list, dateFilter);
    }
    if (sortLabel === "Ada göre") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "tr"));
    } else {
      list = [...list].sort((a, b) => a.time.localeCompare(b.time));
    }
    return list;
  }, [periodTab, employeeFilter, dateFilter, sortLabel]);

  const subtitleText = useMemo(() => {
    if (periodTab === "past") {
      if (!filteredAppointments.length) {
        return "Bu filtrelere uygun geçmiş randevu bulunmuyor.";
      }
      return `Son dönemde ${filteredAppointments.length} tamamlanan randevu listeleniyor.`;
    }
    if (!filteredAppointments.length) {
      return `${dateFilter} için bu filtrelere uygun yaklaşan randevu yok.`;
    }
    return `${dateFilter} için ${filteredAppointments.length} yaklaşan randevunuz bulunuyor.`;
  }, [periodTab, filteredAppointments.length, dateFilter]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressed]}>
            <Ionicons name="menu" size={24} color={Colors.BrandPrimary} />
          </Pressable>
          <CustomText bold fontSize={20} color={Colors.BrandPrimary} style={styles.headerTitle}>
            BuRandevu
          </CustomText>
        </View>
        <Pressable style={({ pressed }) => [styles.headerAvatarBtn, pressed && styles.pressed]} onPress={() => router.push("/business/profil")}>
          <CustomImage uri={OWNER_AVATAR} style={styles.headerAvatar} contentFit="cover" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionIntro}>
          <CustomText light fontSize={34} color={Colors.BrandPrimary} style={styles.pageTitle}>
            Randevular
          </CustomText>
          <CustomText sm color={PALETTE.muted} style={styles.pageSubtitle}>
            {subtitleText}
          </CustomText>
        </View>

        <View style={styles.periodSegmentCard}>
          <View style={styles.periodSegment}>
            <Pressable style={({ pressed }) => [styles.periodTabBtn, periodTab === "upcoming" && styles.periodTabBtnActive, pressed && styles.pressed]} onPress={() => setPeriodTab("upcoming")}>
              <CustomText sm semibold color={periodTab === "upcoming" ? Colors.White : Colors.LightGray2}>
                Yaklaşan
              </CustomText>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.periodTabBtn, periodTab === "past" && styles.periodTabBtnActive, pressed && styles.pressed]} onPress={() => setPeriodTab("past")}>
              <CustomText sm semibold color={periodTab === "past" ? Colors.White : Colors.LightGray2}>
                Geçmiş
              </CustomText>
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterRowScroll}>
          {periodTab === "upcoming" ? (
            <Pressable style={({ pressed }) => [styles.filterPill, pressed && styles.pressed]} onPress={() => setPickerKind("date")}>
              <Ionicons name="calendar-outline" size={18} color={TERTIARY} />
              <View style={styles.filterPillTextCol}>
                <CustomText min bold color={Colors.BrandPrimary}>
                  Tarih
                </CustomText>
                <CustomText minx color={PALETTE.muted}>
                  {dateFilter}
                </CustomText>
              </View>
              <Ionicons name="chevron-down" size={16} color={Colors.LightGray2} />
            </Pressable>
          ) : null}

          <Pressable style={({ pressed }) => [styles.filterPill, pressed && styles.pressed]} onPress={() => setPickerKind("employee")}>
            <Ionicons name="id-card-outline" size={18} color={TERTIARY} />
            <View style={styles.filterPillTextCol}>
              <CustomText min bold color={Colors.BrandPrimary}>
                Çalışan
              </CustomText>
              <CustomText minx color={PALETTE.muted} numberOfLines={1}>
                {employeeFilter}
              </CustomText>
            </View>
            <Ionicons name="chevron-down" size={16} color={Colors.LightGray2} />
          </Pressable>

          <Pressable style={({ pressed }) => [styles.tuneFab, pressed && styles.pressed]} onPress={() => setPickerKind("tune")}>
            <Ionicons name="options-outline" size={22} color={Colors.White} />
          </Pressable>
        </ScrollView>

        <View style={styles.list}>
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={26} color={Colors.Gold} />
              </View>
              <CustomText semibold md color={Colors.BrandPrimary} style={styles.emptyTitle}>
                Randevu bulunamadı
              </CustomText>
              <CustomText xs color={PALETTE.muted} center style={styles.emptyHint}>
                Farklı bir tarih, çalışan veya sekme seçerek tekrar deneyin.
              </CustomText>
            </View>
          ) : (
            filteredAppointments.map((item) => (
              <Pressable key={item.id} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => setSelected(item)}>
                <View style={styles.cardRow}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatarWrap}>
                      <CustomImage uri={item.image} style={styles.avatar} contentFit="cover" />
                      {item.showActiveDot ? <View style={styles.activeDot} /> : null}
                    </View>
                    <View style={styles.cardTexts}>
                      <CustomText bold md color={Colors.BrandPrimary}>
                        {item.name}
                      </CustomText>
                      <CustomText xs semibold color={TERTIARY} style={styles.serviceLabel}>
                        {item.service.toUpperCase()}
                      </CustomText>
                      {item.completedDay ? (
                        <CustomText minx color={PALETTE.muted} style={styles.pastMeta}>
                          {item.completedDay}
                        </CustomText>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <CustomText bold lg color={Colors.BrandPrimary}>
                      {item.time}
                    </CustomText>
                    <StatusBadge status={item.status} />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide" statusBarTranslucent onRequestClose={closeSheet}>
        <View style={[styles.modalRoot, { paddingTop: Math.min(insets.top, 48) }]}>
          <Pressable style={styles.modalBackdrop} onPress={closeSheet} accessibilityRole="button" />
          <View
            style={[
              styles.sheet,
              {
                maxHeight: windowH * 0.88,
                paddingBottom: Math.max(insets.bottom, 20) + 8,
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <CustomText bold fontSize={28} color={Colors.BrandPrimary} style={styles.sheetTitle}>
                  Randevu Detayları
                </CustomText>
                <CustomText sm color={Colors.LightGray2} style={styles.sheetSubtitle}>
                  İşlem detaylarını aşağıdan yönetebilirsiniz.
                </CustomText>
              </View>
              <Pressable style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]} onPress={closeSheet} hitSlop={12}>
                <Ionicons name="close" size={22} color={Colors.BrandPrimary} />
              </Pressable>
            </View>

            {selected ? (
              <>
                <View style={styles.detailRows}>
                  <View style={styles.detailRow}>
                    <CustomText sm medium color={Colors.LightGray2}>
                      Müşteri
                    </CustomText>
                    <CustomText bold md color={Colors.BrandPrimary}>
                      {selected.name}
                    </CustomText>
                  </View>
                  <View style={styles.detailRow}>
                    <CustomText sm medium color={Colors.LightGray2}>
                      Hizmet
                    </CustomText>
                    <CustomText bold md color={Colors.BrandPrimary}>
                      {selected.service}
                    </CustomText>
                  </View>
                  <View style={styles.detailRow}>
                    <CustomText sm medium color={Colors.LightGray2}>
                      Uzman
                    </CustomText>
                    <CustomText bold md color={Colors.BrandPrimary}>
                      {selected.expert}
                    </CustomText>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowLast]}>
                    <CustomText sm medium color={Colors.LightGray2}>
                      Ücret
                    </CustomText>
                    <CustomText extraBold fontSize={26} color={TERTIARY}>
                      {selected.price}
                    </CustomText>
                  </View>
                </View>

                <View style={styles.sheetActions}>
                  <Pressable style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]} onPress={closeSheet}>
                    <CustomText bold lg color={Colors.White}>
                      Tamamlandı
                    </CustomText>
                  </Pressable>
                  <View style={styles.btnRow}>
                    <Pressable style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]} onPress={closeSheet}>
                      <CustomText semibold md color={Colors.BrandPrimary}>
                        Gelmedi
                      </CustomText>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.btnDanger, pressed && styles.pressed]} onPress={closeSheet}>
                      <CustomText semibold md color={ON_ERROR_CONTAINER}>
                        İptal
                      </CustomText>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={!!pickerKind} transparent animationType="fade" statusBarTranslucent onRequestClose={closePicker}>
        <View style={styles.pickerModalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closePicker} accessibilityRole="button" />
          <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
            <View style={styles.sheetHandle} />
            <CustomText bold fontSize={18} color={Colors.BrandPrimary} style={styles.pickerTitle}>
              {pickerKind === "date" ? "Tarih" : pickerKind === "employee" ? "Çalışan" : "Sıralama"}
            </CustomText>
            <CustomText sm color={PALETTE.muted} style={styles.pickerSubtitle}>
              {pickerKind === "tune" ? "Listeyi nasıl sıralamak istediğinizi seçin." : "Seçiminizi yapın; liste anında güncellenir."}
            </CustomText>

            <View style={styles.pickerList}>
              {pickerKind === "date"
                ? DATE_FILTER_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt}
                      style={({ pressed }) => [styles.pickerRow, dateFilter === opt && styles.pickerRowActive, pressed && styles.pressed]}
                      onPress={() => {
                        setDateFilter(opt);
                        closePicker();
                      }}
                    >
                      <CustomText semibold md color={Colors.BrandPrimary}>
                        {opt}
                      </CustomText>
                      {dateFilter === opt ? <Ionicons name="checkmark-circle" size={22} color={Colors.Gold} /> : null}
                    </Pressable>
                  ))
                : null}

              {pickerKind === "employee"
                ? EMPLOYEE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt}
                      style={({ pressed }) => [styles.pickerRow, employeeFilter === opt && styles.pickerRowActive, pressed && styles.pressed]}
                      onPress={() => {
                        setEmployeeFilter(opt);
                        closePicker();
                      }}
                    >
                      <CustomText semibold md color={Colors.BrandPrimary}>
                        {opt}
                      </CustomText>
                      {employeeFilter === opt ? <Ionicons name="checkmark-circle" size={22} color={Colors.Gold} /> : null}
                    </Pressable>
                  ))
                : null}

              {pickerKind === "tune"
                ? [
                    { key: "time", label: "En yakın saat" },
                    { key: "name", label: "Ada göre" },
                  ].map((opt) => (
                    <Pressable
                      key={opt.key}
                      style={({ pressed }) => [styles.pickerRow, sortLabel === opt.label && styles.pickerRowActive, pressed && styles.pressed]}
                      onPress={() => {
                        setSortLabel(opt.label);
                        closePicker();
                      }}
                    >
                      <CustomText semibold md color={Colors.BrandPrimary}>
                        {opt.label}
                      </CustomText>
                      {sortLabel === opt.label ? <Ionicons name="checkmark-circle" size={22} color={Colors.Gold} /> : null}
                    </Pressable>
                  ))
                : null}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 999,
  },
  headerAvatarBtn: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(196, 199, 199, 0.35)",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sectionIntro: {
    marginBottom: 20,
  },
  pageTitle: {
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  pageSubtitle: {
    lineHeight: 22,
  },
  periodSegmentCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  periodSegment: {
    flexDirection: "row",
    gap: 4,
  },
  periodTabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  periodTabBtnActive: {
    backgroundColor: Colors.BrandPrimary,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  filterRowScroll: {
    marginBottom: 20,
    marginHorizontal: -4,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  filterPillTextCol: {
    minWidth: 72,
    gap: 2,
  },
  tuneFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.Black,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  list: {
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 10,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 4,
  },
  emptyHint: {
    lineHeight: 18,
    maxWidth: 280,
  },
  pastMeta: {
    marginTop: 2,
  },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
    borderColor: "rgba(115, 92, 0, 0.2)",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(196, 199, 199, 0.35)",
  },
  activeDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: TERTIARY_CONTAINER,
    borderWidth: 2,
    borderColor: Colors.White,
  },
  cardTexts: {
    flex: 1,
    gap: 4,
  },
  serviceLabel: {
    letterSpacing: 2,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusConfirmed: {
    backgroundColor: TERTIARY_CONTAINER,
  },
  statusPending: {
    backgroundColor: SURFACE_HIGH,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    width: "100%",
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 8,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(196, 199, 199, 0.45)",
    alignSelf: "center",
    marginBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 12,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    marginTop: 4,
    lineHeight: 20,
  },
  closeBtn: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: SURFACE_HIGH,
  },
  detailRows: {
    marginBottom: 28,
    gap: 0,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(196, 199, 199, 0.35)",
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingTop: 12,
  },
  sheetActions: {
    gap: 14,
  },
  btnPrimary: {
    backgroundColor: Colors.Black,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: SURFACE_HIGH,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  btnDanger: {
    flex: 1,
    backgroundColor: ERROR_CONTAINER,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  pickerModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    width: "100%",
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 6,
    maxHeight: "55%",
  },
  pickerTitle: {
    marginBottom: 4,
  },
  pickerSubtitle: {
    marginBottom: 16,
    lineHeight: 20,
  },
  pickerList: {
    gap: 8,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: PALETTE.bg,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pickerRowActive: {
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: PALETTE.goldSoft,
  },
});
