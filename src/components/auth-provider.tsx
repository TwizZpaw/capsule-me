"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { authErrorMessage, completeGoogleRedirect } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      void completeGoogleRedirect().catch((caught) => {
        console.error(caught);
        console.error(authErrorMessage(caught));
      });
      return onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setReady(true);
      });
    } catch (caught) {
      console.error(caught);
      setReady(true);
    }
  }, []);

  const value = useMemo(() => ({ user, ready }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
