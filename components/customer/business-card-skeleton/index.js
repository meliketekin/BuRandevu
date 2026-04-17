import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import SkeletonBox from "@/components/high-level/skeleton-box";

const BusinessCardSkeleton = () => (
  <View style={styles.card}>
    <SkeletonBox style={styles.image} />
    <View style={styles.content}>
      <SkeletonBox style={styles.title} />
      <SkeletonBox style={styles.titleShort} />
      <SkeletonBox style={styles.location} />
      <View style={styles.footer}>
        <View style={styles.avatars}>
          {[0, 1, 2].map((i) => (
            <SkeletonBox key={i} style={[styles.avatar, i > 0 && styles.avatarOverlap]} />
          ))}
        </View>
        <SkeletonBox style={styles.button} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F1F1F1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  image: { height: 170, width: "100%" },
  content: { padding: 16 },
  title: { height: 18, borderRadius: 6, width: "70%", marginBottom: 6 },
  titleShort: { height: 14, borderRadius: 6, width: "45%", marginBottom: 10 },
  location: { height: 13, borderRadius: 6, width: "55%" },
  footer: { marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatars: { flexDirection: "row" },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#fff" },
  avatarOverlap: { marginLeft: -8 },
  button: { height: 40, width: 118, borderRadius: 12 },
});

export default memo(BusinessCardSkeleton);
