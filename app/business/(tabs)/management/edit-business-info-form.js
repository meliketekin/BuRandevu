import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/firebase";
import FormInput from "@/components/high-level/custom-input";
import CustomSelect from "@/components/high-level/custom-select";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import { BUSINESS_CATEGORIES, normalizeBusinessCategory } from "@/enums/business-category-enum";

const MAP_PLACEHOLDER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPNOAETjH58OA-DfRCZTJ3NUAdnYVaAbUA3vs9PFDItQkEWT0oX5pmT4jtw6jbe1v9F43o7SQ-tDl-yV8lKUT2uGpbrgzBMeknnYFSUOipUCjZPh5cGk3WBuGCrvyhP_E1zMlXYCpYxmBsMsv0P0CZtwpDvlyD8u4V_HoRYBrrytwOIzfQP33qU6KSxR0blSPAyMkYeOEI1iSYeXSm6R0UjRzauDMyw5po_5HBWRz4eRNC5gdKjd6Apx3cFbEjHATZX8wfCDcM5Vg";

const DEFAULT_DESCRIPTION = "Premium hair and beard styling services in the heart of the city.";
const DEFAULT_ADDRESS = "123 Luxury Ave, Suite 400,\nNew York, NY 10001";
const LINKS_PLACEHOLDER = "https://ornek.com\nhttps://instagram.com/isletmeniz";
const MAX_PHOTOS = 12;

// { id, uri, downloadUrl?, uploading? }
function makeLocalPhoto(uri) {
  return { id: Date.now().toString() + Math.random().toString(36).slice(2), uri, uploading: true };
}

function GalleryItem({ item, onRemove }) {
  return (
    <View style={styles.galleryThumbWrap}>
      <CustomImage uri={item.uri} style={styles.galleryThumb} contentFit="cover" />
      {item.uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="small" color={Colors.White} />
        </View>
      )}
      {!item.uploading && (
        <Pressable style={({ pressed }) => [styles.galleryRemoveButton, pressed && styles.pressed]} onPress={onRemove}>
          <Ionicons name="close" size={16} color={Colors.White} />
        </Pressable>
      )}
    </View>
  );
}

function GallerySection({ title, photos, onAdd, onRemove }) {
  const countLabel = `${photos.length} / ${MAX_PHOTOS}`;
  const canAdd = photos.length < MAX_PHOTOS;

  return (
    <View style={styles.gallerySection}>
      <View style={styles.sectionRow}>
        <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8}>
          {title}
        </CustomText>
        <CustomText bold fontSize={10} color="rgba(80,83,89,0.64)" letterSpacing={1.2}>
          {countLabel}
        </CustomText>
      </View>

      <View style={styles.galleryGrid}>
        {canAdd && (
          <Pressable style={({ pressed }) => [styles.addImageCard, pressed && styles.pressed]} onPress={onAdd}>
            <Ionicons name="add" size={28} color={Colors.Gold} />
            <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={0.8} style={styles.addImageLabel}>
              Görsel ekle
            </CustomText>
          </Pressable>
        )}
        {photos.map((item) => (
          <GalleryItem key={item.id} item={item} onRemove={() => onRemove(item.id)} />
        ))}
      </View>
    </View>
  );
}

