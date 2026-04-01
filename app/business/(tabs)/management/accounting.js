import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import { EMPLOYEES } from "./employees-data";

const DAILY_SERIES = {
  label: "GUNLUK CIRO",
  total: 142850,
  comparisonLabel: "vs gecen ay",
  change: "+12.5%",
  bars: [40, 65, 55, 90, 75, 60, 45],
  labels: ["PZT", "SAL", "CAR", "PER", "CUM", "CMT", "PAZ"],
  tooltipIndex: 4,
  tooltipValue: 22000,
};

const MONTHLY_SERIES = {
  label: "AYLIK CIRO",
  total: 584000,
  comparisonLabel: "vs onceki ay",
  change: "+8.3%",
  bars: [46, 58, 70, 64, 88, 76, 82],
  labels: ["OCA", "SUB", "MAR", "NIS", "MAY", "HAZ", "TEM"],
  tooltipIndex: 4,
  tooltipValue: 96000,
};

const PAYOUTS_TOTAL = 12400;
const EXPENSES_TOTAL = 4800;

function parseRevenue(value) {
  if (!value) return 0;
  const normalized = value.replace("₺", "").trim();

  if (normalized.toLowerCase().endsWith("k")) {
    return Math.round(parseFloat(normalized.slice(0, -1).replace(",", ".")) * 1000) || 0;
  }

  return Number(normalized.replace(/\./g, "").replace(/,/g, "")) || 0;
}

function formatCurrency(value) {
  return `₺${value.toLocaleString("tr-TR")}`;
}

function getInitials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function SegmentedButton({ active, label, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.segmentButton, active && styles.segmentButtonActive, pressed && styles.pressed]} onPress={onPress}>
      <CustomText
        bold
        fontSize={11}
        color={active ? Colors.White : Colors.LightGray2}
        letterSpacing={0.8}
        style={styles.segmentLabel}
      >
        {label}
      </CustomText>
    </Pressable>
  );
}

function EmployeeEarningCard({ employee }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.employeeCard, pressed && styles.pressed]}
      onPress={() =>
        router.push({
          pathname: "/business/management/[id]",
          params: { id: employee.id },
        })
      }
    >
      <View style={styles.employeeLeft}>
        <CustomImage uri={employee.image} style={styles.employeeImage} contentFit="cover" />
        <View style={styles.employeeTextWrap}>
          <CustomText bold fontSize={15} color={Colors.BrandPrimary}>
            {employee.name}
          </CustomText>
          <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.1}>
            {employee.role.toUpperCase()}
          </CustomText>
        </View>
      </View>

      <View style={styles.employeeRight}>
        <CustomText extraBold fontSize={16} color={Colors.Gold}>
          {employee.totalRevenue}
        </CustomText>
        <CustomText bold fontSize={10} color="#10B981" letterSpacing={0.6}>
          {employee.completedThisWeek} GOREV TAMAMLANDI
        </CustomText>
      </View>
    </Pressable>
  );
}

function SummaryCard({ dark, icon, label, value }) {
  return (
    <View style={[styles.summaryCard, dark ? styles.summaryCardDark : styles.summaryCardLight]}>
      <View style={[styles.summaryIconWrap, dark ? styles.summaryIconWrapDark : styles.summaryIconWrapLight]}>
        <Ionicons name={icon} size={20} color={Colors.Gold} />
      </View>

      <View style={styles.summaryTextWrap}>
        <CustomText
          bold
          fontSize={10}
          color={dark ? "rgba(255,255,255,0.56)" : Colors.LightGray2}
          letterSpacing={1.2}
        >
          {label}
        </CustomText>
        <CustomText extraBold fontSize={28} color={dark ? Colors.White : Colors.BrandPrimary} style={styles.summaryValue}>
          {value}
        </CustomText>
      </View>
    </View>
  );
}

