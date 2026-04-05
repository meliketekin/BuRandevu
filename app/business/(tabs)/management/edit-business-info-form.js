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
import CustomText from "@/components/high-level/custom-text";
import ImageGallery from "@/components/high-level/image-gallery";
import FormBottomBar from "@/components/high-level/form-bottom-bar";
import LocationPickerModal from "@/components/high-level/location-picker-modal";
import SocialLinksEditor from "@/components/high-level/social-links-editor";
import { Colors } from "@/constants/colors";
import { BUSINESS_CATEGORIES, normalizeBusinessCategory } from "@/enums/business-category-enum";
import { CloudinaryConfig } from "@/config/app-config";

const INITIAL_FORM = {
  venuePhotos: [],
  servicePhotos: [],
  socialLinks: [],
};

function extractPublicId(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/);
  return match ? match[1] : null;
}

export default function EditBusinessInfoForm() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setForm({
          businessName: data?.businessName,
          category: normalizeBusinessCategory(data?.category ?? ""),
          description: data?.description,
          address: data?.address,
          phone: data?.phone,
          whatsappNumber: data?.whatsappNumber,
          socialLinks: Array.isArray(data?.socialLinks) ? data.socialLinks : [],
          venuePhotos: Array.isArray(data?.venuePhotos) ? data.venuePhotos.map((url, i) => ({ id: `venue-${i}`, uri: url, downloadUrl: url, publicId: extractPublicId(url) })) : [],
          servicePhotos: Array.isArray(data?.servicePhotos) ? data.servicePhotos.map((url, i) => ({ id: `service-${i}`, uri: url, downloadUrl: url, publicId: extractPublicId(url) })) : [],
          location: data?.latitude && data?.longitude ? { latitude: data.latitude, longitude: data.longitude } : null,
        });
      })
      .catch(() => setField("businessName", "Elite Grooming Co."));
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
          }),
        );

      const [resolvedVenue, resolvedService] = await Promise.all([resolvePhotos(form.venuePhotos, "venue"), resolvePhotos(form.servicePhotos, "service")]);

      const existingDoc = await getDoc(doc(db, "users", uid));
      const existingData = existingDoc.data() ?? {};
      const existingPublicIds = [...(existingData.venuePhotos ?? []).map(extractPublicId), ...(existingData.servicePhotos ?? []).map(extractPublicId)].filter(Boolean);
      const newPublicIds = new Set([...resolvedVenue.map((r) => r.publicId), ...resolvedService.map((r) => r.publicId)]);
      const nowOrphaned = existingPublicIds.filter((id) => id && !newPublicIds.has(id));
      const allOrphaned = [...new Set([...pendingDeleteIds, ...nowOrphaned])];

      await updateDoc(doc(db, "users", uid), {
        businessName: form.businessName.trim(),
        category: form.category,
        description: form.description.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        socialLinks: form.socialLinks,
        venuePhotos: resolvedVenue.map((r) => r.url),
        servicePhotos: resolvedService.map((r) => r.url),
        orphanedCloudinaryIds: allOrphaned,
        ...(form.location && { latitude: form.location.latitude, longitude: form.location.longitude }),
      });

      setForm((prev) => ({
        ...prev,
        venuePhotos: prev.venuePhotos.map((p, i) => ({ ...p, downloadUrl: resolvedVenue[i].url, publicId: resolvedVenue[i].publicId })),
        servicePhotos: prev.servicePhotos.map((p, i) => ({ ...p, downloadUrl: resolvedService[i].url, publicId: resolvedService[i].publicId })),
      }));
      setPendingDeleteIds([]);

      if (allOrphaned.length > 0) {
        console.log("Silinecek publicId'ler:", allOrphaned);
        fetch(CloudinaryConfig.SUPABASE_CLEANUP_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, orphanedIds: allOrphaned }),
        }).catch((e) => console.warn("Cloudinary cleanup failed:", e));
      }

      CommandBus.sc.alertSuccess("Kaydedildi", `${form.businessName.trim() || "İşletme"} bilgileri güncellendi.`, 2400);
    } catch (err) {
      console.error("handleSave error:", err);
      CommandBus.sc.alertError("Hata", "Bilgiler kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.", 3200);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeLocation = () => setLocationModalVisible(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.BrandPrimary} />
        </Pressable>
        <CustomText extraBold fontSize={22} color={Colors.BrandPrimary} style={styles.headerTitle}>
          İşletme bilgileri
        </CustomText>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 120, paddingHorizontal: 16 }}
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
            <FormInput label="İşletme adı" value={form.businessName} onChangeText={(v) => setField("businessName", v)} style={styles.input} />
            <FormInput label="Açıklama" value={form.description} onChangeText={(v) => setField("description", v)} multiline style={styles.input} />
            <CustomSelect
              label="Kategori"
              value={form.category}
              style={styles.input}
              selectModalProps={{
                title: "Kategori seç",
                items: BUSINESS_CATEGORIES,
                selectedValue: form.category,
                onSelect: (item) => setField("category", item.value),
                isClearable: true,
                onClear: () => setField("category", ""),
              }}
            />
            <FormInput label="Telefon numarası" value={form.phone} onChangeText={(v) => setField("phone", v)} keyboardType="phone-pad" style={styles.input} />
            <FormInput label="WhatsApp numarası" value={form.whatsappNumber} onChangeText={(v) => setField("whatsappNumber", v)} keyboardType="phone-pad" style={styles.input} />
            <SocialLinksEditor links={form.socialLinks} onChange={(links) => setField("socialLinks", links)} />
          </View>
        </View>

        {/* Galeri */}
        <View style={styles.section}>
          <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
            GALERİ
          </CustomText>

          <ImageGallery
            title="MEKAN FOTOĞRAFLARI"
            contentHorizontalPadding={32}
            photos={form.venuePhotos}
            onAdd={(newPhotos) => setForm((prev) => ({ ...prev, venuePhotos: [...prev.venuePhotos, ...newPhotos] }))}
            onRemove={(id) => {
              const removed = form.venuePhotos.find((p) => p.id === id);
              if (removed?.publicId) setPendingDeleteIds((prev) => [...prev, removed.publicId]);
              setField(
                "venuePhotos",
                form.venuePhotos.filter((p) => p.id !== id),
              );
            }}
          />

          <ImageGallery
            title="İŞLEM FOTOĞRAFLARI"
            contentHorizontalPadding={32}
            photos={form.servicePhotos}
            onAdd={(newPhotos) => setForm((prev) => ({ ...prev, servicePhotos: [...prev.servicePhotos, ...newPhotos] }))}
            onRemove={(id) => {
              const removed = form.servicePhotos.find((p) => p.id === id);
              if (removed?.publicId) setPendingDeleteIds((prev) => [...prev, removed.publicId]);
              setField(
                "servicePhotos",
                form.servicePhotos.filter((p) => p.id !== id),
              );
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
              {form.location ? (
                <MapView
                  style={styles.mapImage}
                  region={{ ...form.location, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  pointerEvents="none"
                >
                  <Marker coordinate={form.location} pinColor={Colors.Gold} />
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={40} color="#C0C0C0" />
                  <CustomText fontSize={12} color="#C0C0C0" style={{ marginTop: 8 }}>
                    Konum seçilmedi
                  </CustomText>
                </View>
              )}
              <Pressable style={({ pressed }) => [styles.changeLocationButton, pressed && styles.pressed]} onPress={handleChangeLocation}>
                <Ionicons name="location-outline" size={14} color={Colors.BrandPrimary} />
                <CustomText bold fontSize={10} color={Colors.BrandPrimary} letterSpacing={0.7}>
                  Konumu değiştir
                </CustomText>
              </Pressable>
            </View>
            {form.location && form.address ? (
              <View style={styles.locationBody}>
                <CustomText medium fontSize={14} color={Colors.BrandPrimary} style={styles.addressText}>
                  {form.address}
                </CustomText>
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAwareScrollView>

      <LocationPickerModal
        visible={locationModalVisible}
        initialLocation={form.location}
        initialAddress={form.address}
        onConfirm={({ latitude, longitude, address: newAddress }) => {
          setForm((prev) => ({ ...prev, location: { latitude, longitude }, address: newAddress }));
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.BrandBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(20,20,20,0.05)",
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { letterSpacing: -0.5 },
  headerRightSpacer: { width: 40, height: 40 },
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
  mapPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F5" },
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
