import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const BASE = "#EBEBEB";
const HIGHLIGHT = "#F5F5F5";

const SkeletonBox = ({ style }) => {
  const translateX = useRef(new Animated.Value(-1)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, { toValue: 1, duration: 1100, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  const tx = translateX.interpolate({ inputRange: [-1, 1], outputRange: [-width, width] });

  return (
    <Animated.View style={[{ backgroundColor: BASE, overflow: "hidden" }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
        <LinearGradient
          colors={[BASE, HIGHLIGHT, HIGHLIGHT, BASE]}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
};

export default memo(SkeletonBox);
