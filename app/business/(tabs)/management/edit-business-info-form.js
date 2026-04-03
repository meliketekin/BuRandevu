import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import CommandBus from "@/infrastructures/command-bus/command-bus";
import FormInput from "@/components/high-level/custom-input";
import CustomSelect from "@/components/high-level/custom-select";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import ImageGallery from "@/components/high-level/image-gallery";
import FormBottomBar from "@/components/high-level/form-bottom-bar";
import LocationPickerModal from "@/components/high-level/location-picker-modal";
import { Colors } from "@/constants/colors";
import { BUSINESS_CATEGORIES, normalizeBusinessCategory } from "@/enums/business-category-enum";
import { CloudinaryConfig } from "@/config/app-config";

const MAP_PLACEHOLDER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPNOAETjH58OA-DfRCZTJ3NUAdnYVaAbUA3vs9PFDItQkEWT0oX5pmT4jtw6jbe1v9F43o7SQ-tDl-yV8lKUT2uGpbrgzBMeknnYFSUOipUCjZPh5cGk3WBuGCrvyhP_E1zMlXYCpYxmBsMsv0P0CZtwpDvlyD8u4V_HoRYBrrytwOIzfQP33qU6KSxR0blSPAyMkYeOEI1iSYeXSm6R0UjRzauDMyw5po_5HBWRz4eRNC5gdKjd6Apx3cFbEjHATZX8wfCDcM5Vg";

