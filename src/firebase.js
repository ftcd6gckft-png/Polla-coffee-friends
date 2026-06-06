// Inicialización de Firebase. Lee las credenciales de las variables de entorno (Vite).
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validación temprana: si falta alguna variable crítica, la app no debería arrancar.
const missing = ['apiKey', 'authDomain', 'projectId', 'appId'].filter(
  (k) => !firebaseConfig[k]
);
if (missing.length) {
  console.error('[Firebase] Faltan variables de entorno:', missing);
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Email del super-admin (configurable desde env var)
export const SUPERADMIN_EMAIL = (import.meta.env.VITE_SUPERADMIN_EMAIL || '').toLowerCase();

export const isFirebaseConfigured = missing.length === 0;
