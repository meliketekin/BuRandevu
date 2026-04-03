import React, { useCallback, useMemo, useState } from "react";
import { ActionSheetIOS, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import PhotoViewer from "@/components/high-level/photo-viewer";
import CommandBus from "@/infrastructures/command-bus/command-bus";
import { Colors } from "@/constants/colors";

const MAX_PHOTOS = 12;
const GRID_GAP = 14;
const GRID_COLUMNS = 3;

function makeLocalPhoto(uri) {
  return { id: Date.now().toString() + Math.random().toString(36).slice(2), uri };
}

function GalleryItem({ item, onRemove, onPress, cellStyle }) {
  return (
    <View style={[styles.thumbWrap, cellStyle]}>
      <Pressable style={({ pressed }) => [styles.thumbPressable, pressed && styles.pressed]} onPress={onPress}>
        <CustomImage uri={item.uri} style={styles.thumb} contentFit="cover" />
      </Pressable>
      <Pressable style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]} onPress={onRemove}>
        <Ionicons name="close" size={16} color={Colors.White} />
      </Pressable>
    </View>
  );
}

/**
 * ImageGallery
 *
 * @param {string}   title
 * @param {{ id: string, uri: string, downloadUrl?: string, publicId?: string }[]} photos
 * @param {(photo: { id, uri }) => void} onAdd
 * @param {(id: string) => void} onRemove
 * @param {number}   [maxPhotos=12]
 * @param {number}   [contentHorizontalPadding=40] – üst ekrandaki yatay padding toplamı (örn. 20+20); hücre genişliği için
 */
function ImageGallery({ title, photos, onAdd, onRemove, maxPhotos = MAX_PHOTOS, contentHorizontalPadding = 40 }) {
  const { width: windowWidth } = useWindowDimensions();
  const [viewerIndex, setViewerIndex] = useState(null);
  const [androidSheetVisible, setAndroidSheetVisible] = useState(false);

  const cellStyle = useMemo(() => {
    const gridWidth = Math.max(0, windowWidth - contentHorizontalPadding);
    const size = (gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
    return { width: size, height: size, flexShrink: 0 };
  }, [windowWidth, contentHorizontalPadding]);

  const pickImage = useCallback(async (source) => {
    try {
      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          CommandBus.sc.alertInfo("İzin gerekli", "Kamera kullanmak için izin vermeniz gerekiyor.", 2800);
          return;
        }
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          CommandBus.sc.alertInfo("İzin gerekli", "Fotoğraflara erişmek için izin vermeniz gerekiyor.", 2800);
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.85,
        });
      }

      if (result.canceled) return;
      onAdd(makeLocalPhoto(result.assets[0].uri));
    } catch (err) {
      console.error("pickImage error:", err);
      CommandBus.sc.alertError("Hata", "Fotoğraf seçilirken bir sorun oluştu.", 2800);
    }
  }, [onAdd]);

  const handleAdd = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Galeriden seç", "Fotoğraf çek", "İptal"], cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) pickImage("gallery");
          if (idx === 1) pickImage("camera");
        },
      );
    } else {
      setAndroidSheetVisible(true);
    }
  }, [pickImage]);

  const handleAndroidSource = (source) => {
    setAndroidSheetVisible(false);
    queueMicrotask(() => pickImage(source));
  };

  const canAdd = photos.length < maxPhotos;
  const countLabel = `${photos.length} / ${maxPhotos}`;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8}>
          {title}
        </CustomText>
        <CustomText bold fontSize={10} color="rgba(80,83,89,0.64)" letterSpacing={1.2}>
          {countLabel}
        </CustomText>
      </View>

      <View style={styles.grid}>
        {canAdd && (
          <Pressable style={({ pressed }) => [styles.addCard, cellStyle, pressed && styles.pressed]} onPress={handleAdd}>
            <Ionicons name="add" size={28} color={Colors.Gold} />
            <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={0.8} style={styles.addLabel}>
              Görsel ekle
            </CustomText>
          </Pressable>
        )}
        {photos.map((item, index) => (
          <GalleryItem
            key={item.id}
            item={item}
            cellStyle={cellStyle}
            onRemove={() => onRemove(item.id)}
            onPress={() => setViewerIndex(index)}
          />
        ))}
      </View>

      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos.map((p) => p.uri)}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      <Modal
        visible={androidSheetVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAndroidSheetVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setAndroidSheetVisible(false)} />
          <View style={styles.sheetCard}>
            <CustomText extraBold fontSize={16} color={Colors.BrandPrimary} style={styles.sheetTitle}>
              Fotoğraf ekle
            </CustomText>
            <Pressable
              style={({ pressed }) => [styles.sheetRow, pressed && styles.pressed]}
              onPress={() => handleAndroidSource("gallery")}
            >
              <CustomText bold fontSize={15} color={Colors.BrandPrimary}>
                Galeriden seç
              </CustomText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.sheetRow, styles.sheetRowDivider, pressed && styles.pressed]}
              onPress={() => handleAndroidSource("camera")}
            >
              <CustomText bold fontSize={15} color={Colors.BrandPrimary}>
                Fotoğraf çek
              </CustomText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.sheetRow, styles.sheetRowDivider, pressed && styles.pressed]}
              onPress={() => setAndroidSheetVisible(false)}
            >
              <CustomText medium fontSize={15} color={Colors.LightGray2}>
                İptal
              </CustomText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  addCard: {
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(212,175,55,0.22)",
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  addLabel: { marginTop: 6, textAlign: "center" },
  thumbWrap: { position: "relative" },
  thumbPressable: { width: "100%", height: "100%", borderRadius: 22, overflow: "hidden" },
  thumb: { width: "100%", height: "100%", borderRadius: 22 },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.White,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  // Android sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject },
  sheetCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.White,
    borderRadius: 16,
    paddingVertical: 8,
    zIndex: 1,
  },
  sheetTitle: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  sheetRow: { paddingVertical: 14, paddingHorizontal: 18 },
  sheetRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
});

export default React.memo(ImageGallery);
