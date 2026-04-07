import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA9aBB-BstGT5YV7lotJdWXRBJdpqPh7_4",
  authDomain: "geoedge-app.firebaseapp.com",
  projectId: "geoedge-app",
  storageBucket: "geoedge-app.firebasestorage.app",
  messagingSenderId: "219658317319",
  appId: "1:219658317319:web:71696463364397bfa404a2",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
