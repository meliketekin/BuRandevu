import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import FormInput from "@/components/high-level/custom-input";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";
import { BUSINESS_CATEGORIES, normalizeBusinessCategory } from "@/enums/business-category-enum";

const GALLERY_IMAGES = [
  {
    id: "1",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCehl_5Bfgd8IOEWtl4sxY86eCr5t1n4a_Fdd9su_dCAwldqgBG4tGhtJg1J_Hyi9Pt7kRjoPSRegms2CI7OaTlFlFoI84UyiJrP0MpByboowHIStEB7RewlP2XPS2DF73aQ-RZQMtw5q6IOvHqY0v1zCNnZXiKG6DiXUZw-cgwU9Lxu2RBt0JIEGgKqUTLbARSwYo1SqhXqG3zDULfB4d1lLjsN9QuEPH7FJcE2hgqhWPDVTzXaRyU6aPP6Sr3gsXhvdaevJEe_KI",
  },
  {
    id: "2",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaIIrrY4V0DIHW-2QscxVYeYTwnunXLik7qw2nmeNNogn1vekrpkiw3A-LgAVtiMFsUdjAzJOM8Msxa8UzImEl5z3RNEkr9lXW52I1F4YLDcwr2A8SKnf7kJctrcKB-XX7Mln1-lS0DpXKP5m1AuRpRvmGbCLEUrOqGYIomM1EOyhDTJoIFQOJ6eHM13fKKKriWD7fMk-dpNVwWrxv1Q4V1sBvbP4ozN9XGqSrxauL0Uy32MeCL4PYDN-Ypb4EK6klMZGn7km_5KE",
  },
  {
    id: "3",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzk9Syc9lYy65Xjh3OSd__6Xl99rjExog0KfqzGhjyizxfxZpY8B89Tob7uUzX-U3joBH-T1JEJrxp8L0-l-6AvzzMsMPcTBBulBCI5jbWjJS-55ClEA11DmEDmgloW7eghgl2gRWCSAuEBWYdoswKUNG7JqPEXKqHckHIAON_IKQnQd-q3y4TQE3HSiYLpKYRuT6Pp4AYtvjPc6kEDTkmABbH5LGXrO81vI1pRJmBt3njoNbvIkBh9knqe3H5WamewZST6WxnrqI",
  },
  {
    id: "4",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJQm6WRL4UUmiJp9BrYYckxdGeekk3Ku1DXfb7Bt8qAKA1wiCidXfDARuHQeeGqMJXe10RMjqy9OLvCEDWaCGjBUelLKm9fxnzGZCfFckSODdmdmAhq1l5iyzuBg0rtOcQjPT-FTYwaTsNWeeyZE__9-bVAr6r101tqdt6uzwgAV7k4_g0-az9S2fNzMvozQm2NKO-hcbZAdNAwtDZFzeO2wT3EwmyYFvzL3sbj4MNhAUrNTni0g44YL8KWvDlG0Mkgq93JO38emI",
  },
];

const MAP_PLACEHOLDER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPNOAETjH58OA-DfRCZTJ3NUAdnYVaAbUA3vs9PFDItQkEWT0oX5pmT4jtw6jbe1v9F43o7SQ-tDl-yV8lKUT2uGpbrgzBMeknnYFSUOipUCjZPh5cGk3WBuGCrvyhP_E1zMlXYCpYxmBsMsv0P0CZtwpDvlyD8u4V_HoRYBrrytwOIzfQP33qU6KSxR0blSPAyMkYeOEI1iSYeXSm6R0UjRzauDMyw5po_5HBWRz4eRNC5gdKjd6Apx3cFbEjHATZX8wfCDcM5Vg";

const DEFAULT_DESCRIPTION = "Premium hair and beard styling services in the heart of the city.";
const DEFAULT_ADDRESS = "123 Luxury Ave, Suite 400,\nNew York, NY 10001";
const LINKS_PLACEHOLDER = "https://ornek.com\nhttps://instagram.com/isletmeniz";

