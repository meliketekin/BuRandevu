import { Colors } from "@/constants/colors";
import { DEFAULT_FORM_CONTROL_HEIGHT } from "@/constants/form-field";
import general from "@/utils/general";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Easing } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { openModal } from "@/components/high-level/modal-renderer";
import { ModalTypeEnum } from "@/enums/modal-type-enum";
import CustomText from "@/components/high-level/custom-text";

const CustomSelect = ({
  label = "",
  value,
  placeholder = "",
  onPress,
  /** Geçilirse onPress yerine otomatik olarak SelectModal açılır */
  selectModalProps,
  error,
  style,
  required = false,
  disabled = false,
  isClearable = false,
  onClear,
  noIcon = false,
  height,
  duration = 300,
  backgroundColor,
  borderColor,
}) => {
  const hasValue = !general.isNullOrEmpty(value);

  const resolvedHeight = useMemo(() => height ?? DEFAULT_FORM_CONTROL_HEIGHT, [height]);

  const APPROX_LABEL_LINE_HEIGHT = 22;
  const idleTranslateY = useMemo(() => Math.max(0, Math.round((resolvedHeight - APPROX_LABEL_LINE_HEIGHT) / 2)), [resolvedHeight]);

  const transY = useRef(new Animated.Value(hasValue ? 8 : idleTranslateY));
  const fontSizeValue = useRef(new Animated.Value(hasValue ? 12 : 16));

  const fontFamily = "Urbanist_400Regular";

  const animateTransform = useCallback(
    (toValue) => {
      Animated.timing(transY.current, {
        toValue,
        duration,
        useNativeDriver: true,
        easing: Easing.ease,
      }).start();
    },
    [duration],
  );

  const animateFontSize = useCallback(
    (toValue) => {
      Animated.timing(fontSizeValue.current, {
        toValue,
        duration,
        useNativeDriver: false,
        easing: Easing.ease,
      }).start();
    },
    [duration],
  );

  useEffect(() => {
    if (hasValue) {
      animateTransform(8);
      animateFontSize(12);
    } else {
      animateTransform(idleTranslateY);
      animateFontSize(16);
    }
  }, [hasValue, idleTranslateY]);

  const rowPaddingRight = useMemo(() => {
    const inset = 15;
    const chevron = noIcon ? 0 : 16;
    const gap = !noIcon && hasValue && isClearable ? 8 : 0;
    const clearBtn = hasValue && isClearable ? 18 : 0;
    return inset + chevron + gap + clearBtn;
  }, [noIcon, hasValue, isClearable]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          borderColor: error ? Colors.ErrorColor : borderColor || Colors.InputBorderColor,
          backgroundColor: backgroundColor ?? Colors.InputBackground,
          height: resolvedHeight,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      {label && (
        <Animated.View style={[styles.labelContainer, { transform: [{ translateY: transY.current }] }]} pointerEvents="none">
          <Animated.Text style={[styles.label, { color: Colors.InputPlaceholderColor, fontSize: fontSizeValue.current, fontFamily }]}>{required ? `${label} *` : label}</Animated.Text>
        </Animated.View>
      )}

      <Pressable style={StyleSheet.absoluteFillObject} onPress={selectModalProps ? () => openModal(ModalTypeEnum.SelectModal, selectModalProps) : onPress} disabled={disabled}>
        <View style={[styles.row, hasValue && label && styles.rowWithValue, { paddingRight: rowPaddingRight }]}>
          {/* Boş değerde CustomText null döner; flex:1 kaybolmasın diye slot her zaman durur — chevron sağda kalır */}
          <View style={styles.valueSlot}>
            <CustomText fontSize={14} color={hasValue ? Colors.TextColor : Colors.InputPlaceholderColor} style={styles.valueText} numberOfLines={1}>
              {hasValue ? value : !label ? (required ? `${placeholder} *` : placeholder) : ""}
            </CustomText>
          </View>
        </View>

        <View style={styles.iconsTray} pointerEvents="box-none">
          <View style={styles.icons} pointerEvents="box-none">
            {hasValue && isClearable && (
              <Pressable onPress={onClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={Colors.InputPlaceholderColor} />
              </Pressable>
            )}
            {!noIcon ? (
              <View pointerEvents="none">
                <Ionicons name="chevron-down" size={16} color={Colors.InputPlaceholderColor} />
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      {error && (
        <CustomText numberOfLines={1} color={Colors.ErrorColor} fontSize={12} style={styles.errorText}>
          {error}
        </CustomText>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
  },
  labelContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  label: {
    paddingLeft: 15,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 15,
    paddingTop: 7,
  },
  rowWithValue: {
    paddingTop: 18,
  },
  iconsTray: {
    position: "absolute",
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  valueSlot: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  valueText: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    alignSelf: "center",
  },
  errorText: {
    position: "absolute",
    bottom: -15,
    left: 15,
  },
});

export default memo(CustomSelect);
