import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      setUser(currentUser);
      setProfile(null);
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profileRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(profileRef);
        const data = snapshot.exists() ? snapshot.data() : {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          plan: "Free",
        };
        if (!snapshot.exists()) await setDoc(profileRef, data);
        if (active) setProfile({ ...data, plan: data.plan || "Free" });
      } catch (error) {
        console.error("Unable to load user profile:", error);
        if (active) setProfile({ plan: "Free" });
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, profile, setProfile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
