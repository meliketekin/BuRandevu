import { Colors } from "../../../constants/colors";
import general from "../../../utils/general";
import React, { useMemo } from "react";
import { Text } from "react-native";

const CustomText = ({
  usePrimaryColor = false,
  useSecondaryColor = false,
  useSubTextColor = false,
  useBorderColor = false,
  useLightColor = false,
  useLightGray2 = false,
  useWhiteColor = false,
  useGreenColor = false,
  useGreyColor = false,
  customColor,
  children,
  fontWeight = "500",
  toUpper,
  center,
  none = false,
  right = false,
  disabled = false,
  color = null,
  bold = false,
  extraBold = false,
  md = false,
  xs = false,
  lg = false,
  sm = false,
  xlg = false,
  xxlg = false,
  medium = false,
  min = false,
  headerxl = false,
  headerxxl = false,
  marginLeft = false,
  marginRight = false,
  style,
  header = false,
  marginTop = false,
  customMarginTop,
  customMarginLeft,
  customMarginRight,
  headerx = false,
  semibold = false,
  marginTopText = false,
  customMarginBottom,
  verticalSpace = false,
  marginBottom,
  numberOfLines,
  modal = false,
  underline = false,
  regular = false,
  light = false,
  flex,
  minx = false,
  lineHeight,
  fontSize,
  title = false,
  addShadow = false,
  useBodyColor = false,
  adjustsFontSizeToFit = false,
  letterSpacing,
  onPress,
}) => {
  // Tema renklerini al
  const colors = Colors;

  let _fontsize = 16;
  if (title) _fontsize = 19;
  if (min) _fontsize = 10;
  if (minx) _fontsize = 11;
  if (xs) _fontsize = 12;
  if (sm) _fontsize = 14;
  if (md) _fontsize = 16;
  if (lg) _fontsize = 18;
  if (header) _fontsize = 20;
  if (headerx) _fontsize = 22;
  if (headerxl) _fontsize = 24;
  if (headerxxl) _fontsize = 26;
  if (xlg) _fontsize = 28;
  if (xxlg) _fontsize = 36;

  if (fontSize > 0) _fontsize = fontSize;

  let textColor = colors.TextColor;

  if (light) textColor = "#505359";
  if (useLightColor) textColor = colors.LightGray;
  if (useLightGray2) textColor = colors.LightGray2;
  if (useWhiteColor) textColor = colors.White;
  if (useSecondaryColor) textColor = colors.SecondaryColor;
  if (usePrimaryColor) textColor = colors.BrandPrimary;
  if (useBorderColor) textColor = colors.BorderColor;
  if (useBodyColor) textColor = colors.BodyColor;
  if (useSubTextColor) textColor = colors.SubTextcolor;
  if (useGreenColor) textColor = colors.Green;
  if (useGreyColor) textColor = colors.InputInner;
  if (color) textColor = color;
  if (disabled) textColor = colors.DisabledColor;

  let fontFamily = "Urbanist_400Regular";

  if (title) fontFamily = "Urbanist_600SemiBold";
  if (light) fontFamily = "Urbanist_300Light"; //300
  if (regular) fontFamily = "Urbanist_400Regular"; //400
  if (medium) fontFamily = "Urbanist_500Medium"; //500
  if (semibold) fontFamily = "Urbanist_600SemiBold"; //600
  if (bold) fontFamily = "Urbanist_700Bold"; //700
  if (extraBold) fontFamily = "Urbanist_800ExtraBold"; //800

  const createText = useMemo(() => {
    const newTextArray = children instanceof Array ? children : [children];
    return newTextArray.map((text) => {
      return toUpper ? general.toUpper(text) : text;
    });
  }, [children, toUpper]);

  const styles = {
    lineHeight: lineHeight,
    includeFontPadding: false,
    flex: flex,
    color: textColor || customColor,
    fontSize: _fontsize,
    fontWeight,
    textDecorationLine: underline ? "underline" : null,
    marginLeft: marginLeft ? 10 : (customMarginLeft ?? 0),
    marginRight: marginRight ? 10 : (customMarginRight ?? 0),
    marginTop: marginTop ? 10 : marginTopText ? 5 : modal ? 20 : customMarginTop != undefined ? customMarginTop : title ? 20 : 0,
    marginBottom: marginBottom ? 10 : customMarginBottom != undefined ? customMarginBottom : title ? 20 : 0,
    fontFamily: fontFamily,
    marginVertical: verticalSpace ? 20 : 0,
    textAlign: right ? "right" : center ? (none ? "left" : "center") : "left",
    fontVariant: ["lining-nums"],
    shadowColor: addShadow ? colors.Black : null,
    shadowOffset: addShadow ? { width: 0, height: 2 } : null,
    shadowOpacity: addShadow ? 0.9 : null,
    shadowRadius: addShadow ? 2 : null,
    flexWrap: "wrap",
    letterSpacing: letterSpacing ? letterSpacing : null,
    ...style,
  };

  if (createText?.findIndex((x) => !general.isNullOrEmpty(x)) < 0) return null;

  return (
    <>
      <Text onPress={onPress} adjustsFontSizeToFit={adjustsFontSizeToFit} numberOfLines={numberOfLines} style={styles}>
        {createText}
      </Text>
    </>
  );
};

export default React.memo(CustomText);
