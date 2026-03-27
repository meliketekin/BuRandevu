import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,                     // Firebase auth user objesi
  userType: null,                 // "customer" | "business"
  isAdmin: false,
  isBusinessInfoCompleted: false, // İşletme sahibi için bilgi formu tamamlandı mı

  setAuth: (user, userType, isAdmin, isBusinessInfoCompleted = false) =>
    set({ user, userType, isAdmin: !!isAdmin, isBusinessInfoCompleted: !!isBusinessInfoCompleted }),

  setBusinessInfoCompleted: () =>
    set({ isBusinessInfoCompleted: true }),

  clearAuth: () =>
    set({ user: null, userType: null, isAdmin: false, isBusinessInfoCompleted: false }),
}));

export default useAuthStore;
