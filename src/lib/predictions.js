// ─────────────────────────────────────────────────────────────────
// Acceso a Firestore para predicciones y resultados oficiales.
//
// Estructura:
//   /pools/{pollId}/predictions/{userId}
//     groupMatches: { "G01": {home: 2, away: 1}, ... }
//     knockoutMatches: { "K01": {...}, ... }
//     champion: "ARG"
//     updatedAt: timestamp
// ─────────────────────────────────────────────────────────────────
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, collection, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';

// ─── PREDICCIONES (propias) ─────────────────────────────────────

const predRef = (pollId, userId) =>
  doc(db, 'pools', pollId, 'predictions', userId);

export async function getPredictions(pollId, userId) {
  const snap = await getDoc(predRef(pollId, userId));
  return snap.exists() ? snap.data() : null;
}

export function subscribeToPredictions(pollId, userId, callback) {
  return onSnapshot(predRef(pollId, userId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

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

// ─── PREDICCIONES DE TODOS LOS MIEMBROS DE LA POLLA ───────────────
// (Se usa para mostrar la lista pública debajo de cada partido,
//  solo cuando el partido ya está bloqueado en el cliente.)

/**
 * Suscripción en tiempo real a TODAS las predicciones de la polla.
 * Devuelve un array: [{ uid, groupMatches, knockoutMatches, champion, ... }]
 * Las reglas garantizan que solo los miembros de la polla pueden leer.
 */
export function subscribeToAllPoolPredictions(pollId, callback) {
  const colRef = collection(db, 'pools', pollId, 'predictions');
  return onSnapshot(colRef, (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  });
}

// ─── RESULTADOS OFICIALES ────────────────────────────────────────

const groupResultsRef = () => doc(db, 'officialResults', 'groupMatches');

export async function getGroupResults() {
  const snap = await getDoc(groupResultsRef());
  return snap.exists() ? (snap.data() || {}) : {};
}

export function subscribeToGroupResults(callback) {
  return onSnapshot(groupResultsRef(), (snap) => {
    callback(snap.exists() ? (snap.data() || {}) : {});
  });
}
