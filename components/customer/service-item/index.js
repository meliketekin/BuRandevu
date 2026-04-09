import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import { Colors } from "@/constants/colors";

const CustomerServiceItem = ({ item, isLast, selected = false, onToggle }) => {
  return (
    <View style={[styles.container, !isLast && styles.withBorder]}>
      <View style={styles.content}>
        <CustomText semibold md color={Colors.BrandPrimary}>
          {item.title}
        </CustomText>
        <CustomText sm color={Colors.LightGray} style={styles.description}>
          {item.description}
        </CustomText>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={Colors.LightGray} />
          <CustomText xs semibold color={Colors.LightGray} style={styles.duration}>
            {item.duration}
          </CustomText>
        </View>
      </View>

      <View style={styles.side}>
        <CustomText bold md color={Colors.BrandPrimary}>
          {item.price}
        </CustomText>
        <CustomTouchableOpacity
          style={[styles.addButton, selected && styles.addButtonSelected]}
          activeOpacity={0.8}
          onPress={onToggle}
        >
          <Ionicons name={selected ? "checkmark" : "add"} size={18} color={selected ? Colors.White : Colors.BrandPrimary} />
        </CustomTouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 18,
    gap: 16,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  content: {
    flex: 1,
  },
  description: {
    marginTop: 5,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  duration: {
    marginLeft: 6,
  },
  side: {
    alignItems: "flex-end",
    gap: 10,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.White,
  },
  addButtonSelected: {
    backgroundColor: Colors.BrandPrimary,
    borderColor: Colors.BrandPrimary,
  },
});

export default memo(CustomerServiceItem);
