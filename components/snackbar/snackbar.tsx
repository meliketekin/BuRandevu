import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Snackbar as PaperSnackbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

const DURATION_MEDIUM = 2500;

const TYPE_STYLES = {
  success: {
    backgroundColor: "#123526",
    borderColor: "#1C5B3E",
    iconName: "checkmark-circle",
    iconColor: "#7DF0AF",
    messageColor: "rgba(255,255,255,0.78)",
  },
  error: {
    backgroundColor: "#3B1517",
    borderColor: "#6F262B",
    iconName: "alert-circle",
    iconColor: "#FF938F",
    messageColor: "rgba(255,255,255,0.8)",
  },
  warning: {
    backgroundColor: "#2F2611",
    borderColor: "#6B551C",
    iconName: "information-circle",
    iconColor: "#FFD76A",
    messageColor: "rgba(255,255,255,0.8)",
  },
} as const;

type SnackbarVariant = keyof typeof TYPE_STYLES;

type SnackbarProps = React.ComponentProps<typeof PaperSnackbar> & {
  wrapperStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  title?: string;
  type?: SnackbarVariant;
  position?: "top" | "bottom";
};

const Snackbar = ({
  visible,
  duration = DURATION_MEDIUM,
  onDismiss,
  children,
  wrapperStyle,
  style,
  title,
  type = "warning",
  position = "bottom",
  ...rest
}: SnackbarProps) => {
  const insets = useSafeAreaInsets();
  const variant = TYPE_STYLES[type] || TYPE_STYLES.warning;
  const positionWrapperStyle =
    position === "top"
      ? {
          top: Math.max(insets.top + 16, 28),
          bottom: undefined,
        }
      : {
          bottom: Math.max(insets.bottom, 12),
          top: undefined,
        };

  return (
    <PaperSnackbar
      visible={visible}
      duration={duration}
      onDismiss={onDismiss}
      wrapperStyle={[positionWrapperStyle, wrapperStyle]}
      style={[
        styles.snackbar,
        {
          backgroundColor: variant.backgroundColor,
          borderColor: variant.borderColor,
        },
        style,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        <Ionicons
          name={variant.iconName}
          size={20}
          color={variant.iconColor}
          style={styles.icon}
        />

        <View style={styles.textContainer}>
          {title ? (
            <Text style={styles.titleText}>{title}</Text>
          ) : null}

          {typeof children === "string" || typeof children === "number" ? (
            <Text
              style={[
                styles.messageText,
                { color: variant.messageColor },
              ]}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      </View>
    </PaperSnackbar>
  );
};

export default Snackbar;

const styles = StyleSheet.create({
  snackbar: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 18,
    elevation: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginTop: 2,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    color: Colors.White,
    fontFamily: "Urbanist_700Bold",
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  messageText: {
    fontFamily: "Urbanist_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
});
