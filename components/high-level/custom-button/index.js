import React from "react";
import { ActivityIndicator, View } from "react-native";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import { Colors } from "@/constants/colors";

const CustomButton = ({
  title,
  onPress,
  borderRadius = 8,
  backgroundColor,
  marginTop = 10,
  fontColor,
  height = 50,
  style,
  disabled,
  loading,
  leftIcon,
  contentStyle,
  rightIcon,
  titleStyle,
  whiteBg,
  fontSize = 15,
}) => {
  const _style = {
    height,
    justifyContent: "center",
    alignItems: "center",
    marginTop,
    backgroundColor: disabled ? Colors.DisabledColor : whiteBg ? Colors.White : backgroundColor || Colors.PrimaryColor,
    borderRadius: borderRadius,
    paddingHorizontal: 15,
  };

  return (
    <CustomTouchableOpacity style={contentStyle} loading={loading} onDisabled={disabled} onPress={onPress}>
      <View style={[_style, style]}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.BrandBackground} />
        ) : (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            {leftIcon}
            <CustomText
              numberOfLines={1}
              style={{ maxWidth: "100%", ...titleStyle }}
              fontSize={fontSize}
              semibold
              color={fontColor ? fontColor : whiteBg ? Colors.BrandPrimary : "#fff"}
              marginLeft={leftIcon}
            >
              {title}
            </CustomText>
            {rightIcon}
          </View>
        )}
      </View>
    </CustomTouchableOpacity>
  );
};

export default React.memo(CustomButton);
