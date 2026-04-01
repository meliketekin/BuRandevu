import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import LayoutView from "@/components/high-level/layout-view";
import { Colors } from "@/constants/colors";
import { EMPLOYEES } from "./employees-data";

function StatCard({ label, value, icon, highlighted }) {
  return (
    <View style={[styles.statCard, highlighted && styles.statCardHighlighted]}>
      <View style={[styles.statIconWrap, highlighted && styles.statIconWrapHighlighted]}>
        <Ionicons name={icon} size={18} color={highlighted ? Colors.Gold : Colors.BrandPrimary} />
      </View>

      <View style={styles.statTextWrap}>
        <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1}>
          {label}
        </CustomText>
        <CustomText extraBold fontSize={22} color={Colors.BrandPrimary}>
          {value}
        </CustomText>
      </View>
    </View>
  );
}

function ServiceCard({ item }) {
  return (
    <Pressable style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]} onPress={() => Alert.alert("Yakında", `${item.title} detayı daha sonra bağlanacak.`)}>
      <CustomText extraBold fontSize={16} color={Colors.White} style={styles.serviceTitle}>
        {item.title}
      </CustomText>

      <View style={styles.serviceFooter}>
        <View style={styles.serviceMeta}>
          <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.72)" />
          <CustomText medium fontSize={11} color="rgba(255,255,255,0.72)">
            {item.duration}
          </CustomText>
        </View>

        <View style={styles.servicePriceRow}>
          <CustomText extraBold fontSize={18} color={Colors.Gold}>
            {item.price}
          </CustomText>
          <View style={styles.serviceArrow}>
            <Ionicons name="chevron-forward" size={14} color={Colors.White} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function EmployeeDetail() {
  const { id } = useLocalSearchParams();
  const employeeId = Array.isArray(id) ? id[0] : id;

  const employee = useMemo(
    () => EMPLOYEES.find((item) => item.id === employeeId) ?? EMPLOYEES[0],
    [employeeId]
  );

  return (
    <LayoutView
      showBackButton
      title="Çalışan profili"
      paddingHorizontal={24}
      backgroundColor={Colors.BrandBackground}
      rightButton={
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: "/business/management/edit/[id]",
              params: { id: employee.id },
            })
          }
        >
          <Ionicons name="create-outline" size={20} color={Colors.BrandPrimary} />
        </Pressable>
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <CustomImage uri={employee.image} style={styles.avatar} contentFit="cover" />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.profileTopRow}>
                <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={1.2}>
                  {employee.role.toUpperCase()}
                </CustomText>

                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={11} color="#8C721E" />
                  <CustomText bold fontSize={11} color="#8C721E">
                    {employee.rating}
                  </CustomText>
                </View>
              </View>

              <CustomText extraBold fontSize={30} color={Colors.BrandPrimary} style={styles.profileName}>
                {employee.name}
              </CustomText>

              <View style={styles.availableRow}>
                <View style={styles.availableDot} />
                <CustomText bold fontSize={12} color="#10B981" letterSpacing={1}>
                  {employee.availability.toUpperCase()}
                </CustomText>
              </View>
            </View>
          </View>

          <View style={styles.bioSection}>
            <CustomText medium fontSize={14} color={Colors.LightGray2} style={styles.bioText}>
              {employee.bio}
            </CustomText>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color="rgba(107,107,107,0.75)" />
              <CustomText medium fontSize={12} color="rgba(107,107,107,0.9)" style={styles.locationText}>
                {employee.location}
              </CustomText>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="TOPLAM RANDEVU" value={employee.totalBookings} icon="calendar-clear-outline" />
          <StatCard label="TOPLAM CIRO" value={employee.totalRevenue} icon="wallet-outline" highlighted />
        </View>

        <View style={styles.servicesSection}>
          <View style={styles.sectionTitleRow}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={2}>
              ONE CIKAN HIZMETLER
            </CustomText>
            <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={1}>
              TUMUNU GOR
            </CustomText>
          </View>

          <View style={styles.servicesGrid}>
            {employee.services.map((item) => (
              <ServiceCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={2}>
              CALISMA SAATLERI
            </CustomText>
            <Ionicons name="time-outline" size={18} color={Colors.LightGray2} />
          </View>

          <View style={styles.hoursList}>
            {employee.workingHours.map((item, index) => (
              <View
                key={item.day}
                style={[
                  styles.hoursRow,
                  index < employee.workingHours.length - 1 && styles.hoursDivider,
                  item.closed && styles.hoursRowMuted,
                ]}
              >
                <CustomText bold fontSize={14} color={Colors.BrandPrimary}>
                  {item.day}
                </CustomText>
                <CustomText bold fontSize={item.closed ? 11 : 14} color={item.closed ? Colors.LightGray2 : Colors.BrandPrimary} letterSpacing={item.closed ? 1.5 : 0}>
                  {item.hours}
                </CustomText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.86)",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 18,
    paddingBottom: 120,
    gap: 28,
  },
  profileSection: {
    gap: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: Colors.White,
  },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: Colors.White,
  },
  profileInfo: {
    flex: 1,
    paddingTop: 4,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FAF3D9",
  },
  profileName: {
    lineHeight: 34,
    letterSpacing: -1,
  },
  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  bioSection: {
    gap: 8,
  },
  bioText: {
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    flex: 1,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.White,
    borderRadius: 18,
    padding: 18,
    minHeight: 128,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
    justifyContent: "space-between",
  },
  statCardHighlighted: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.Gold,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F1F1",
  },
  statIconWrapHighlighted: {
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  statTextWrap: {
    gap: 6,
  },
  servicesSection: {
    gap: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  serviceCard: {
    width: "47.8%",
    minHeight: 146,
    backgroundColor: Colors.BrandPrimary,
    borderRadius: 24,
    padding: 18,
    justifyContent: "space-between",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  serviceTitle: {
    lineHeight: 20,
  },
  serviceFooter: {
    gap: 8,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  servicePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  serviceArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  sectionCard: {
    backgroundColor: Colors.White,
    borderRadius: 18,
    padding: 24,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
    gap: 14,
  },
  hoursList: {
    gap: 0,
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 10,
  },
  hoursDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  hoursRowMuted: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
