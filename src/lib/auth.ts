"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  walletBalance: number;
  totalBets: number;
  totalWins: number;
  pnl: number;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setFirebaseUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      loading: true,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const profile = await loadOrCreateProfile(cred.user);
          set({ user: profile, loading: false });
          return true;
        } catch (err) {
          // Fallback: if Firebase Auth not configured, create local guest profile
          const msg = (err as Error).message || "";
          if (msg.includes("CONFIGURATION_NOT_FOUND") || msg.includes("configuration-not-found") || msg.includes("auth/network-request-failed") || msg.includes("auth/invalid-api-key")) {
            const guestProfile: UserProfile = {
              uid: "guest-" + Date.now(),
              email,
              displayName: email.split("@")[0],
              walletBalance: 10000,
              totalBets: 0,
              totalWins: 0,
              pnl: 0,
              createdAt: new Date().toISOString(),
            };
            set({ user: guestProfile, loading: false, error: null });
            return true;
          }
          set({ error: msg, loading: false });
          return false;
        }
      },

      register: async (email, password, name) => {
        set({ loading: true, error: null });
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          const profile = await loadOrCreateProfile(cred.user, name);
          set({ user: profile, loading: false });
          return true;
        } catch (err) {
          const msg = (err as Error).message || "";
          if (msg.includes("CONFIGURATION_NOT_FOUND") || msg.includes("configuration-not-found") || msg.includes("auth/network-request-failed") || msg.includes("auth/invalid-api-key")) {
            const guestProfile: UserProfile = {
              uid: "guest-" + Date.now(),
              email,
              displayName: name || email.split("@")[0],
              walletBalance: 10000,
              totalBets: 0,
              totalWins: 0,
              pnl: 0,
              createdAt: new Date().toISOString(),
            };
            set({ user: guestProfile, loading: false, error: null });
            return true;
          }
          set({ error: msg, loading: false });
          return false;
        }
      },

      logout: async () => {
        await signOut(auth);
        set({ user: null, firebaseUser: null });
      },

      setFirebaseUser: (fbUser) => {
        if (fbUser) {
          loadOrCreateProfile(fbUser).then((profile) => {
            set({ firebaseUser: fbUser, user: profile, loading: false });
          });
        } else {
          set({ firebaseUser: null, user: null, loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "geoedge-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);

async function loadOrCreateProfile(fbUser: User, displayName?: string): Promise<UserProfile> {
  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref).catch(() => null);

  if (snap?.exists()) {
    return snap.data() as UserProfile;
  }

  const profile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || "",
    displayName: displayName || fbUser.email?.split("@")[0] || "User",
    walletBalance: 10000,
    totalBets: 0,
    totalWins: 0,
    pnl: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(ref, { ...profile, createdAt: serverTimestamp() }).catch(() => {});
  return profile;
}

// Init auth listener
export function initAuthListener() {
  try {
    return onAuthStateChanged(auth, (user) => {
      useAuthStore.getState().setFirebaseUser(user);
    });
  } catch {
    // If Firebase Auth not configured, just set loading to false
    useAuthStore.setState({ loading: false });
    return () => {};
  }
}
