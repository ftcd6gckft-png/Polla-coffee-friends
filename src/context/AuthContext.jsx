import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth, SUPERADMIN_EMAIL } from '../firebase.js';
import { getUserDoc, ensureUserDoc } from '../lib/pools.js';

const AuthContext = createContext({
  user: null,         // objeto Firebase Auth user
  userDoc: null,      // documento de Firestore /users/{uid}
  loading: true,
  isSuperAdmin: false,
  refreshUserDoc: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUserDoc = async (uid) => {
    if (!uid) {
      setUserDoc(null);
      return;
    }
    try {
      const d = await getUserDoc(uid);
      setUserDoc(d);
    } catch (e) {
      console.error('[auth] no se pudo cargar userDoc', e);
      setUserDoc(null);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // garantiza que exista el doc del usuario (para usuarios que solo tienen auth)
        try {
          await ensureUserDoc(u.uid, {
            email: u.email,
            displayName: u.displayName || u.email?.split('@')[0],
          });
        } catch (e) {
          console.warn('[auth] ensureUserDoc falló (puede ser por reglas):', e?.code);
        }
        await refreshUserDoc(u.uid);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signOut = async () => {
    await fbSignOut(auth);
    setUserDoc(null);
  };

  const isSuperAdmin =
    !!user?.email && !!SUPERADMIN_EMAIL && user.email.toLowerCase() === SUPERADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        loading,
        isSuperAdmin,
        refreshUserDoc: () => refreshUserDoc(user?.uid),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