function GalleryItem({ item, onRemove }) {
  return (
    <View style={styles.galleryThumbWrap}>
      <CustomImage uri={item.uri} style={styles.galleryThumb} contentFit="cover" />
      <Pressable style={({ pressed }) => [styles.galleryRemoveButton, pressed && styles.pressed]} onPress={onRemove}>
        <Ionicons name="close" size={16} color={Colors.White} />
      </Pressable>
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
  const [gallery, setGallery] = useState(GALLERY_IMAGES);
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
      })
      .catch(() => {
        setBusinessName("Elite Grooming Co.");
      });
  }, []);

  const galleryCountLabel = useMemo(() => `${gallery.length} / 12 fotoğraf`, [gallery.length]);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Hata", "Kullanıcı bulunamadı.");
      return;
    }

    setIsSaving(true);
    try {
      const socialLinks = socialLinksText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      await updateDoc(doc(db, "users", uid), {
        businessName: businessName.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        socialLinks,
      });

      Alert.alert("Kaydedildi", `${businessName || "İşletme"} bilgileri güncellendi.`);
    } catch {
      Alert.alert("Hata", "Bilgiler kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImage = () => {
    Alert.alert("Yakında", "Galeriye görsel ekleme akışı daha sonra bağlanacak.");
  };

  const handleRemoveImage = (id) => {
    setGallery((prev) => prev.filter((item) => item.id !== id));
  };

  const handleChangeLocation = () => {
    Alert.alert("Yakında", "Konum seçme akışı daha sonra bağlanacak.");
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
              {isSaving ? "KAYDEDILIYOR..." : "KAYDET"}
            </CustomText>
          </Pressable>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 88,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={24}
        keyboardOpeningTime={0}
      >
        <View style={styles.section}>
          <View style={styles.fieldsStack}>
            <FormInput label="İşletme adı" value={businessName} onChangeText={setBusinessName} height={62} style={styles.input} />

            <FormInput label="Açıklama" value={description} onChangeText={setDescription} multiline height={120} style={styles.input} />

            <View style={styles.categoryGroup}>
              <CustomText bold fontSize={11} color={Colors.LightGray2} letterSpacing={1}>
                Kategori
              </CustomText>
              <View style={styles.categoriesGrid}>
                {BUSINESS_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Pressable key={cat} style={[styles.categoryChip, isSelected && styles.categoryChipActive]} onPress={() => setCategory(cat)}>
                      <CustomText bold fontSize={11} color={isSelected ? Colors.White : Colors.LightGray2}>
                        {cat}
                      </CustomText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <FormInput label="Telefon numarası" value={phone} onChangeText={setPhone} keyboardType="phone-pad" height={62} style={styles.input} />

            <FormInput label="WhatsApp numarası" value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" height={62} style={styles.input} />

            <FormInput label="Website / Sosyal Medya Linkleri" value={socialLinksText} onChangeText={setSocialLinksText} placeholder={LINKS_PLACEHOLDER} multiline height={132} style={styles.input} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <CustomText bold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
              GALERİ
            </CustomText>
            <CustomText bold fontSize={10} color="rgba(80,83,89,0.64)" letterSpacing={1.2}>
              {galleryCountLabel.toUpperCase()}
            </CustomText>
          </View>

          <View style={styles.galleryGrid}>
            <Pressable style={({ pressed }) => [styles.addImageCard, pressed && styles.pressed]} onPress={handleAddImage}>
              <Ionicons name="add" size={28} color={Colors.Gold} />
              <CustomText bold fontSize={10} color={Colors.Gold} letterSpacing={0.8} style={styles.addImageLabel}>
                Görsel ekle
              </CustomText>
            </Pressable>

            {gallery.map((item) => (
              <GalleryItem key={item.id} item={item} onRemove={() => handleRemoveImage(item.id)} />
            ))}
          </View>
        </View>

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
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BrandBackground,
  },
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
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    letterSpacing: -0.5,
  },
  saveButton: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginBottom: 28,
    gap: 12,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionLabel: {
    paddingHorizontal: 2,
  },
  fieldsStack: {
    gap: 16,
  },
  input: {
    borderRadius: 18,
    minHeight: 62,
  },
  categoryGroup: {
    gap: 10,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    backgroundColor: Colors.BrandBackground,
  },
  categoryChipActive: {
    backgroundColor: Colors.BrandPrimary,
    borderColor: Colors.BrandPrimary,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  addImageCard: {
    width: "30.5%",
    aspectRatio: 1,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(212,175,55,0.22)",
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  addImageLabel: {
    marginTop: 6,
    textAlign: "center",
  },
  galleryThumbWrap: {
    width: "30.5%",
    aspectRatio: 1,
    position: "relative",
  },
  galleryThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  galleryRemoveButton: {
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
  mapWrap: {
    height: 208,
    position: "relative",
    backgroundColor: "#EFEFEF",
  },
  mapImage: {
    width: "100%",
    height: "100%",
    opacity: 0.86,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
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
  locationBody: {
    padding: 18,
  },
  addressText: {
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
