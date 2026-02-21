"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const res = await fetch(`/api/user?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Dynamically import firebase to avoid SSR issues
    Promise.all([
      import("firebase/auth"),
      import("@/lib/firebase-client"),
    ]).then(([{ onAuthStateChanged }, { auth }]) => {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          await fetchProfile(firebaseUser.uid);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