export default function AccountingScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState("daily");

  const chartData = mode === "daily" ? DAILY_SERIES : MONTHLY_SERIES;

  const topEmployees = useMemo(
    () =>
      [...EMPLOYEES]
        .sort((a, b) => parseRevenue(b.totalRevenue) - parseRevenue(a.totalRevenue))
        .slice(0, 3),
    []
  );

  const netIncome = useMemo(() => formatCurrency(chartData.total - PAYOUTS_TOTAL - EXPENSES_TOTAL), [chartData.total]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.BrandPrimary} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <CustomText extraBold fontSize={22} color={Colors.BrandPrimary} style={styles.headerTitle}>
              Muhasebe
            </CustomText>
            <CustomText semibold fontSize={11} color={Colors.LightGray2}>
              Gelir ve ekip performansi
            </CustomText>
          </View>

          <View style={styles.avatarButton}>
            <CustomText bold fontSize={12} color={Colors.BrandPrimary}>
              {getInitials("Bu Randevu")}
            </CustomText>
          </View>
        </View>

        <View style={styles.revenueCard}>
          <View style={styles.revenueTopRow}>
            <CustomText bold fontSize={12} color={Colors.LightGray2} letterSpacing={1.8}>
              {chartData.label}
            </CustomText>

            <View style={styles.segmentWrap}>
              <SegmentedButton active={mode === "daily"} label="Gunluk" onPress={() => setMode("daily")} />
              <SegmentedButton active={mode === "monthly"} label="Aylik" onPress={() => setMode("monthly")} />
            </View>
          </View>

          <View style={styles.revenueValueWrap}>
            <CustomText extraBold fontSize={42} color={Colors.Gold} style={styles.revenueValue}>
              {formatCurrency(chartData.total)}
            </CustomText>

            <View style={styles.revenueMetaRow}>
              <View style={styles.trendBadge}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <CustomText bold fontSize={11} color="#10B981">
                  {chartData.change}
                </CustomText>
              </View>

              <CustomText bold fontSize={11} color={Colors.LightGray2} letterSpacing={0.6}>
                {chartData.comparisonLabel.toUpperCase()}
              </CustomText>
            </View>
          </View>

          <View style={styles.chartWrap}>
            {chartData.bars.map((height, index) => {
              const active = index === chartData.tooltipIndex;
              return (
                <View key={`${mode}-${chartData.labels[index]}`} style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${height}%` },
                      active ? styles.chartBarActive : styles.chartBarMuted,
                    ]}
                  >
                    {active ? (
                      <View style={styles.chartTooltip}>
                        <CustomText bold fontSize={10} color={Colors.White}>
                          {formatCurrency(chartData.tooltipValue)}
                        </CustomText>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.chartLabelsRow}>
            {chartData.labels.map((label, index) => {
              const active = index === chartData.tooltipIndex;
              return (
                <CustomText
                  key={`${mode}-${label}-label`}
                  bold
                  fontSize={10}
                  color={active ? Colors.Gold : "rgba(80,83,89,0.74)"}
                  style={styles.chartLabel}
                >
                  {label}
                </CustomText>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <CustomText extraBold fontSize={22} color={Colors.BrandPrimary}>
            Personel Kazanclari
          </CustomText>

          <Pressable style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]} onPress={() => router.push("/business/management/employees")}>
            <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={1.1}>
              TUMUNU GOR
            </CustomText>
            <Ionicons name="chevron-forward" size={14} color={Colors.Gold} />
          </Pressable>
        </View>

        <View style={styles.employeeList}>
          {topEmployees.map((employee) => (
            <EmployeeEarningCard key={employee.id} employee={employee} />
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryHeaderWrap}>
          <CustomText bold fontSize={13} color={Colors.LightGray2} letterSpacing={1.5}>
            FINANCIAL SUMMARY
          </CustomText>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard dark icon="cash-outline" label="ODEMELER" value={formatCurrency(PAYOUTS_TOTAL)} />
          <SummaryCard icon="receipt-outline" label="GIDERLER" value={formatCurrency(EXPENSES_TOTAL)} />
        </View>

        <Pressable style={({ pressed }) => [styles.netIncomeCard, pressed && styles.pressed]} onPress={() => Alert.alert("Net Bakiye", `${mode === "daily" ? "Gunluk" : "Aylik"} net bakiye: ${netIncome}`)}>
          <View style={styles.netIncomeTextWrap}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.3}>
              NET BAKIYE
            </CustomText>
            <CustomText extraBold fontSize={28} color={Colors.BrandPrimary}>
              {netIncome}
            </CustomText>
          </View>

          <View style={styles.netIncomeAction}>
            <Ionicons name="stats-chart-outline" size={18} color={Colors.BrandPrimary} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BrandBackground,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.05)",
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    letterSpacing: -0.7,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  revenueCard: {
    backgroundColor: Colors.White,
    borderRadius: 26,
    padding: 22,
    gap: 18,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 4,
  },
  revenueTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  segmentWrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  segmentButton: {
    minWidth: 78,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {
    backgroundColor: Colors.BrandPrimary,
  },
  segmentLabel: {
    textTransform: "uppercase",
  },
  revenueValueWrap: {
    gap: 10,
  },
  revenueValue: {
    letterSpacing: -1.4,
    lineHeight: 46,
  },
  revenueMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  chartWrap: {
    height: 190,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 18,
  },
  chartColumn: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  chartBar: {
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: "relative",
  },
  chartBarMuted: {
    backgroundColor: "#E8EAED",
  },
  chartBarActive: {
    backgroundColor: Colors.Gold,
    shadowColor: Colors.Gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  chartTooltip: {
    position: "absolute",
    top: -36,
    alignSelf: "center",
    backgroundColor: Colors.BrandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chartLabelsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
    paddingTop: 14,
    gap: 10,
  },
  chartLabel: {
    flex: 1,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(229,229,229,0.8)",
    marginVertical: 24,
    marginHorizontal: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
  },
  employeeList: {
    gap: 12,
  },
  employeeCard: {
    backgroundColor: Colors.White,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  employeeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  employeeImage: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  employeeTextWrap: {
    flex: 1,
    gap: 4,
  },
  employeeRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  summaryHeaderWrap: {
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    minHeight: 146,
    justifyContent: "space-between",
  },
  summaryCardDark: {
    backgroundColor: Colors.BrandPrimary,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 5,
  },
  summaryCardLight: {
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: "rgba(229,229,229,0.8)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryIconWrapDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  summaryIconWrapLight: {
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  summaryTextWrap: {
    gap: 8,
  },
  summaryValue: {
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  netIncomeCard: {
    marginTop: 14,
    backgroundColor: Colors.White,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(229,229,229,0.8)",
  },
  netIncomeTextWrap: {
    gap: 8,
    flex: 1,
  },
  netIncomeAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
