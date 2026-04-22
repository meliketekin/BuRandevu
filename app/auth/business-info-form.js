import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import useAuthStore from "@/store/auth-store";
import LayoutView from "@/components/high-level/layout-view";
import FormInput from "@/components/high-level/custom-input";
import CustomSelect from "@/components/high-level/custom-select";
import CustomText from "@/components/high-level/custom-text";
import ImageGallery from "@/components/high-level/image-gallery";
import FormBottomBar from "@/components/high-level/form-bottom-bar";
import LocationPickerModal from "@/components/high-level/location-picker-modal";
import SocialLinksEditor from "@/components/high-level/social-links-editor";
import { openModal, ModalTypeEnum } from "@/components/high-level/modal-renderer";
import { Colors } from "@/constants/colors";
import { BUSINESS_CATEGORIES } from "@/enums/business-category-enum";
import { CloudinaryConfig } from "@/config/app-config";
import Validator from "@/infrastructures/validation";

function buildForm() {
  return {
    category: "",
    description: "",
    whatsappNumber: "",
    socialLinks: [],
    venuePhotos: [],
    servicePhotos: [],
    location: null,
    address: "",
  };
}

export default function BusinessInfoForm() {
  const [form, setForm] = useState(buildForm);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [validator] = useState(() => new Validator());
  const validatorScopeKey = validator.scopeKey;
  const user = useAuthStore((s) => s.user);
  const setBusinessInfoCompleted = useAuthStore((s) => s.setBusinessInfoCompleted);

  const firstName = user?.displayName?.split(" ")[0] ?? "";

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "businesses", user.uid)).then((snap) => {
      if (snap.exists()) setBusinessName(snap.data()?.businessName ?? "");
    });
  }, [user?.uid]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // --- Validations ---
  const categoryError = validator.registerDestructuring({
    name: "category",
    value: form.category,
    rules: [{ rule: "required", value: 1 }],
    validatorScopeKey,
  });

  const venuePhotosError = validator.registerDestructuring({
    name: "venuePhotos",
    value: form.venuePhotos,
    rules: [{ rule: "minArrayLengthRequired", value: 1 }],
    validatorScopeKey,
  });

  const locationError = validator.registerDestructuring({
    name: "location",
    value: form.location,
    rules: [{ rule: "required", value: 1 }],
    validatorScopeKey,
  });

  // --- Helpers ---
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

  const confirmPhotoRemoval = useCallback(
    (photoType, id) => {
      openModal(ModalTypeEnum.ConfirmModal, {
        title: "Foto silinsin mi?",
        message: `${photoType} galerinizden kaldırılacak. Emin misiniz?`,
        confirmText: "Sil",
        cancelText: "Vazgeç",
        destructiveConfirm: true,
        onConfirm: () => {
          if (photoType === "Mekan fotoğrafı") {
            setField("venuePhotos", form.venuePhotos.filter((p) => p.id !== id));
            return;
          }
          setField("servicePhotos", form.servicePhotos.filter((p) => p.id !== id));
        },
      });
    },
    [form.servicePhotos, form.venuePhotos],
  );

  const handleSave = useCallback(async () => {
    if (!validator.allValid()) {
      setSubmitted(true);
      return;
    }
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      const resolvePhotos = async (photos, folder) =>
        Promise.all(
          photos.map(async (p) => {
            if (p.downloadUrl) return { url: p.downloadUrl, publicId: p.publicId };
            return uploadPhoto(p.uri, folder);
          }),
        );

      const [resolvedVenue, resolvedService] = await Promise.all([
        resolvePhotos(form.venuePhotos, "venue"),
        resolvePhotos(form.servicePhotos, "service"),
      ]);

      await Promise.all([
        setDoc(
          doc(db, "businesses", user.uid),
          {
            category: form.category,
            description: form.description.trim(),
            whatsappNumber: form.whatsappNumber.trim(),
            socialLinks: form.socialLinks,
            venuePhotos: resolvedVenue.map((r) => r.url),
            servicePhotos: resolvedService.map((r) => r.url),
            address: form.address,
            latitude: form.location.latitude,
            longitude: form.location.longitude,
          },
          { merge: true },
        ),
        updateDoc(doc(db, "users", user.uid), { isBusinessInfoCompleted: true }),
      ]);

      setBusinessInfoCompleted();
      router.replace("/business");
    } catch (err) {
      console.error("BusinessInfoForm handleSave error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [form, uploadPhoto, user, setBusinessInfoCompleted, validator]);

  return (
    <LayoutView isActiveHeader={false} backgroundColor={Colors.BrandBackground} paddingHorizontal={0}>
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        enableResetScrollToCoords={false}
        extraScrollHeight={24}
        keyboardOpeningTime={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <CustomText bold fontSize={24} color={Colors.BrandPrimary} style={styles.headerGreeting}>
            Merhaba, {firstName} 👋
          </CustomText>
          {businessName ? (
            <View style={styles.headerBusinessRow}>
              <Ionicons name="storefront-outline" size={14} color={Colors.LightGray} />
              <CustomText fontSize={14} color={Colors.LightGray2} semibold>
                {businessName}
              </CustomText>
            </View>
          ) : null}
          <CustomText md color={Colors.LightGray2} style={styles.headerSubtitle}>
            İşletme profilinizi tamamlayarak müşterilerinizin sizi bulmasını sağlayın.
          </CustomText>
        </View>

        {/* Kategori */}
        <View style={styles.section}>
          <CustomSelect
            label="Kategori"
            required
            value={form.category}
            style={styles.input}
            error={submitted && categoryError ? categoryError : null}
            selectModalProps={{
              title: "Kategori seç",
              items: BUSINESS_CATEGORIES,
              selectedValue: form.category,
              onSelect: (item) => setField("category", item.value),
              isClearable: true,
              onClear: () => setField("category", ""),
            }}
          />
        </View>

        {/* Diğer alanlar */}
        <View style={styles.section}>
          <View style={styles.fieldsStack}>
            <FormInput label="Açıklama" value={form.description} onChangeText={(v) => setField("description", v)} multiline style={styles.input} />
            <FormInput
              label="WhatsApp numarası"
              value={form.whatsappNumber}
              onChangeText={(v) => setField("whatsappNumber", v)}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <SocialLinksEditor links={form.socialLinks} onChange={(links) => setField("socialLinks", links)} />
          </View>
        </View>

        {/* Galeri */}
        <View style={styles.section}>
          <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
            GALERİ
          </CustomText>
          <ImageGallery
            title="MEKAN FOTOĞRAFLARI *"
            contentHorizontalPadding={32}
            photos={form.venuePhotos}
            onAdd={(newPhotos) => setForm((prev) => ({ ...prev, venuePhotos: [...prev.venuePhotos, ...newPhotos] }))}
            onRemove={(id) => confirmPhotoRemoval("Mekan fotoğrafı", id)}
          />
          {submitted && venuePhotosError ? (
            <CustomText fontSize={12} color={Colors.ErrorColor} style={styles.errorText}>
              En az 1 mekan fotoğrafı ekleyin.
            </CustomText>
          ) : null}
          <ImageGallery
            title="İŞLEM FOTOĞRAFLARI"
            contentHorizontalPadding={32}
            photos={form.servicePhotos}
            onAdd={(newPhotos) => setForm((prev) => ({ ...prev, servicePhotos: [...prev.servicePhotos, ...newPhotos] }))}
            onRemove={(id) => confirmPhotoRemoval("İşlem fotoğrafı", id)}
          />
        </View>

        {/* Konum */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
              KONUM *
            </CustomText>
            {submitted && locationError ? (
              <CustomText fontSize={12} color={Colors.ErrorColor}>
                Konum seçimi zorunludur.
              </CustomText>
            ) : null}
          </View>

          <Pressable
            onPress={() => setLocationModalVisible(true)}
            style={({ pressed }) => [styles.locationCard, pressed && styles.pressed]}
          >
            {form.location ? (
              <>
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
                <View style={styles.mapEditBadge}>
                  <Ionicons name="pencil" size={12} color={Colors.BrandPrimary} />
                  <CustomText bold fontSize={11} color={Colors.BrandPrimary} letterSpacing={0.4}>
                    Konumu düzenle
                  </CustomText>
                </View>
                {form.address ? (
                  <View style={styles.addressBadge}>
                    <Ionicons name="location" size={13} color={Colors.Gold} />
                    <CustomText fontSize={13} color={Colors.BrandPrimary} style={styles.addressBadgeText} numberOfLines={1}>
                      {form.address}
                    </CustomText>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.locationPlaceholder}>
                <View style={styles.ring1} />
                <View style={styles.ring2} />
                <View style={styles.ring3} />

                <View style={styles.locationIconWrap}>
                  <Ionicons name="location" size={30} color={Colors.BrandPrimary} />
                </View>
                <CustomText bold fontSize={15} color={Colors.BrandPrimary} center style={{ marginTop: 14, letterSpacing: 0.2 }}>
                  Konum Seç
                </CustomText>
                <CustomText fontSize={12} color={Colors.LightGray} center style={{ marginTop: 4, lineHeight: 18 }}>
                  İşletmenizin haritada görüneceği{"\n"}konumu belirleyin
                </CustomText>

                <View style={styles.locationCta}>
                  <Ionicons name="add-circle-outline" size={15} color={Colors.White} />
                  <CustomText bold fontSize={12} color={Colors.White} letterSpacing={0.4}>
                    Konum Ekle
                  </CustomText>
                </View>
              </View>
            )}
          </Pressable>
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

      <FormBottomBar label="Devam Et" onPress={handleSave} loading={isSaving} />
    </LayoutView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 120, paddingHorizontal: 16 },
  section: { marginBottom: 24, gap: 12 },
  sectionLabel: { paddingHorizontal: 2 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  fieldsStack: { gap: 16 },
  input: { borderRadius: 18 },
  errorText: { marginLeft: 4, marginTop: -4 },

  header: { marginBottom: 28, gap: 6 },
  headerGreeting: { lineHeight: 30 },
  headerBusinessRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerSubtitle: { lineHeight: 21, marginTop: 4 },

  // Location
  locationCard: {
    borderRadius: 22,
    overflow: "hidden",
    height: 220,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  mapImage: { width: "100%", height: "100%" },
  mapEditBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  addressBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  addressBadgeText: { flex: 1 },

  // Boş konum placeholder
  locationPlaceholder: {
    flex: 1,
    backgroundColor: Colors.White,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1.5,
    borderColor: Colors.BorderColor,
    borderRadius: 22,
    borderStyle: "dashed",
  },
  ring1: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.04)",
  },
  ring2: {
    position: "absolute",
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.06)",
  },
  ring3: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.08)",
  },
  locationIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.BrandBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  locationCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: Colors.BrandPrimary,
  },

  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
