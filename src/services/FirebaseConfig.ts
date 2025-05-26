import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase Auth for React Native with persistence
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCl_hPU870uMDLOZ-zMKXVu9BzfKgIKegQ",
  authDomain: "beluga-b7534.firebaseapp.com",
  projectId: "beluga-b7534",
  storageBucket: "beluga-b7534.appspot.com",
  messagingSenderId: "68202615470",
  appId: "1:68202615470:web:d83b5bb13a9bdd1a4e933f",
  measurementId: "G-ZCLYW9YMWQ"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore & Storage
const FIRESTORE_DB = getFirestore(app);
const storage = getStorage(app);

export { auth, FIRESTORE_DB, storage };


