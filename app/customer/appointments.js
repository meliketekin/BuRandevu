import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Calendar as RNCalendar, LocaleConfig } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import moment from "moment";
import "moment/locale/tr";

moment.locale("tr");

// Takvim için Türkçe locale ayarı
LocaleConfig.locales.tr = {
  monthNames: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  monthNamesShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  dayNames: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
  dayNamesShort: ["Pa", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
  today: "Bugün",
};
LocaleConfig.defaultLocale = "tr";

const MOCK_APPOINTMENTS = {
  "2026-03-10": [
    { id: "1", title: "Berber • Saç & Sakal", time: "10:00" },
    { id: "2", title: "Kuaför • Boya", time: "14:30" },
  ],
  "2026-03-12": [{ id: "3", title: "Nail Art • Bakım", time: "16:00" }],
};

const PALETTE = {
  primary: "#141414",
  primaryGold: "#D4AF37",
  backgroundLight: "#f7f7f7",
  backgroundDark: "#191919",
  white: "#FFFFFF",
  mutedText: "#7B7B7B",
  softBorder: "rgba(20,20,20,0.08)",
  softGold: "rgba(212,175,55,0.14)",
  darkGold: "#8B6B16",
};

export default function CustomerRandevular() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(null);
  const today = useMemo(() => new Date(), []);

  const formattedToday = today.toISOString().slice(0, 10);
  const currentSelected = selectedDate || formattedToday;

  const dayAppointments = MOCK_APPOINTMENTS[currentSelected] || [];
  const totalAppointments = useMemo(() => Object.values(MOCK_APPOINTMENTS).reduce((sum, items) => sum + items.length, 0), []);
  const monthLabel = moment(currentSelected).format("MMMM");
  const selectedDateText = moment(currentSelected).format("D MMMM YYYY");

  const renderHeader = (date) => {
    const dateValue = date?.toString?.() || date || today;
    const label = moment(dateValue).format("MMMM YYYY");

    return (
      <View style={styles.calendarHeaderRow}>
        <CustomText color={PALETTE.primary} headerx semibold>
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </CustomText>
      </View>
    );
  };

  const renderArrow = (direction) => (
    <View style={styles.calendarArrow}>
      <Ionicons name={direction === "left" ? "chevron-back" : "chevron-forward"} size={18} color={PALETTE.primary} />
    </View>
  );

  const renderDayItem = ({ date, state }) => {
    const isToday = date.dateString === formattedToday;
    const isSelected = date.dateString === currentSelected;
    const hasAppointment = !!MOCK_APPOINTMENTS[date.dateString];
    const isDisabled = state === "disabled";

    return (
      <CustomTouchableOpacity
        onPress={() => setSelectedDate(date.dateString)}
        style={[styles.dayWrapper, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday, isDisabled && styles.dayDisabled]}
      >
        <CustomText sm semibold color={isSelected ? PALETTE.white : isDisabled ? "#C7C7C7" : PALETTE.primary}>
          {date.day}
        </CustomText>
        {hasAppointment && <View style={[styles.dayDot, isSelected && styles.dayDotSelected, isDisabled && styles.dayDotDisabled]} />}
      </CustomTouchableOpacity>
    );
  };

  return (
    <LayoutView title="Randevularım" backgroundColor={PALETTE.backgroundLight} titleStyle={{ color: PALETTE.primary }}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          <View style={styles.calendarCard}>
            <View style={styles.sectionHeader}>
              <View>
                <CustomText color={PALETTE.primary} semibold style={styles.sectionTitle}>
                  Takvim gorunumu
                </CustomText>
                <CustomText xs color={PALETTE.mutedText} style={styles.sectionDescription}>
                  Isaretli gunlerde planlanmis randevularin bulunuyor.
                </CustomText>
              </View>
            </View>

            <RNCalendar
              firstDay={1}
              current={currentSelected}
              renderHeader={renderHeader}
              renderArrow={renderArrow}
              dayComponent={renderDayItem}
              hideExtraDays
              enableSwipeMonths
              theme={{
                calendarBackground: "transparent",
                textSectionTitleColor: PALETTE.mutedText,
                dayTextColor: PALETTE.primary,
                monthTextColor: PALETTE.primary,
                arrowColor: PALETTE.primary,
                textDayFontSize: 13,
                textMonthFontSize: 15,
                textDayHeaderFontSize: 11,
                textDayFontWeight: "600",
                textMonthFontWeight: "700",
                textDayHeaderFontWeight: "600",
              }}
              headerStyle={styles.calendarHeader}
              style={styles.calendar}
            />
          </View>

          <View style={styles.agendaCard}>
            <View style={styles.agendaHeader}>
              <View>
                <CustomText color={PALETTE.primary} semibold style={styles.sectionTitle}>
                  Gunluk randevular
                </CustomText>
                <CustomText xs color={PALETTE.mutedText} style={styles.sectionDescription}>
                  {selectedDateText}
                </CustomText>
              </View>

              <View style={styles.countBadge}>
                <CustomText xs semibold color={dayAppointments.length ? PALETTE.primaryGold : PALETTE.mutedText}>
                  {dayAppointments.length} kayit
                </CustomText>
              </View>
            </View>

            {dayAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="calendar-clear-outline" size={24} color={PALETTE.primaryGold} />
                </View>
                <CustomText sm color={PALETTE.primary} semibold style={styles.emptyTitle}>
                  Bu gun icin plan bulunmuyor
                </CustomText>
                <CustomText xs color={PALETTE.mutedText} center style={styles.emptyDescription}>
                  Farkli bir tarih secerek planli rezervasyonlarini inceleyebilirsin.
                </CustomText>
              </View>
            ) : (
              dayAppointments.map((item) => (
                <View key={item.id} style={styles.appointmentItem}>
                  <View style={styles.timeBadge}>
                    <CustomText xs semibold color={PALETTE.white}>
                      {item.time}
                    </CustomText>
                  </View>

                  <View style={styles.appointmentContent}>
                    <View style={styles.appointmentMetaRow}>
                      <View style={styles.appointmentDot} />
                      <CustomText xs semibold color={PALETTE.darkGold}>
                        Onaylandi
                      </CustomText>
                    </View>
                    <CustomText color={PALETTE.primary} semibold style={styles.appointmentTitle}>
                      {item.title}
                    </CustomText>
                    <CustomText xs color={PALETTE.mutedText}>
                      Hizmet saati {item.time} olarak planlandi.
                    </CustomText>
                  </View>

                  <View style={styles.arrowWrap}>
                    <Ionicons name="chevron-forward" size={18} color={PALETTE.primary} />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
  },
  container: {
    flex: 1,
    gap: 18,
    paddingBottom: 82,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    overflow: "hidden",
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.14)",
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(212,175,55,0.14)",
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 24,
    lineHeight: 32,
  },
  heroDescription: {
    marginTop: 10,
    lineHeight: 21,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroStatValue: {
    fontSize: 24,
    lineHeight: 30,
    marginTop: 4,
    marginBottom: 4,
  },
  calendarCard: {
    backgroundColor: PALETTE.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.softBorder,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  sectionDescription: {
    marginTop: 4,
    lineHeight: 18,
  },
  sectionPill: {
    backgroundColor: PALETTE.softGold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calendar: {
    backgroundColor: "transparent",
  },
  calendarHeader: {
    marginBottom: 10,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 2,
    paddingBottom: 8,
  },
  calendarArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.backgroundLight,
  },
  dayWrapper: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  dayDot: {
    position: "absolute",
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: PALETTE.primaryGold,
  },
  dayDotSelected: {
    backgroundColor: PALETTE.white,
  },
  dayDotDisabled: {
    opacity: 0.4,
  },
  daySelected: {
    backgroundColor: PALETTE.primary,
  },
  dayToday: {
    backgroundColor: PALETTE.softGold,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
  },
  dayDisabled: {
    opacity: 0.45,
  },
  agendaCard: {
    backgroundColor: PALETTE.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.softBorder,
  },
  agendaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  countBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: PALETTE.backgroundLight,
    borderWidth: 1,
    borderColor: PALETTE.softBorder,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.softGold,
    marginBottom: 14,
  },
  emptyTitle: {
    marginBottom: 6,
  },
  emptyDescription: {
    lineHeight: 18,
  },
  appointmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    backgroundColor: PALETTE.backgroundLight,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.05)",
    marginBottom: 12,
  },
  timeBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.primary,
    marginRight: 14,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  appointmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.primaryGold,
    marginRight: 8,
  },
  appointmentTitle: {
    marginBottom: 4,
    lineHeight: 22,
  },
  arrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.white,
  },
});
