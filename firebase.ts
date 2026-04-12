// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7prl4an-3YrlYJXZFKvauat7AOstOxEM",
  authDomain: "burandevu-dc9c0.firebaseapp.com",
  projectId: "burandevu-dc9c0",
  storageBucket: "burandevu-dc9c0.firebasestorage.app",
  messagingSenderId: "499000277092",
  appId: "1:499000277092:web:de13643fb561c53fefc771",
  measurementId: "G-FZEZ0ZZ1WN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);

// İkinci Firebase app instance — çalışan hesabı oluşturmak için kullanılır.
// inMemoryPersistence ile birincil auth session'ı etkilenmez.
const secondaryApp = initializeApp(firebaseConfig, "employee-creator");
export const secondaryAuth = initializeAuth(secondaryApp, {
  persistence: inMemoryPersistence,
});