export default function EditBusinessInfoForm() {
  const insets = useSafeAreaInsets();
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [socialLinksText, setSocialLinksText] = useState("");
  const [venuePhotos, setVenuePhotos] = useState([]);
  const [servicePhotos, setServicePhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setBusinessName(data?.businessName ?? "Elite Grooming Co.");
        setCategory(normalizeBusinessCategory(data?.category ?? ""));
        setDescription(data?.description ?? DEFAULT_DESCRIPTION);
        setAddress(data?.address ?? DEFAULT_ADDRESS);
        setPhone(data?.phone ?? "");
        setWhatsappNumber(data?.whatsappNumber ?? "");
        if (Array.isArray(data?.socialLinks)) {
          setSocialLinksText(data.socialLinks.join("\n"));
        } else {
          setSocialLinksText(data?.socialLinks ?? "");
        }
        if (Array.isArray(data?.venuePhotos)) {
          setVenuePhotos(data.venuePhotos.map((url, i) => ({ id: `venue-${i}`, uri: url, downloadUrl: url })));
        }
        if (Array.isArray(data?.servicePhotos)) {
          setServicePhotos(data.servicePhotos.map((url, i) => ({ id: `service-${i}`, uri: url, downloadUrl: url })));
        }
      })
      .catch(() => setBusinessName("Elite Grooming Co."));
  }, []);

  const uploadPhoto = useCallback(async (uri, folder) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Kullanıcı bulunamadı");
    const storageRef = ref(storage, `gallery/${uid}/${folder}/${Date.now()}.jpg`);
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  }, []);

  const pickImage = useCallback(async (setter, folder, source) => {
    try {
      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("İzin Gerekiyor", "Kamera kullanmak için izin vermeniz gerekiyor.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("İzin Gerekiyor", "Fotoğraflara erişmek için izin vermeniz gerekiyor.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.85,
        });
      }

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const photo = makeLocalPhoto(uri);
      setter((prev) => [...prev, photo]);

      const downloadUrl = await uploadPhoto(uri, folder);
      setter((prev) => prev.map((p) => (p.id === photo.id ? { ...p, uploading: false, downloadUrl } : p)));
    } catch {
      Alert.alert("Hata", "Fotoğraf yüklenirken bir sorun oluştu.");
      setter((prev) => prev.filter((p) => !p.uploading));
    }
  }, [uploadPhoto]);

  const openPickerSheet = useCallback((setter, folder) => {
    const options = ["Galeriden seç", "Fotoğraf çek", "İptal"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) pickImage(setter, folder, "gallery");
          if (idx === 1) pickImage(setter, folder, "camera");
        },
      );
    } else {
      Alert.alert("Fotoğraf ekle", undefined, [
        { text: "Galeriden seç", onPress: () => pickImage(setter, folder, "gallery") },
        { text: "Fotoğraf çek", onPress: () => pickImage(setter, folder, "camera") },
        { text: "İptal", style: "cancel" },
      ]);
    }
  }, [pickImage]);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { Alert.alert("Hata", "Kullanıcı bulunamadı."); return; }

    const uploadingExists = [...venuePhotos, ...servicePhotos].some((p) => p.uploading);
    if (uploadingExists) {
      Alert.alert("Lütfen bekleyin", "Fotoğraflar yükleniyor, lütfen biraz bekleyin.");
      return;
    }

    setIsSaving(true);
    try {
      const socialLinks = socialLinksText.split("\n").map((s) => s.trim()).filter(Boolean);
      await updateDoc(doc(db, "users", uid), {
        businessName: businessName.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        socialLinks,
        venuePhotos: venuePhotos.filter((p) => p.downloadUrl).map((p) => p.downloadUrl),
        servicePhotos: servicePhotos.filter((p) => p.downloadUrl).map((p) => p.downloadUrl),
      });
      Alert.alert("Kaydedildi", `${businessName || "İşletme"} bilgileri güncellendi.`);
    } catch {
      Alert.alert("Hata", "Bilgiler kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeLocation = () => {
    Alert.alert("Yakında", "Konum seçme akışı daha sonra bağlanacak.");
  };

  const handleArchive = () => {
    Alert.alert("Profili Arşivle", "İşletme profilini arşivleme akışı daha sonra bağlanacak.");
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Pressable style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.BrandPrimary} />
            </Pressable>
            <CustomText extraBold fontSize={19} color={Colors.BrandPrimary} style={styles.headerTitle}>
              İşletme bilgileri
            </CustomText>
          </View>
          <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={handleSave} disabled={isSaving}>
            <CustomText extraBold fontSize={12} color={Colors.BrandPrimary} letterSpacing={0.5}>
              {isSaving ? "KAYDEDİLİYOR..." : "KAYDET"}
            </CustomText>
          </Pressable>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 88, paddingBottom: insets.bottom + 120, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={24}
        keyboardOpeningTime={0}
      >
        {/* Temel bilgiler */}
        <View style={styles.section}>
          <View style={styles.fieldsStack}>
            <FormInput label="İşletme adı" value={businessName} onChangeText={setBusinessName} style={styles.input} />
            <FormInput label="Açıklama" value={description} onChangeText={setDescription} multiline style={styles.input} />
            <CustomSelect
              label="Kategori"
              value={category}
              style={styles.input}
              selectModalProps={{
                title: "Kategori seç",
                items: BUSINESS_CATEGORIES,
                selectedValue: category,
                onSelect: (item) => setCategory(item.value),
                isClearable: true,
                onClear: () => setCategory(""),
              }}
            />
            <FormInput label="Telefon numarası" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
            <FormInput label="WhatsApp numarası" value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" style={styles.input} />
            <FormInput label="Website / Sosyal Medya Linkleri" value={socialLinksText} onChangeText={setSocialLinksText} placeholder={LINKS_PLACEHOLDER} multiline style={styles.input} />
          </View>
        </View>

        {/* Galeri */}
        <View style={styles.section}>
          <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
            GALERİ
          </CustomText>

          <GallerySection
            title="MEKAN FOTOĞRAFLARI"
            photos={venuePhotos}
            onAdd={() => openPickerSheet(setVenuePhotos, "venue")}
            onRemove={(id) => setVenuePhotos((prev) => prev.filter((p) => p.id !== id))}
          />

          <GallerySection
            title="İŞLEM FOTOĞRAFLARI"
            photos={servicePhotos}
            onAdd={() => openPickerSheet(setServicePhotos, "service")}
            onRemove={(id) => setServicePhotos((prev) => prev.filter((p) => p.id !== id))}
          />
        </View>

        {/* Konum */}
        <View style={styles.section}>
          <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
            KONUM
          </CustomText>
          <View style={styles.locationCard}>
            <View style={styles.mapWrap}>
              <CustomImage uri={MAP_PLACEHOLDER} style={styles.mapImage} contentFit="cover" />
              <View style={styles.mapOverlay}>
                <View style={styles.pinWrap}>
                  <Ionicons name="location" size={22} color={Colors.Gold} />
                </View>
              </View>
              <Pressable style={({ pressed }) => [styles.changeLocationButton, pressed && styles.pressed]} onPress={handleChangeLocation}>
                <Ionicons name="location-outline" size={14} color={Colors.BrandPrimary} />
                <CustomText bold fontSize={10} color={Colors.BrandPrimary} letterSpacing={0.7}>
                  Konumu değiştir
                </CustomText>
              </Pressable>
            </View>
            <View style={styles.locationBody}>
              <CustomText medium fontSize={14} color={Colors.BrandPrimary} style={styles.addressText}>
                {address}
              </CustomText>
            </View>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.archiveButton, pressed && styles.pressed]} onPress={handleArchive}>
          <CustomText bold fontSize={10} color={Colors.ErrorColor} letterSpacing={1.8}>
            İŞLETME PROFİLİNİ ARŞİVLE
          </CustomText>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.BrandBackground },
  header: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderBottomWidth: 1, borderBottomColor: "rgba(20,20,20,0.04)",
    shadowColor: Colors.Black, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04, shadowRadius: 18, elevation: 6,
  },
  headerInner: {
    height: 64, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerIconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { letterSpacing: -0.5 },
  saveButton: { paddingHorizontal: 6, paddingVertical: 8 },
  scroll: { flex: 1 },
  section: { marginBottom: 28, gap: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionLabel: { paddingHorizontal: 2 },
  fieldsStack: { gap: 16 },
  input: { borderRadius: 18 },
  // Galeri
  gallerySection: { gap: 12 },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  addImageCard: {
    width: "30.5%", aspectRatio: 1, borderRadius: 22,
    borderWidth: 2, borderStyle: "dashed",
    borderColor: "rgba(212,175,55,0.22)", backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 10,
  },
  addImageLabel: { marginTop: 6, textAlign: "center" },
  galleryThumbWrap: { width: "30.5%", aspectRatio: 1, position: "relative" },
  galleryThumb: { width: "100%", height: "100%", borderRadius: 22 },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center",
  },
  galleryRemoveButton: {
    position: "absolute", top: -8, right: -8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.BrandPrimary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.White,
    shadowColor: Colors.Black, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
  },
  // Konum
  locationCard: {
    backgroundColor: Colors.White, borderRadius: 22, overflow: "hidden",
    shadowColor: Colors.Black, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04, shadowRadius: 24, elevation: 3,
  },
  mapWrap: { height: 208, position: "relative", backgroundColor: "#EFEFEF" },
  mapImage: { width: "100%", height: "100%", opacity: 0.86 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  pinWrap: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.BrandPrimary,
    shadowColor: Colors.Black, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 5,
  },
  changeLocationButton: {
    position: "absolute", right: 14, bottom: 14,
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 999, backgroundColor: "rgba(255,255,255,0.94)",
  },
  locationBody: { padding: 18 },
  addressText: { lineHeight: 22 },
  archiveButton: {
    minHeight: 56, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,59,48,0.18)",
    alignItems: "center", justifyContent: "center",
    marginTop: 8, backgroundColor: "rgba(255,59,48,0.02)",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
