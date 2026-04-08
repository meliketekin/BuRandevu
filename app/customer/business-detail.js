import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Linking, Modal, Pressable, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import LayoutView from "@/components/high-level/layout-view";
import CustomButton from "@/components/high-level/custom-button";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import CustomerServiceItem from "@/components/customer/service-item";
import CustomerTeamMember from "@/components/customer/team-member";
import { Colors } from "@/constants/colors";
import CommandBus from "@/infrastructures/command-bus/command-bus";

const DAYS_ORDER = [
  { dayIndex: 1, label: "Pazartesi" },
  { dayIndex: 2, label: "Salı" },
  { dayIndex: 3, label: "Çarşamba" },
  { dayIndex: 4, label: "Perşembe" },
  { dayIndex: 5, label: "Cuma" },
  { dayIndex: 6, label: "Cumartesi" },
  { dayIndex: 0, label: "Pazar" },
];

const STATIC_RATING = "4.8";
const STATIC_REVIEW_COUNT = 124;
const STATIC_REVIEW_DISTRIBUTION = [
  { label: "5", percent: 78 },
  { label: "4", percent: 15 },
  { label: "3", percent: 4 },
];
function getBusinessStatus(workingHours) {
  if (!workingHours) return { isOpen: false, label: null };

  const now = new Date();
  const dayIndex = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayEntry = workingHours[String(dayIndex)];

  const parseMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  if (todayEntry?.enabled) {
    const start = parseMinutes(todayEntry.start);
    const end = parseMinutes(todayEntry.end);

    if (currentMinutes >= start && currentMinutes < end) {
      return { isOpen: true, label: `${todayEntry.end}'de kapanıyor` };
    }
    if (currentMinutes < start) {
      return { isOpen: false, label: `${todayEntry.start}'de açılıyor` };
    }
  }

  // Bugün kapalı — sonraki açık günü bul
  for (let offset = 1; offset <= 7; offset++) {
    const nextDayIndex = (dayIndex + offset) % 7;
    const nextEntry = workingHours[String(nextDayIndex)];
    if (nextEntry?.enabled) {
      const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
      const label = offset === 1 ? `Yarın ${nextEntry.start}'de açılıyor` : `${dayNames[nextDayIndex]} ${nextEntry.start}'de açılıyor`;
      return { isOpen: false, label };
    }
  }

  return { isOpen: false, label: "Kapalı" };
}

