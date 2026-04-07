import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import LayoutView from "@/components/high-level/layout-view";
import CustomButton from "@/components/high-level/custom-button";
import CustomText from "@/components/high-level/custom-text";
import CustomTouchableOpacity from "@/components/high-level/custom-touchable-opacity";
import CustomerServiceItem from "@/components/high-level/customer-service-item";
import CustomerTeamMember from "@/components/high-level/customer-team-member";
import { Colors } from "@/constants/colors";

const STATIC_RATING = "4.8";
const STATIC_REVIEW_COUNT = 124;
const STATIC_REVIEW_DISTRIBUTION = [
  { label: "5", percent: 78 },
  { label: "4", percent: 15 },
  { label: "3", percent: 4 },
];
const STATIC_CLOSES_AT = "18:00'de kapanıyor";

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

  useEffect(() => {
    if (!businessId) return;

    const todayIndex = String(new Date().getDay());
    const uid = auth.currentUser?.uid;

    const favRef = uid ? getDoc(doc(db, "users", uid, "favorites", businessId)) : Promise.resolve(null);

    Promise.all([
      getDoc(doc(db, "businesses", businessId)),
      getDocs(collection(db, "users", businessId, "services")),
      getDocs(collection(db, "users", businessId, "employees")),
      favRef,
    ])
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
      } else {
        await setDoc(favRef, { businessId, savedAt: new Date() });
        setIsFavorite(true);
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

  const title = business?.businessName ?? "İşletme";
  const location = business?.address ?? "";
  const galleryImages = Array.isArray(business?.venuePhotos) ? business.venuePhotos : [];
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
          <Ionicons
            name={isFavorite ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isFavorite ? Colors.BrandGold : Colors.BrandPrimary}
          />
        </CustomTouchableOpacity>
      }
      style={styles.contentWrapper}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {galleryImages.length > 0 && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContent}>
              {galleryImages.map((imageUri, index) => (
                <View key={`gallery-${index}`} style={[styles.galleryCard, index > 0 && styles.galleryCardSmall]}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.galleryImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    placeholder={styles.galleryPlaceholder}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.dotsRow}>
              {galleryImages.map((_, index) => (
                <View key={`dot-${index}`} style={[styles.dot, index === 0 ? styles.dotActive : null]} />
              ))}
            </View>
          </>
        )}

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
            <View style={styles.statusBadge}>
              <CustomText semibold xs color="#15803D">
                Open Now
              </CustomText>
            </View>
            <CustomText sm color={Colors.LightGray}>
              {STATIC_CLOSES_AT}
            </CustomText>
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
                pathname: "/customer/home/create-appointment",
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
  container: {
    paddingTop: 14,
  },
  galleryContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  galleryCard: {
    width: 300,
    height: 250,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  galleryCardSmall: {
    width: 255,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryPlaceholder: {
    backgroundColor: "#E5E7EB",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(20,20,20,0.22)",
  },
  dotActive: {
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: "rgba(20,20,20,0.12)",
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
