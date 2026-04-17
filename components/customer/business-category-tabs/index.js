import React, { memo, useCallback, useLayoutEffect, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import { Colors } from "@/constants/colors";

const ALL = "all";

const CustomerBusinessCategoryTabs = ({ categories, selectedCategory, onSelectCategory }) => {
  const scrollRef = useRef(null);
  const scrollViewWidthRef = useRef(0);
  const itemLayoutsRef = useRef({});

  const tabs = [ALL, ...categories];

  const scrollToSelected = useCallback(() => {
    const svw = scrollViewWidthRef.current;
    const layout = itemLayoutsRef.current[selectedCategory];
    if (!scrollRef.current || !layout || svw <= 0) return;
    const { x, width } = layout;
    const targetX = Math.max(0, x + width / 2 - svw / 2);
    scrollRef.current.scrollTo({ x: targetX, animated: true });
  }, [selectedCategory]);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => scrollToSelected());
    return () => cancelAnimationFrame(id);
  }, [selectedCategory, categories, scrollToSelected]);

  const handleScrollViewLayout = useCallback(
    (e) => {
      scrollViewWidthRef.current = e.nativeEvent.layout.width;
      requestAnimationFrame(scrollToSelected);
    },
    [scrollToSelected],
  );

  const handleTabLayout = useCallback(
    (cat) => (e) => {
      itemLayoutsRef.current[cat] = e.nativeEvent.layout;
      if (cat === selectedCategory && scrollViewWidthRef.current > 0) {
        requestAnimationFrame(scrollToSelected);
      }
    },
    [selectedCategory, scrollToSelected],
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        onLayout={handleScrollViewLayout}
      >
        {tabs.map((cat) => {
          const isSelected = cat === selectedCategory;
          return (
            <View key={cat} style={styles.tabOuter} onLayout={handleTabLayout(cat)} collapsable={false}>
              <CustomTouchableOpacity
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                activeOpacity={0.9}
                onPress={() => onSelectCategory?.(cat)}
              >
                <CustomText semibold sm color={isSelected ? Colors.Gold : Colors.BrandPrimary}>
                  {cat === ALL ? "Tümü" : cat}
                </CustomText>
              </CustomTouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    marginBottom: 18,
  },
  contentContainer: {
    gap: 10,
    paddingRight: 20,
  },
  tabOuter: {
    flexShrink: 0,
  },
  tabButton: {
    minHeight: 38,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  tabButtonActive: {
    backgroundColor: Colors.BrandPrimary,
  },
});

export default memo(CustomerBusinessCategoryTabs);
