import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { Easing } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

/**
 * CustomModal — SelectModal ile aynı overlay/animasyon sistemini kullanan
 * yeniden kullanılabilir bottom-sheet modal.
 *
 * Props:
 *   visible      boolean           — modal açık mı
 *   onClose      () => void        — kapatma isteği
 *   title        string            — başlık (opsiyonel)
 *   maxHeight    number | string   — sheet max yüksekliği (default: "85%")
 *   children     ReactNode
 */
const CustomModal = ({ visible, onClose, title, maxHeight = "85%", children }) => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(600)).current;

  // visible true olduğunda mount et ve aç
  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  // mount olduktan sonra açılış animasyonu
  useEffect(() => {
    if (!mounted) return;
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 340,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [mounted]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 600,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      setMounted(false);
      onClose?.();
    });
  }, [onClose]);

  // visible dışarıdan false yapılırsa kapat
  useEffect(() => {
    if (!visible && mounted) {
      handleClose();
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.root}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight, paddingBottom: Math.max(insets.bottom, 16) + 8, transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.handle} />

          {(title != null) && (
            <View style={styles.header}>
              <CustomText extraBold fontSize={20} color={Colors.BrandPrimary} style={styles.headerTitle}>
                {title}
              </CustomText>
              <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={Colors.LightGray2} />
              </Pressable>
            </View>
          )}

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  sheet: {
    backgroundColor: Colors.White,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(20,20,20,0.12)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
});
