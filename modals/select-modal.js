import { Colors } from "@/constants/colors";
import general from "@/utils/general";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Easing } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ActivityLoading from "@/components/high-level/activity-loading";
import CustomText from "@/components/high-level/custom-text";
import CustomImage from "@/components/high-level/custom-image";

const normalizeItem = (item, labelKey, valueKey) => {
  if (typeof item === "string") return { label: item, value: item };
  return {
    label: item[labelKey] ?? item.label ?? item.name ?? item.value ?? "",
    value: item[valueKey] ?? item.value ?? item.id ?? item.name ?? "",
    _raw: item,
  };
};

/**
 * SelectModal — ModalRenderer içinde çalışır, kendi <Modal> wrapper'ı yok.
 * ModalRenderer tarafından rawContainer: true ile render edilir (arkaplan şeffaf).
 *
 * Props (openModal ile geçilir):
 *   title          string
 *   items          string[] | object[]          – statik liste
 *   selectedValue  string                       – mevcut seçili değer
 *   onSelect       (item: {label,value,_raw}) => void
 *   fetchData      async () => Array            – Firebase / dinamik veri
 *   labelKey       string (default: "name")
 *   valueKey       string (default: "id")
 *   search         boolean
 *   isClearable    boolean
 *   onClear        () => void
 *   onClose        () => void                   – ModalRenderer tarafından geçilir
 */
const SelectModal = ({
  title,
  items,
  selectedValue,
  onSelect,
  fetchData,
  labelKey = "name",
  valueKey = "id",
  search = false,
  isClearable = false,
  onClear,
  onClose,
  /** Örn: ["duration", "price"] — _raw üzerinden alınan ek alanlar item altında küçük metin olarak gösterilir */
  metaKeys,
  /** _raw üzerindeki URL alanı adı. Varsa her satırda küçük yuvarlak avatar gösterilir */
  avatarKey,
}) => {
  const insets = useSafeAreaInsets();

  const [dynamicData, setDynamicData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(500)).current;

  const normalizedItems = useMemo(
    () => (items ?? []).map((item) => normalizeItem(item, labelKey, valueKey)),
    [items, labelKey, valueKey],
  );

  const displayData = useMemo(() => {
    const source = items ? normalizedItems : dynamicData;
    if (!search || !searchText.trim()) return source;
    const lower = searchText.toLowerCase();
    return source.filter((item) => item.label?.toLowerCase().includes(lower));
  }, [normalizedItems, dynamicData, search, searchText, items]);

  // Dinamik veri yükleme
  useEffect(() => {
    if (items || !fetchData) return;
    setLoading(true);
    fetchData()
      .then((result) => setDynamicData((result ?? []).map((item) => normalizeItem(item, labelKey, valueKey))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Mount'ta açılış animasyonu
  useEffect(() => {
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
  }, []);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 500,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => onClose?.());
  }, [onClose]);

  const handleSelect = useCallback(
    (item) => {
      onSelect?.(item);
      handleClose();
    },
    [onSelect, handleClose],
  );

  const handleClear = useCallback(() => {
    onClear?.();
    handleClose();
  }, [onClear, handleClose]);

  const renderItem = useCallback(
    ({ item, index }) => {
      const isSelected = item.value === selectedValue || item.label === selectedValue;
      const isLast = index === displayData.length - 1;
      const metaValues = metaKeys?.map((key) => item._raw?.[key]).filter(Boolean) ?? [];
      const avatarUrl = avatarKey ? item._raw?.[avatarKey] : null;
      return (
        <Pressable
          style={({ pressed }) => [styles.item, !isLast && styles.itemBorder, pressed && styles.pressed]}
          onPress={() => handleSelect(item)}
        >
          {avatarKey && (
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <CustomImage uri={avatarUrl} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person-outline" size={16} color="#C0C0C0" />
                </View>
              )}
            </View>
          )}
          <View style={styles.itemContent}>
            <CustomText bold fontSize={14} color={isSelected ? Colors.Gold : Colors.BrandPrimary}>
              {item.label}
            </CustomText>
            {metaValues.length > 0 && (
              <View style={styles.metaRow}>
                {metaValues.map((val, i) => (
                  <CustomText key={i} fontSize={12} color={Colors.LightGray2}>
                    {val}
                  </CustomText>
                ))}
              </View>
            )}
          </View>
          {isSelected && <Ionicons name="checkmark" size={18} color={Colors.Gold} />}
        </Pressable>
      );
    },
    [selectedValue, displayData.length, handleSelect, metaKeys, avatarKey],
  );

  return (
    <View style={styles.root}>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: sheetTranslateY }] }]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <CustomText extraBold fontSize={15} color={Colors.BrandPrimary}>
            {title}
          </CustomText>
          {isClearable && !general.isNullOrEmpty(selectedValue) && (
            <Pressable onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <CustomText bold fontSize={12} color={Colors.LightGray2} letterSpacing={0.4}>
                Temizle
              </CustomText>
            </Pressable>
          )}
        </View>

        {search && (
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={15} color={Colors.InputPlaceholderColor} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ara..."
              placeholderTextColor={Colors.InputPlaceholderColor}
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={15} color={Colors.InputPlaceholderColor} />
              </Pressable>
            )}
          </View>
        )}

        {loading ? (
          <ActivityLoading style={styles.loader} />
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </Animated.View>
    </View>
  );
};

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
    maxHeight: "72%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(20,20,20,0.12)",
    alignSelf: "center",
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.BrandBackground,
    borderWidth: 1,
    borderColor: Colors.InputBorderColor,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.TextColor,
    fontFamily: "Urbanist_400Regular",
    padding: 0,
  },
  list: {
    flexGrow: 0,
  },
  loader: {
    minHeight: 140,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20,20,20,0.05)",
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default memo(SelectModal);
