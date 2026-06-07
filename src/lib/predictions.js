// ─────────────────────────────────────────────────────────────────
// Acceso a Firestore para predicciones y resultados oficiales.
//
// Estructura:
//   /pools/{pollId}/predictions/{userId}
//     groupMatches: { "G01": {home: 2, away: 1}, ... }
//     knockoutMatches: { "K01": {...}, ... }
//     champion: "ARG"
//     updatedAt: timestamp
//
//   /officialResults/groupMatches  (un solo doc con todos los partidos como mapa)
//     G01: { home: 2, away: 1, status: "final" }
//     G02: { home: 0, away: 0, status: "final" }
//     ...
//
//   /officialResults/champion (un solo doc)
//     team: "ARG"
// ─────────────────────────────────────────────────────────────────
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';

// ─── PREDICCIONES ────────────────────────────────────────────────

const predRef = (pollId, userId) =>
  doc(db, 'pools', pollId, 'predictions', userId);

/**
 * Obtiene las predicciones de un usuario en una polla.
 * Devuelve {groupMatches: {...}, knockoutMatches: {...}, champion: ...} o null.
 */
export async function getPredictions(pollId, userId) {
  const snap = await getDoc(predRef(pollId, userId));
  return snap.exists() ? snap.data() : null;
}

/**
 * Suscripción en tiempo real a las predicciones del usuario.
 * Útil cuando el mismo usuario tiene la app abierta en varios dispositivos.
 */
export function subscribeToPredictions(pollId, userId, callback) {
  return onSnapshot(predRef(pollId, userId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

/**
 * Guarda/actualiza la predicción de un partido de la fase de grupos.
 * Hace merge para no pisar otros partidos.
 *
 * NOTA: el lock T-15 debe verificarse en el CLIENTE antes de llamar esto.
 * Las reglas de Firestore validarán también, pero por ahora solo bloqueamos en cliente.
 */
export async function saveGroupPrediction(pollId, userId, matchId, { home, away }) {
  const ref = predRef(pollId, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      [`groupMatches.${matchId}`]: { home, away, updatedAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      groupMatches: { [matchId]: { home, away, updatedAt: serverTimestamp() } },
      knockoutMatches: {},
      champion: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// ─── RESULTADOS OFICIALES ────────────────────────────────────────

const groupResultsRef = () => doc(db, 'officialResults', 'groupMatches');

/**
 * Obtiene todos los resultados oficiales de la fase de grupos.
 * Devuelve un mapa { G01: {home, away, status}, ... } o {} si no hay.
 */
export async function getGroupResults() {
  const snap = await getDoc(groupResultsRef());
  return snap.exists() ? (snap.data() || {}) : {};
}

/**
 * Suscripción en tiempo real a los resultados oficiales de grupos.
 * Cuando el super-admin actualice un resultado, todos ven el cambio inmediatamente.
 */
export function subscribeToGroupResults(callback) {
  return onSnapshot(groupResultsRef(), (snap) => {
    callback(snap.exists() ? (snap.data() || {}) : {});
  });
}