const DEFAULT_DESCRIPTION = "Premium hair and beard styling services in the heart of the city.";
const DEFAULT_ADDRESS = "123 Luxury Ave, Suite 400,\nNew York, NY 10001";
const LINKS_PLACEHOLDER = "https://ornek.com\nhttps://instagram.com/isletmeniz";
// Cloudinary URL'den public_id çıkarır
// https://res.cloudinary.com/{cloud}/image/upload/v123/burandevu/venue/abc.jpg → burandevu/venue/abc
function extractPublicId(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/);
  return match ? match[1] : null;
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
  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

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
        if (data?.latitude && data?.longitude) {
          setLocation({ latitude: data.latitude, longitude: data.longitude });
        }
        setPhone(data?.phone ?? "");
        setWhatsappNumber(data?.whatsappNumber ?? "");
        if (Array.isArray(data?.socialLinks)) {
          setSocialLinksText(data.socialLinks.join("\n"));
        } else {
          setSocialLinksText(data?.socialLinks ?? "");
        }
        if (Array.isArray(data?.venuePhotos)) {
          setVenuePhotos(data.venuePhotos.map((url, i) => ({ id: `venue-${i}`, uri: url, downloadUrl: url, publicId: extractPublicId(url) })));
        }
        if (Array.isArray(data?.servicePhotos)) {
          setServicePhotos(data.servicePhotos.map((url, i) => ({ id: `service-${i}`, uri: url, downloadUrl: url, publicId: extractPublicId(url) })));
        }
      })
      .catch(() => setBusinessName("Elite Grooming Co."));
  }, []);

  const uploadPhoto = useCallback(async (uri, folder) => {
    const formData = new FormData();
    formData.append("file", { uri, type: "image/jpeg", name: `${folder}_${Date.now()}.jpg` });
    formData.append("upload_preset", CloudinaryConfig.UPLOAD_PRESET);
    formData.append("folder", `burandevu/${folder}`);
    formData.append("quality", "auto");
    formData.append("fetch_format", "auto");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CloudinaryConfig.CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error(data.error?.message ?? "Upload failed");
    return { url: data.secure_url, publicId: data.public_id };
  }, []);


  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      CommandBus.sc.alertError("Hata", "Kullanıcı bulunamadı.", 2600);
      return;
    }

    setIsSaving(true);
    try {
      const resolvePhotos = async (photos, folder) =>
        Promise.all(
          photos.map(async (p) => {
            if (p.downloadUrl) return { url: p.downloadUrl, publicId: p.publicId };
            return uploadPhoto(p.uri, folder);
          })
        );

      const [resolvedVenue, resolvedService] = await Promise.all([
        resolvePhotos(venuePhotos, "venue"),
        resolvePhotos(servicePhotos, "service"),
      ]);

      const socialLinks = socialLinksText.split("\n").map((s) => s.trim()).filter(Boolean);

      const existingDoc = await getDoc(doc(db, "users", uid));
      const existingData = existingDoc.data() ?? {};
      const existingPublicIds = [
        ...(existingData.venuePhotos ?? []).map(extractPublicId),
        ...(existingData.servicePhotos ?? []).map(extractPublicId),
      ].filter(Boolean);
      const newPublicIds = new Set([
        ...resolvedVenue.map((r) => r.publicId),
        ...resolvedService.map((r) => r.publicId),
      ]);
      const nowOrphaned = existingPublicIds.filter((id) => id && !newPublicIds.has(id));
      const allOrphaned = [...new Set([...pendingDeleteIds, ...nowOrphaned])];

      await updateDoc(doc(db, "users", uid), {
        businessName: businessName.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        socialLinks,
        venuePhotos: resolvedVenue.map((r) => r.url),
        servicePhotos: resolvedService.map((r) => r.url),
        orphanedCloudinaryIds: allOrphaned,
        ...(location && { latitude: location.latitude, longitude: location.longitude }),
      });

      setVenuePhotos((prev) => prev.map((p, i) => ({ ...p, downloadUrl: resolvedVenue[i].url, publicId: resolvedVenue[i].publicId })));
      setServicePhotos((prev) => prev.map((p, i) => ({ ...p, downloadUrl: resolvedService[i].url, publicId: resolvedService[i].publicId })));
      setPendingDeleteIds([]);

      if (allOrphaned.length > 0) {
        console.log("Silinecek publicId'ler:", allOrphaned);
        fetch(CloudinaryConfig.SUPABASE_CLEANUP_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, orphanedIds: allOrphaned }),
        }).catch((e) => console.warn("Cloudinary cleanup failed:", e));
      }

      CommandBus.sc.alertSuccess("Kaydedildi", `${businessName.trim() || "İşletme"} bilgileri güncellendi.`, 2400);
    } catch (err) {
      console.error("handleSave error:", err);
      CommandBus.sc.alertError("Hata", "Bilgiler kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.", 3200);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeLocation = () => setLocationModalVisible(true);

  const handleArchive = () => {
    CommandBus.sc.alertInfo("Profili arşivle", "İşletme profilini arşivleme akışı daha sonra bağlanacak.", 2600);
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
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 88, paddingBottom: 120, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        enableResetScrollToCoords={false}
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

          <ImageGallery
            title="MEKAN FOTOĞRAFLARI"
            photos={venuePhotos}
            onAdd={(photo) => setVenuePhotos((prev) => [...prev, photo])}
            onRemove={(id) => {
              const removed = venuePhotos.find((p) => p.id === id);
              if (removed?.publicId) setPendingDeleteIds((prev) => [...prev, removed.publicId]);
              setVenuePhotos((prev) => prev.filter((p) => p.id !== id));
            }}
          />

          <ImageGallery
            title="İŞLEM FOTOĞRAFLARI"
            photos={servicePhotos}
            onAdd={(photo) => setServicePhotos((prev) => [...prev, photo])}
            onRemove={(id) => {
              const removed = servicePhotos.find((p) => p.id === id);
              if (removed?.publicId) setPendingDeleteIds((prev) => [...prev, removed.publicId]);
              setServicePhotos((prev) => prev.filter((p) => p.id !== id));
            }}
          />
        </View>

        {/* Konum */}
        <View style={styles.section}>
          <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
            KONUM
          </CustomText>
          <View style={styles.locationCard}>
            <View style={styles.mapWrap}>
              {location ? (
                <MapView
                  style={styles.mapImage}
                  region={{ ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  pointerEvents="none"
                >
                  <Marker coordinate={location} pinColor={Colors.Gold} />
                </MapView>
              ) : (
                <CustomImage uri={MAP_PLACEHOLDER} style={styles.mapImage} contentFit="cover" />
              )}
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

      <LocationPickerModal
        visible={locationModalVisible}
        initialLocation={location}
        initialAddress={address}
        onConfirm={({ latitude, longitude, address: newAddress }) => {
          setLocation({ latitude, longitude });
          setAddress(newAddress);
          setLocationModalVisible(false);
        }}
        onClose={() => setLocationModalVisible(false)}
      />

      <FormBottomBar label="Kaydet" onPress={handleSave} loading={isSaving} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.BrandBackground },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20,20,20,0.04)",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 6,
  },
  headerInner: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerIconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { letterSpacing: -0.5 },
  scroll: { flex: 1 },
  section: { marginBottom: 28, gap: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionLabel: { paddingHorizontal: 2 },
  fieldsStack: { gap: 16 },
  input: { borderRadius: 18 },
  // Konum
  locationCard: {
    backgroundColor: Colors.White,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  mapWrap: { height: 208, position: "relative", backgroundColor: "#EFEFEF" },
  mapImage: { width: "100%", height: "100%", opacity: 0.86 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  pinWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.BrandPrimary,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  changeLocationButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  locationBody: { padding: 18 },
  addressText: { lineHeight: 22 },
  archiveButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    backgroundColor: "rgba(255,59,48,0.02)",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
