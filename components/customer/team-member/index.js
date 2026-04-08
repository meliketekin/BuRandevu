import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const CustomerTeamMember = ({ member }) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: member.imageUri }} style={styles.avatar} resizeMode="cover" />
        {member.active ? <View style={styles.activeDot} /> : null}
      </View>
      <CustomText semibold xs center color={Colors.BrandPrimary} numberOfLines={1} style={styles.name}>
        {member.name}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 76,
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.White,
    backgroundColor: "#E5E7EB",
  },
  activeDot: {
    position: "absolute",
    right: 2,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.Green,
    borderWidth: 2,
    borderColor: Colors.White,
  },
  name: {
    width: "100%",
    marginTop: 8,
  },
});

export default memo(CustomerTeamMember);
