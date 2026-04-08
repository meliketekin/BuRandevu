import React, { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LayoutView from "@/components/high-level/layout-view";
import CustomButton from "@/components/high-level/custom-button";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import { BUSINESS_ITEMS } from "@/constants/customer-businesses";
import { Colors } from "@/constants/colors";

const DEFAULT_SLOTS = {
  morning: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
  afternoon: ["01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"],
};

const WEEKDAY_LABELS = ["Paz", "Pzt", "Sal", "Car", "Per", "Cum", "Cmt"];
const MONTH_LABELS = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"];

const buildDateOptions = () => {
  const startDate = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      id: date.toISOString(),
      date,
      dayLabel: WEEKDAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
      disabled: index === 5,
    };
  });
};

const CreateAppointment = () => {
  const insets = useSafeAreaInsets();
  const { id, serviceCategory, serviceId } = useLocalSearchParams();

  const businessId = Array.isArray(id) ? id[0] : id;
  const categoryId = Array.isArray(serviceCategory) ? serviceCategory[0] : serviceCategory;
  const selectedServiceId = Array.isArray(serviceId) ? serviceId[0] : serviceId;

  const business = useMemo(() => BUSINESS_ITEMS.find((item) => item.id === businessId) ?? BUSINESS_ITEMS[0], [businessId]);
  const serviceList = business.services?.[categoryId] ?? Object.values(business.services ?? {}).flat();
  const service = useMemo(() => serviceList.find((item) => item.id === selectedServiceId) ?? serviceList[0], [selectedServiceId, serviceList]);
  const employeeName = business.team?.[0]?.name ?? "Uzman";
  const dateOptions = useMemo(() => buildDateOptions(), []);

  const [selectedDateId, setSelectedDateId] = useState(dateOptions[2]?.id ?? dateOptions[0]?.id);
  const [selectedTime, setSelectedTime] = useState(DEFAULT_SLOTS.morning[4]);

  const activeDate = dateOptions.find((item) => item.id === selectedDateId) ?? dateOptions[0];
  const monthTitle = `${MONTH_LABELS[activeDate.date.getMonth()]} ${activeDate.date.getFullYear()}`;

  return (
    <LayoutView showBackButton title="Select Time" paddingHorizontal={0}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.serviceInfoSection}>
          <View style={styles.serviceInfoRow}>
            <Image source={{ uri: business.imageUri }} style={styles.serviceImage} resizeMode="cover" />

            <View style={styles.serviceInfoText}>
              <CustomText bold lg color={Colors.BrandPrimary} numberOfLines={1}>
                {service?.title ?? "Premium Service"}
              </CustomText>
              <CustomText sm color={Colors.LightGray}>
                with {employeeName}
              </CustomText>
              <CustomText sm color={Colors.LightGray} style={styles.serviceMeta}>
                {service?.duration ?? "60 dk"} • {service?.price ?? "$65.00"}
              </CustomText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.monthHeader}>
            <CustomText bold xlg color={Colors.BrandPrimary}>
              {monthTitle}
            </CustomText>
            <View style={styles.monthActions}>
              <CustomTouchableOpacity style={styles.monthButton} activeOpacity={0.8}>
                <Ionicons name="chevron-back" size={18} color={Colors.LightGray} />
              </CustomTouchableOpacity>
              <CustomTouchableOpacity style={styles.monthButton} activeOpacity={0.8}>
                <Ionicons name="chevron-forward" size={18} color={Colors.BrandPrimary} />
              </CustomTouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
            {dateOptions.map((item) => {
              const isSelected = item.id === selectedDateId;

              return (
                <CustomTouchableOpacity
                  key={item.id}
                  style={[
                    styles.dateCard,
                    isSelected && styles.dateCardActive,
                    item.disabled && styles.dateCardDisabled,
                  ]}
                  activeOpacity={0.9}
                  disabled={item.disabled}
                  onPress={() => setSelectedDateId(item.id)}
                >
                  <CustomText xs semibold color={isSelected ? Colors.White : item.disabled ? "#C4C8CC" : Colors.LightGray}>
                    {item.dayLabel}
                  </CustomText>
                  <CustomText bold xlg color={isSelected ? Colors.BrandGold : item.disabled ? "#C4C8CC" : Colors.BrandPrimary} style={styles.dateNumber}>
                    {item.dayNumber}
                  </CustomText>
                  {isSelected ? <View style={styles.dateDot} /> : null}
                </CustomTouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.slotsSection}>
          <CustomText semibold md color={Colors.BrandPrimary} style={styles.slotHeader}>
            Morning
          </CustomText>
          <View style={styles.slotGrid}>
            {DEFAULT_SLOTS.morning.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <CustomTouchableOpacity key={slot} style={[styles.timeSlot, isSelected && styles.timeSlotActive]} activeOpacity={0.9} onPress={() => setSelectedTime(slot)}>
                  <CustomText semibold sm color={isSelected ? Colors.BrandGold : Colors.BrandPrimary}>
                    {slot}
                  </CustomText>
                </CustomTouchableOpacity>
              );
            })}
          </View>

          <CustomText semibold md color={Colors.BrandPrimary} style={styles.slotHeader}>
            Afternoon
          </CustomText>
          <View style={styles.slotGrid}>
            {DEFAULT_SLOTS.afternoon.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <CustomTouchableOpacity key={slot} style={[styles.timeSlot, isSelected && styles.timeSlotActive]} activeOpacity={0.9} onPress={() => setSelectedTime(slot)}>
                  <CustomText semibold sm color={isSelected ? Colors.BrandGold : Colors.BrandPrimary}>
                    {slot}
                  </CustomText>
                </CustomTouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.confirmSection}>
          <CustomButton
            title="Confirm Booking"
            onPress={() => {}}
            marginTop={0}
            height={56}
            borderRadius={999}
            backgroundColor={Colors.BrandPrimary}
            style={styles.confirmButton}
          />
        </View>
      </ScrollView>
    </LayoutView>
  );
};

export default CreateAppointment;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: 6,
  },
  serviceInfoSection: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 14,
  },
  serviceInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    marginRight: 14,
  },
  serviceInfoText: {
    flex: 1,
  },
  serviceMeta: {
    marginTop: 2,
  },
  section: {
    marginBottom: 26,
  },
  monthHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
  },
  dateList: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 2,
  },
  dateCard: {
    width: 72,
    height: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: Colors.White,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCardActive: {
    backgroundColor: Colors.BrandPrimary,
    borderColor: Colors.BrandPrimary,
    transform: [{ scale: 1.05 }],
  },
  dateCardDisabled: {
    backgroundColor: "#FAFAFA",
    borderColor: "#F3F4F6",
    opacity: 0.6,
  },
  dateNumber: {
    marginTop: 4,
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.BrandGold,
    marginTop: 6,
  },
  slotsSection: {
    paddingHorizontal: 24,
  },
  slotHeader: {
    marginBottom: 14,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 26,
  },
  timeSlot: {
    width: "31%",
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: Colors.White,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  timeSlotActive: {
    backgroundColor: Colors.BrandPrimary,
    borderColor: Colors.BrandPrimary,
  },
  confirmSection: {
    paddingHorizontal: 24,
    marginTop: 4,
  },
  confirmButton: {
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
});
