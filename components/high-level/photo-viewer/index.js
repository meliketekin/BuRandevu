import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Modal, Pressable, StatusBar, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 10;
const MAX_SCALE = 5;

function ZoomableImage({ uri, onClose, bgOpacity }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const swipeY = useSharedValue(0);

  function resetZoom() {
    "worklet";
    scale.value = withSpring(1);
    offsetX.value = withSpring(0);
    offsetY.value = withSpring(0);
    savedScale.value = 1;
    startX.value = 0;
    startY.value = 0;
  }

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value < 1.05) {
        resetZoom();
      } else {
        savedScale.value = scale.value;
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > 1) {
        resetZoom();
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  // Yatay swipe'ı FlatList'e bırak; dikey swipe'ı yakala
  const pan = Gesture.Pan()
    .activeOffsetY([8, SCREEN_HEIGHT])   // dikey 8px'den sonra aktif olur
    .failOffsetX([-20, 20])              // yatay 20px aşılırsa gesture fail → FlatList devralır
    .onStart(() => {
      startX.value = offsetX.value;
      startY.value = offsetY.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1.05) {
        // Zoom'luyken görüntüyü pan et
        offsetX.value = startX.value + e.translationX;
        offsetY.value = startY.value + e.translationY;
      } else if (e.translationY > 0) {
        // Aşağı swipe: görseli taşı ve arka planı soldur
        swipeY.value = e.translationY;
        bgOpacity.value = Math.max(0.3, 1 - e.translationY / (SCREEN_HEIGHT * 0.5));
      }
    })
    .onEnd(() => {
      if (scale.value > 1.05) {
        startX.value = offsetX.value;
        startY.value = offsetY.value;
      } else if (swipeY.value > CLOSE_THRESHOLD) {
        swipeY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        swipeY.value = withSpring(0);
        bgOpacity.value = withSpring(1);
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan);
  const all = Gesture.Exclusive(doubleTap, composed);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  const pageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: swipeY.value }],
  }));

  return (
    <GestureDetector gesture={all}>
      <Animated.View style={[styles.page, pageStyle]}>
        <Animated.View style={imageStyle}>
          <CustomImage uri={uri} style={styles.image} contentFit="contain" />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function PhotoViewer({ photos, initialIndex, onClose }) {
  const flatRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Tek backdrop, PhotoViewer seviyesinde; ZoomableImage günceller
  const bgOpacity = useSharedValue(1);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={styles.root}>
        {/* Tek, global backdrop */}
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, bgStyle]} />

        <FlatList
          ref={flatRef}
          data={photos}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <ZoomableImage uri={item} onClose={onClose} bgOpacity={bgOpacity} />
          )}
        />

        <Pressable style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} onPress={onClose}>
          <Ionicons name="close" size={22} color={Colors.White} />
        </Pressable>

        {photos.length > 1 && (
          <View style={styles.counter}>
            <CustomText bold fontSize={13} color={Colors.White}>
              {currentIndex + 1} / {photos.length}
            </CustomText>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.96)",
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  closeButton: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  pressed: { opacity: 0.7 },
});

export default React.memo(PhotoViewer);
