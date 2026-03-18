import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Calendar as RNCalendar, LocaleConfig } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import LayoutView from "@/components/high-level/layout-view";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
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

export default function CustomerRandevular() {
  const [selectedDate, setSelectedDate] = useState(null);
  const today = useMemo(() => new Date(), []);

  const formattedToday = today.toISOString().slice(0, 10);
  const currentSelected = selectedDate || formattedToday;

  const markedDates = useMemo(() => {
    const marks = {};

    Object.keys(MOCK_APPOINTMENTS).forEach((dateKey) => {
      marks[dateKey] = {
        marked: true,
        dotColor: Colors.BrandPrimary,
      };
    });

    marks[currentSelected] = {
      ...(marks[currentSelected] || {}),
      selected: true,
      selectedColor: Colors.BrandPrimary,
      selectedTextColor: Colors.White,
    };

    return marks;
  }, [currentSelected]);

  const dayAppointments = MOCK_APPOINTMENTS[currentSelected] || [];

  const renderHeader = (date) => {
    const d = date?.toString() ? new Date(date) : today;
    const month = d.toLocaleString("tr-TR", { month: "long" });
    const year = d.getFullYear();

    return (
      <View style={styles.headerRow}>
        <CustomText color={Colors.BrandDark} headerx semibold>
          {month.charAt(0).toUpperCase() + month.slice(1)} {year}
        </CustomText>
      </View>
    );
  };

  const renderArrow = (direction) => <Ionicons name={direction === "left" ? "chevron-back" : "chevron-forward"} size={20} color={Colors.BrandDark} />;

  const renderDayItem = ({ date, state }) => {
    const isToday = date.dateString === formattedToday;
    const isSelected = date.dateString === currentSelected;
    const hasAppointment = !!MOCK_APPOINTMENTS[date.dateString];

    return (
      <CustomTouchableOpacity onPress={() => setSelectedDate(date.dateString)} style={[styles.dayWrapper, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday]}>
        <CustomText sm color={isSelected ? Colors.White : state === "disabled" ? Colors.LightGray : Colors.BrandDark}>
          {date.day}
        </CustomText>
        {hasAppointment && <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />}
      </CustomTouchableOpacity>
    );
  };

  return (
    <LayoutView title="Randevularım">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <CustomText sm color={Colors.LightGray} marginBottom>
            Tarihe tıklayarak randevularını görüntüleyebilirsin.
          </CustomText>

          <RNCalendar
            firstDay={1}
            renderHeader={renderHeader}
            renderArrow={renderArrow}
            dayComponent={renderDayItem}
            hideExtraDays={true}
            theme={{
              calendarBackground: "transparent",
              monthTextColor: Colors.LightGray,
              textSectionTitleColor: Colors.LightGray,
              todayTextColor: Colors.BrandPrimary,
              selectedDayBackgroundColor: Colors.BrandPrimary,
              selectedDayTextColor: Colors.White,
              arrowColor: Colors.BrandDark,
            }}
            headerStyle={styles.calendarHeader}
            style={styles.calendar}
          />

          <View style={styles.appointmentsCard}>
            <CustomText sm color={Colors.BrandDark} semibold style={styles.appointmentsTitle}>
              {moment(currentSelected).format("D MMMM YYYY")} randevuları
            </CustomText>

            {dayAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={26} color={Colors.LightGray} style={{ marginBottom: 4 }} />
                <CustomText xs color={Colors.LightGray}>
                  Seçili gün için randevun bulunmuyor.
                </CustomText>
              </View>
            ) : (
              dayAppointments.map((item) => (
                <View key={item.id} style={styles.appointmentRow}>
                  <View style={styles.appointmentIconWrap}>
                    <Ionicons name="time-outline" size={18} color={Colors.BrandPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText sm color={Colors.BrandDark} semibold>
                      {item.title}
                    </CustomText>
                    <CustomText xs color={Colors.LightGray} marginTopText>
                      {item.time}
                    </CustomText>
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
    paddingTop: 10,
    paddingBottom: 24,
  },
  container: {
    flex: 1,
  },
  headerTextBlock: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  calendar: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.BrandBackground,
    marginBottom: 16,
  },
  calendarHeader: {
    backgroundColor: "#DDE3FF",
    marginHorizontal: -10,
    paddingBottom: 4,
  },
  dayWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDot: {
    position: "absolute",
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.BrandPrimary,
  },
  dayDotSelected: {
    backgroundColor: Colors.White,
  },
  daySelected: {
    backgroundColor: Colors.BrandPrimary,
  },
  dayToday: {
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: Colors.BrandPrimary,
  },
  appointmentsCard: {
    paddingTop: 12,
    flex: 1,
  },
  appointmentsTitle: {
    marginBottom: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderColor,
  },
  appointmentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BrandBackground,
    marginRight: 10,
  },
});
