import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

const DEFAULT_REGION = { latitude: 39.9334, longitude: 32.8597, latitudeDelta: 0.05, longitudeDelta: 0.05 };
const NOMINATIM_HEADERS = { "Accept-Language": "tr", "User-Agent": "BuRandevu/1.0" };

async function reverseGeocode(latitude, longitude) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await res.json();
    return data.display_name ?? "";
  } catch {
    return "";
  }
}

async function searchAddress(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=tr`,
      { headers: NOMINATIM_HEADERS }
    );
    return await res.json();
  } catch {
    return [];
  }
}

function LocationPickerModal({ visible, initialLocation, initialAddress, onConfirm, onClose }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const searchTimer = useRef(null);

  const [markerCoord, setMarkerCoord] = useState(initialLocation ?? null);
  const [address, setAddress] = useState(initialAddress ?? "");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initialLocation) {
      setMarkerCoord(initialLocation);
      setAddress(initialAddress ?? "");
    } else {
      locateMe();
    }
  }, [visible]);

  const locateMe = useCallback(async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setMarkerCoord(coord);
      animateTo(coord);
      const addr = await reverseGeocode(coord.latitude, coord.longitude);
      setAddress(addr);
    } catch {
      // konum alınamazsa varsayılan bölge kalır
    } finally {
      setIsLocating(false);
    }
  }, []);

  const animateTo = (coord) => {
    mapRef.current?.animateToRegion(
      { ...coord, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      600
    );
  };

  const closeResults = useCallback(() => {
    Keyboard.dismiss();
    setSearchResults([]);
    setSearchText("");
  }, []);

  const handleDragEnd = useCallback(async (e) => {
    const coord = e.nativeEvent.coordinate;
    setMarkerCoord(coord);
    const addr = await reverseGeocode(coord.latitude, coord.longitude);
    setAddress(addr);
  }, []);

  const handleSearchChange = (text) => {
    setSearchText(text);
    clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchAddress(text);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleSelectResult = (item) => {
    const coord = { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) };
    setMarkerCoord(coord);
    setAddress(item.display_name);
    setSearchText("");
    setSearchResults([]);
    Keyboard.dismiss();
    animateTo(coord);
  };

  const handleConfirm = () => {
    if (!markerCoord) return;
    onConfirm({ latitude: markerCoord.latitude, longitude: markerCoord.longitude, address });
  };

  const showResults = searchResults.length > 0;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
          >
            <Ionicons name="close" size={22} color={Colors.BrandPrimary} />
          </Pressable>
          <CustomText extraBold fontSize={17} color={Colors.BrandPrimary}>
            Konum seç
          </CustomText>
          <Pressable
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
            onPress={() => {
              Keyboard.dismiss();
              locateMe();
            }}
          >
            {isLocating
              ? <ActivityIndicator size="small" color={Colors.BrandPrimary} />
              : <Ionicons name="locate" size={22} color={Colors.BrandPrimary} />
            }
          </Pressable>
        </View>

        {/* Harita + arama overlay */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={
              markerCoord
                ? { ...markerCoord, latitudeDelta: 0.01, longitudeDelta: 0.01 }
                : DEFAULT_REGION
            }
            showsUserLocation
            showsMyLocationButton={false}
            onPress={() => Keyboard.dismiss()}
          >
            {markerCoord && (
              <Marker
                coordinate={markerCoord}
                draggable
                onDragEnd={handleDragEnd}
                tracksViewChanges={false}
                pinColor={Colors.Gold}
              />
            )}
          </MapView>

          {/* Arama kutusu — haritanın üstünde */}
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={Colors.LightGray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Adres ara..."
              placeholderTextColor={Colors.LightGray}
              value={searchText}
              onChangeText={handleSearchChange}
              autoCorrect={false}
              keyboardAppearance="light"
            />
            {isSearching
              ? <ActivityIndicator size="small" color={Colors.LightGray} />
              : searchText.length > 0
                ? (
                  <Pressable onPress={closeResults}>
                    <Ionicons name="close-circle" size={18} color={Colors.LightGray} />
                  </Pressable>
                )
                : null
            }
          </View>

          {/* Dropdown sonuçlar */}
          {showResults && (
            <>
              {/* Backdrop — haritaya tıklayarak kapat */}
              <Pressable style={styles.resultBackdrop} onPress={closeResults} />
              <View style={styles.resultsCard}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.place_id?.toString()}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item, index }) => (
                    <Pressable
                      style={({ pressed }) => [
                        styles.resultRow,
                        index < searchResults.length - 1 && styles.resultDivider,
                        pressed && styles.resultPressed,
                      ]}
                      onPress={() => handleSelectResult(item)}
                    >
                      <Ionicons name="location-outline" size={16} color={Colors.Gold} style={styles.resultIcon} />
                      <CustomText fontSize={13} color={Colors.BrandPrimary} style={styles.resultText} numberOfLines={2}>
                        {item.display_name}
                      </CustomText>
                    </Pressable>
                  )}
                />
              </View>
            </>
          )}
        </View>

        {/* Footer — adres + onayla; boş alan / harita / onayda klavye kapanır */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.footerDismissStripTop} onPress={Keyboard.dismiss} accessibilityLabel="Klavyeyi kapat" />
          <View style={styles.addressInputWrap}>
            <Pressable onPress={Keyboard.dismiss} hitSlop={8} accessibilityLabel="Klavyeyi kapat">
              <Ionicons name="location" size={16} color={Colors.Gold} style={styles.addressIcon} />
            </Pressable>
            <TextInput
              style={styles.addressInput}
              placeholder="Adres (bina no, daire vb. ekleyebilirsiniz)"
              placeholderTextColor={Colors.LightGray}
              value={address}
              onChangeText={setAddress}
              multiline
              autoCorrect={false}
              keyboardAppearance="light"
            />
          </View>
          <Pressable style={styles.footerDismissStripGap} onPress={Keyboard.dismiss} accessibilityLabel="Klavyeyi kapat" />
          <Pressable
            style={({ pressed }) => [styles.confirmButton, !markerCoord && styles.buttonDisabled, pressed && styles.pressed]}
            onPress={() => {
              Keyboard.dismiss();
              handleConfirm();
            }}
            disabled={!markerCoord}
          >
            <CustomText bold fontSize={15} color={Colors.White}>
              Konumu onayla
            </CustomText>
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.White },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.BorderColor,
    backgroundColor: Colors.White,
  },
  headerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },

  // Harita
  mapContainer: { flex: 1 },

  // Arama
  searchWrap: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.White,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.BrandPrimary, fontWeight: "500" },

  // Dropdown
  resultBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
  },
  resultsCard: {
    position: "absolute",
    top: 70, // searchWrap top(12) + height(46) + gap(12)
    left: 12,
    right: 12,
    backgroundColor: Colors.White,
    borderRadius: 12,
    maxHeight: 230,
    zIndex: 20,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  resultRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  resultDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.BorderColor },
  resultIcon: { marginTop: 2 },
  resultText: { flex: 1, lineHeight: 18 },
  resultPressed: { backgroundColor: Colors.InputSurface },

  // Footer
  footer: {
    backgroundColor: Colors.White,
    paddingHorizontal: 20,
    paddingTop: 0,
    gap: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.BorderColor,
  },
  /** Eskiden footer paddingTop — tıklanınca klavye kapanır */
  footerDismissStripTop: {
    height: 16,
    alignSelf: "stretch",
  },
  /** Eskiden gap — adres ile buton arası */
  footerDismissStripGap: {
    height: 12,
    alignSelf: "stretch",
  },
  addressInputWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.InputSurface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addressIcon: { marginTop: 2 },
  addressInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.BrandPrimary,
    lineHeight: 18,
    fontWeight: "500",
    minHeight: 36,
  },
  confirmButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});

export default React.memo(LocationPickerModal);
