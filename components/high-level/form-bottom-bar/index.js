import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import CustomButton from "@/components/high-level/custom-button";

/**
 * Formların altında sabit duran kaydet/gönder çubuğu.
 *
 * Props:
 *   label        string                  – buton metni (default: "Kaydet")
 *   onPress      () => void
 *   loading      boolean                 – yüklenme durumu
 *   disabled     boolean
 *   icon         string | null           – Ionicons adı (default: "checkmark")
 *                                          null geçilirse ikon gizlenir
 *   style        ViewStyle               – dış wrapper'a ek stil
 */
const FormBottomBar = ({ label = "Kaydet", onPress, loading = false, disabled = false, icon = "checkmark", style }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 18 }, style]}>
      <CustomButton
        title={label}
        onPress={onPress}
        loading={loading}
        disabled={disabled || loading}
        marginTop={0}
        height={64}
        borderRadius={16}
        backgroundColor={Colors.BrandPrimary}
        titleStyle={styles.buttonTitle}
        rightIcon={icon ? <Ionicons name={icon} size={20} color={Colors.White} style={styles.buttonIcon} /> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: 24,
    backgroundColor: "rgba(247,247,247,0.96)",
  },
  buttonTitle: {
    fontFamily: "Urbanist_800ExtraBold",
    fontSize: 17,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default memo(FormBottomBar);