const BusinessDetail = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const businessId = Array.isArray(id) ? id[0] : id;

  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [lightbox, setLightbox] = useState({ visible: false, images: [], index: 0 });
  const lightboxRef = useRef(null);

  useEffect(() => {
    if (!businessId) return;

    const todayIndex = String(new Date().getDay());
    const uid = auth.currentUser?.uid;

    const favRef = uid ? getDoc(doc(db, "users", uid, "favorites", businessId)) : Promise.resolve(null);

    Promise.all([getDoc(doc(db, "businesses", businessId)), getDocs(collection(db, "businesses", businessId, "services")), getDocs(collection(db, "businesses", businessId, "employees")), favRef])
      .then(([businessSnap, servicesSnap, employeesSnap, favSnap]) => {
        if (businessSnap.exists()) {
          setBusiness({ id: businessSnap.id, ...businessSnap.data() });
        }

        setServices(
          servicesSnap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: data.name,
                description: data.description ?? "",
                duration: `${data.durationMinutes} dk`,
                price: `₺${Number(data.price).toLocaleString("tr-TR")}`,
                isActive: data.isActive ?? true,
              };
            })
            .filter((s) => s.isActive),
        );

        setTeamMembers(
          employeesSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              imageUri: data.photoUrl ?? null,
              active: data.workingHours?.[todayIndex]?.enabled ?? false,
            };
          }),
        );

        if (favSnap?.exists()) {
          setIsFavorite(true);
        }
      })
      .catch((err) => console.error("BusinessDetail load error:", err))
      .finally(() => setLoading(false));
  }, [businessId]);

  const handleToggleFavorite = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || favoriteLoading) return;

    setFavoriteLoading(true);
    const favRef = doc(db, "users", uid, "favorites", businessId);

    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
        CommandBus.sc.alertSuccess("Favori kaldırıldı", "İşletme favorilerinizden kaldırıldı.", 2200);
      } else {
        await setDoc(favRef, { businessId, savedAt: new Date() });
        setIsFavorite(true);
        CommandBus.sc.alertSuccess("Favori eklendi", "İşletme favorilerinize eklendi.", 2200);
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleOpenMaps = (address) => {
    const query = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const openLightbox = (images, index) => setLightbox({ visible: true, images, index });
  const closeLightbox = () => setLightbox({ visible: false, images: [], index: 0 });

  const title = business?.businessName ?? "İşletme";
  const location = business?.address ?? "";
  const venuePhotos = Array.isArray(business?.venuePhotos) ? business.venuePhotos : [];
  const operationPhotos = Array.isArray(business?.servicePhotos) ? business.servicePhotos : [];
  const businessStatus = getBusinessStatus(business?.workingHours);
  const hasVenue = venuePhotos.length > 0;
  const hasOperation = operationPhotos.length > 0;
  const firstService = services[0] ?? null;

  if (loading) {
    return (
      <LayoutView showBackButton title="" paddingHorizontal={0}>
        <ActivityIndicator size="large" color={Colors.BrandPrimary} style={styles.loader} />
      </LayoutView>
    );
  }

  return (
    <LayoutView
      showBackButton
      title={title}
      rightButton={
        <CustomTouchableOpacity activeOpacity={0.7} onPress={handleToggleFavorite} disabled={favoriteLoading}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? Colors.BrandGold : Colors.BrandPrimary} />
        </CustomTouchableOpacity>
      }
      style={styles.contentWrapper}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
        {hasVenue && (
          <View style={styles.photoSection}>
            <View style={styles.photoSectionHeader}>
              <Ionicons name="business-outline" size={15} color={Colors.BrandPrimary} />
              <CustomText bold sm color={Colors.BrandPrimary}>
                Mekan
              </CustomText>
              <CustomText xs color={Colors.LightGray}>
                {venuePhotos.length} fotoğraf
              </CustomText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {venuePhotos.map((uri, index) => (
                <CustomTouchableOpacity key={`venue-${index}`} activeOpacity={0.88} onPress={() => openLightbox(venuePhotos, index)}>
                  <View style={styles.photoThumb}>
                    <Image source={{ uri }} style={styles.photoThumbImg} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                    <View style={styles.photoExpandIcon}>
                      <Ionicons name="expand-outline" size={13} color={Colors.White} />
                    </View>
                  </View>
                </CustomTouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {hasOperation && (
          <View style={styles.photoSection}>
            <View style={styles.photoSectionHeader}>
              <Ionicons name="cut-outline" size={15} color={Colors.BrandPrimary} />
              <CustomText bold sm color={Colors.BrandPrimary}>
                İşlem Fotoğrafları
              </CustomText>
              <CustomText xs color={Colors.LightGray}>
                {operationPhotos.length} fotoğraf
              </CustomText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {operationPhotos.map((uri, index) => (
                <CustomTouchableOpacity key={`op-${index}`} activeOpacity={0.88} onPress={() => openLightbox(operationPhotos, index)}>
                  <View style={styles.photoThumb}>
                    <Image source={{ uri }} style={styles.photoThumbImg} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                    <View style={styles.photoExpandIcon}>
                      <Ionicons name="expand-outline" size={13} color={Colors.White} />
                    </View>
                  </View>
                </CustomTouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Modal visible={lightbox.visible} transparent animationType="fade" onRequestClose={closeLightbox} statusBarTranslucent>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={styles.lightboxOverlay}>
            <Pressable style={styles.lightboxClose} onPress={closeLightbox}>
              <Ionicons name="close" size={26} color={Colors.White} />
            </Pressable>
            <CustomText xs color="rgba(255,255,255,0.6)" style={styles.lightboxCounter}>
              {lightbox.index + 1} / {lightbox.images.length}
            </CustomText>
            <FlatList
              ref={lightboxRef}
              data={lightbox.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={lightbox.index}
              getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
              keyExtractor={(_, i) => String(i)}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setLightbox((prev) => ({ ...prev, index: newIndex }));
              }}
              renderItem={({ item }) => (
                <View style={styles.lightboxImageWrapper}>
                  <Image source={{ uri: item }} style={styles.lightboxImage} contentFit="contain" cachePolicy="memory-disk" />
                </View>
              )}
            />
          </View>
        </Modal>

        <View style={styles.sectionCard}>
          <CustomText extraBold headerxl color={Colors.BrandPrimary}>
            {title}
          </CustomText>

          {!!location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color={Colors.LightGray} />
              <CustomText sm color={Colors.LightGray} style={styles.locationText}>
                {location}
              </CustomText>
            </View>
          )}

          <View style={styles.statusRow}>
            {business?.workingHours ? (
              <View style={[styles.statusBadge, !businessStatus.isOpen && styles.statusBadgeClosed]}>
                <CustomText semibold xs color={businessStatus.isOpen ? "#15803D" : "#B91C1C"}>
                  {businessStatus.isOpen ? "Açık" : "Kapalı"}
                </CustomText>
              </View>
            ) : null}
            {businessStatus.label ? (
              <CustomText sm color={Colors.LightGray}>
                {businessStatus.label}
              </CustomText>
            ) : null}
            <CustomTouchableOpacity activeOpacity={0.7} onPress={() => location && handleOpenMaps(location)}>
              <CustomText sm color={Colors.BrandGold}>
                Haritada Gör
              </CustomText>
            </CustomTouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.reviewBlock}>
            <View style={styles.reviewScoreColumn}>
              <View style={styles.scoreRow}>
                <CustomText extraBold xxlg color={Colors.BrandPrimary}>
                  {STATIC_RATING}
                </CustomText>
                <CustomText sm color={Colors.LightGray}>
                  / 5.0
                </CustomText>
              </View>

              <View style={styles.starsRow}>
                {[0, 1, 2, 3].map((star) => (
                  <Ionicons key={`star-full-${star}`} name="star" size={18} color={Colors.BrandGold} />
                ))}
                <Ionicons name="star-half" size={18} color={Colors.BrandGold} />
              </View>

              <CustomText sm color={Colors.LightGray} style={styles.reviewCountText}>
                {STATIC_REVIEW_COUNT} değerlendirme baz alındı
              </CustomText>
            </View>

            <View style={styles.reviewBars}>
              {STATIC_REVIEW_DISTRIBUTION.map((item) => (
                <View key={item.label} style={styles.reviewBarRow}>
                  <CustomText xs semibold color={Colors.BrandPrimary} style={styles.reviewLabel}>
                    {item.label}
                  </CustomText>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${item.percent}%` }]} />
                  </View>
                  <CustomText xs color={Colors.LightGray} style={styles.reviewPercent}>
                    %{item.percent}
                  </CustomText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {teamMembers.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <CustomText bold lg color={Colors.BrandPrimary}>
                Ekibimiz
              </CustomText>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teamList}>
              {teamMembers.map((member) => (
                <CustomerTeamMember key={member.id} member={member} />
              ))}
            </ScrollView>
          </View>
        )}

        {business?.workingHours && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={16} color={Colors.BrandPrimary} />
              <CustomText bold lg color={Colors.BrandPrimary}>
                Çalışma Saatleri
              </CustomText>
            </View>
            {DAYS_ORDER.map(({ dayIndex, label }) => {
              const entry = business.workingHours[String(dayIndex)];
              const isToday = new Date().getDay() === dayIndex;
              const isOpen = entry?.enabled ?? false;
              return (
                <View key={dayIndex} style={[styles.hoursRow, isToday && styles.hoursRowToday]}>
                  <CustomText sm semibold={isToday} color={isToday ? Colors.BrandPrimary : Colors.TextColor} style={styles.hoursDay}>
                    {label}
                  </CustomText>
                  {isOpen ? (
                    <CustomText sm color={isToday ? Colors.BrandPrimary : Colors.LightGray}>
                      {entry.start} – {entry.end}
                    </CustomText>
                  ) : (
                    <CustomText sm color={Colors.ErrorColor ?? "#EF4444"}>
                      Kapalı
                    </CustomText>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {services.length > 0 && (
          <View style={styles.sectionCard}>
            <CustomText bold lg color={Colors.BrandPrimary} style={styles.servicesTitle}>
              Hizmetler
            </CustomText>

            <View>
              {services.map((service, index) => (
                <CustomerServiceItem key={service.id} item={service} isLast={index === services.length - 1} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {firstService && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <CustomButton
            title="Randevu Al"
            onPress={() =>
              router.push({
                pathname: "/customer/create-appointment",
                params: {
                  id: businessId,
                  serviceId: firstService.id,
                },
              })
            }
            marginTop={0}
            height={56}
            borderRadius={14}
            backgroundColor="#C6A87C"
            titleStyle={styles.bottomButtonTitle}
            rightIcon={<Ionicons name="calendar-outline" size={20} color={Colors.White} style={styles.bottomButtonIcon} />}
          />
        </View>
      )}
    </LayoutView>
  );
};

export default BusinessDetail;

const styles = StyleSheet.create({
  contentWrapper: {
    paddingHorizontal: 0,
  },
  loader: {
    flex: 1,
    alignSelf: "center",
    marginTop: 80,
  },
  scrollView: {
    flex: 1,
  },
  photoSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  photoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  photoRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  photoThumbImg: {
    width: "100%",
    height: "100%",
  },
  photoExpandIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxCounter: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    zIndex: 10,
  },
  lightboxImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  hoursRowToday: {
    backgroundColor: "rgba(212,175,55,0.1)",
    paddingHorizontal: 10,
  },
  hoursDay: {
    width: 110,
  },
  sectionCard: {
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  locationText: {
    flex: 1,
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    flexWrap: "wrap",
  },
  statusBadge: {
    backgroundColor: "#ECFDF3",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeClosed: {
    backgroundColor: "#FEF2F2",
  },
  reviewBlock: {
    gap: 18,
  },
  reviewScoreColumn: {
    gap: 6,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewCountText: {
    marginTop: 4,
  },
  reviewBars: {
    gap: 10,
  },
  reviewBarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewLabel: {
    width: 18,
    textAlign: "right",
    marginRight: 10,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#F1F1F1",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.BrandPrimary,
  },
  reviewPercent: {
    width: 42,
    textAlign: "right",
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  teamList: {
    gap: 14,
    paddingRight: 20,
  },
  servicesTitle: {
    marginBottom: 4,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },
  bottomButtonTitle: {
    lineHeight: 20,
  },
  bottomButtonIcon: {
    marginLeft: 8,
  },
});
