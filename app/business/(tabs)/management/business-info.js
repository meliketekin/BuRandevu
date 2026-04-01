import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import FormInput from "@/components/high-level/custom-input";
import CustomImage from "@/components/high-level/custom-image";
import CustomText from "@/components/high-level/custom-text";
import { Colors } from "@/constants/colors";

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

export default function BusinessInfoScreen() {
  const insets = useSafeAreaInsets();
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [gallery, setGallery] = useState(GALLERY_IMAGES);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!snap.exists()) return;

        const data = snap.data();
        setBusinessName(data?.businessName ?? "Elite Grooming Co.");
        setDescription(data?.description ?? DEFAULT_DESCRIPTION);
        setAddress(data?.address ?? DEFAULT_ADDRESS);
      })
      .catch(() => {
        setBusinessName("Elite Grooming Co.");
      });
  }, []);

  const galleryCountLabel = useMemo(() => `${gallery.length} / 12 Foto`, [gallery.length]);

  const handleSave = () => {
    Alert.alert("Taslak Kaydedildi", `${businessName || "Isletme"} bilgileri kayit icin hazirlandi.`);
  };

  const handleAddImage = () => {
    Alert.alert("Yakinda", "Galeriye gorsel ekleme akisi daha sonra baglanacak.");
  };

  const handleRemoveImage = (id) => {
    setGallery((prev) => prev.filter((item) => item.id !== id));
  };

  const handleChangeLocation = () => {
    Alert.alert("Yakinda", "Konum secme akisi daha sonra baglanacak.");
  };

  const handleArchive = () => {
    Alert.alert("Profili Arsivle", "Isletme profilini arsivleme akisi daha sonra baglanacak.");
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
              Isletme Bilgileri
            </CustomText>
          </View>

          <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={handleSave}>
            <CustomText extraBold fontSize={12} color={Colors.BrandPrimary} letterSpacing={0.5}>
              KAYDET
            </CustomText>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 88,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
            TEMEL DETAYLAR
          </CustomText>

          <View style={styles.card}>
            <FormInput
              label="Isletme Adi"
              value={businessName}
              onChangeText={setBusinessName}
              height={62}
              style={styles.input}
              backgroundColor={Colors.BrandBackground}
              borderColor="transparent"
            />

            <FormInput
              label="Aciklama"
              value={description}
              onChangeText={setDescription}
              multiline
              height={120}
              style={styles.input}
              backgroundColor={Colors.BrandBackground}
              borderColor="transparent"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
              GALERI
            </CustomText>
            <CustomText interBold fontSize={10} color="rgba(80,83,89,0.64)" letterSpacing={1.2}>
              {galleryCountLabel.toUpperCase()}
            </CustomText>
          </View>

          <View style={styles.galleryGrid}>
            <Pressable style={({ pressed }) => [styles.addImageCard, pressed && styles.pressed]} onPress={handleAddImage}>
              <Ionicons name="add" size={28} color={Colors.Gold} />
              <CustomText interBold fontSize={10} color={Colors.Gold} letterSpacing={0.8} style={styles.addImageLabel}>
                Gorsel Ekle
              </CustomText>
            </Pressable>

            {gallery.map((item) => (
              <GalleryItem key={item.id} item={item} onRemove={() => handleRemoveImage(item.id)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <CustomText interBold fontSize={10} color={Colors.LightGray2} letterSpacing={1.8} style={styles.sectionLabel}>
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
                <CustomText interBold fontSize={10} color={Colors.BrandPrimary} letterSpacing={0.7}>
                  Konumu Degistir
                </CustomText>
              </Pressable>
            </View>

            <View style={styles.locationBody}>
              <CustomText interMedium fontSize={14} color={Colors.BrandPrimary} style={styles.addressText}>
                {address}
              </CustomText>
            </View>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.archiveButton, pressed && styles.pressed]} onPress={handleArchive}>
          <CustomText interBold fontSize={10} color={Colors.ErrorColor} letterSpacing={1.8}>
            ISLETME PROFILINI ARSIVLE
          </CustomText>
        </Pressable>
      </ScrollView>
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
  card: {
    backgroundColor: Colors.White,
    borderRadius: 22,
    padding: 18,
    gap: 16,
    shadowColor: Colors.Black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  input: {
    borderRadius: 18,
    minHeight: 62,
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
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
