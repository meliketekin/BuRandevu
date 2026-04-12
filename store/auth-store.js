import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,                     // Firebase auth user objesi
  userType: null,                 // "customer" | "business"
  isAdmin: false,
  businessId: null,               // Çalışan için: bağlı olduğu işletme sahibinin UID'si; işletme sahibi için: kendi UID'si
  isBusinessInfoCompleted: false, // İşletme sahibi için bilgi formu tamamlandı mı

  setAuth: (user, userType, isAdmin, isBusinessInfoCompleted = false, businessId = null) =>
    set({ user, userType, isAdmin: !!isAdmin, isBusinessInfoCompleted: !!isBusinessInfoCompleted, businessId: businessId ?? null }),

  setBusinessInfoCompleted: () =>
    set({ isBusinessInfoCompleted: true }),

  clearAuth: () =>
    set({ user: null, userType: null, isAdmin: false, isBusinessInfoCompleted: false, businessId: null }),
}));

export default useAuthStore;
