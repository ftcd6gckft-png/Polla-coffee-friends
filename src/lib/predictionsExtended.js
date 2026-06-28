// ─────────────────────────────────────────────────────────────────
// Acceso a Firestore — funciones extendidas para eliminatorias,
// campeón, resultados oficiales, bracket y stats de polla.
// ─────────────────────────────────────────────────────────────────
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { propagateAfterKnockoutResult } from './bracketPropagation.js';

const predRef = (pollId, userId) =>
  doc(db, 'pools', pollId, 'predictions', userId);

// ─── BASE: ensure doc existe ─────────────────────────────────────
async function ensurePredictionsDoc(pollId, userId) {
  const ref = predRef(pollId, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      groupMatches: {},
      knockoutMatches: {},
      champion: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return ref;
}

// ─── KNOCKOUT PREDICTIONS ────────────────────────────────────────
/**
 * Guarda/actualiza la predicción de un partido de eliminatorias.
 * { home: "ARG", away: "BRA", scoreHome: 2, scoreAway: 1 }
 */
export async function saveKnockoutPrediction(pollId, userId, matchId, payload) {
  const ref = await ensurePredictionsDoc(pollId, userId);
  await updateDoc(ref, {
    [`knockoutMatches.${matchId}`]: {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Guarda el pronóstico de campeón. Sobreescribe el anterior.
 */
export async function saveChampionPrediction(pollId, userId, teamCode) {
  const ref = await ensurePredictionsDoc(pollId, userId);
  await updateDoc(ref, {
    champion: teamCode,
    updatedAt: serverTimestamp(),
  });
}

// ─── OFFICIAL RESULTS: knockout ──────────────────────────────────
const knockoutResultsRef = () => doc(db, 'officialResults', 'knockoutMatches');

export async function getKnockoutResults() {
  const snap = await getDoc(knockoutResultsRef());
  return snap.exists() ? (snap.data() || {}) : {};
}

export function subscribeToKnockoutResults(callback) {
  return onSnapshot(knockoutResultsRef(), (snap) => {
    callback(snap.exists() ? (snap.data() || {}) : {});
  });
}

/**
 * Guarda el resultado oficial de un partido de eliminatorias.
 * El marcador es de 90 minutos. winner se usa para los cruces siguientes.
 */
export async function saveOfficialKnockoutResult(matchId, payload) {
  const ref = knockoutResultsRef();
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { [matchId]: payload });
  } else {
    await setDoc(ref, { [matchId]: payload });
  }
}

export async function clearOfficialKnockoutResult(matchId) {
  const ref = knockoutResultsRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() || {};
  delete data[matchId];
  await setDoc(ref, data);
}

// ─── OFFICIAL RESULTS: groupMatches (admin) ──────────────────────
const groupResultsRef = () => doc(db, 'officialResults', 'groupMatches');

export async function saveOfficialGroupResult(matchId, { home, away }) {
  const ref = groupResultsRef();
  const snap = await getDoc(ref);
  const payload = { home: Number(home), away: Number(away), status: 'final' };
  if (snap.exists()) {
    await updateDoc(ref, { [matchId]: payload });
  } else {
    await setDoc(ref, { [matchId]: payload });
  }
}

export async function clearOfficialGroupResult(matchId) {
  const ref = groupResultsRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() || {};
  delete data[matchId];
  await setDoc(ref, data);
}

// ─── KNOCKOUT BRACKET CONFIGURATION (super-admin) ───────────────
const bracketRef = () => doc(db, 'officialResults', 'knockoutBracket');

export async function getKnockoutBracket() {
  const snap = await getDoc(bracketRef());
  return snap.exists() ? (snap.data() || {}) : {};
}

export function subscribeToKnockoutBracket(callback) {
  return onSnapshot(bracketRef(), (snap) => {
    callback(snap.exists() ? (snap.data() || {}) : {});
  });
}

export async function saveBracketParticipants(matchId, { home, away }) {
  const ref = bracketRef();
  const snap = await getDoc(ref);
  const payload = { home, away };
  if (snap.exists()) {
    await updateDoc(ref, { [matchId]: payload });
  } else {
    await setDoc(ref, { [matchId]: payload });
  }
}

// ─── OFFICIAL CHAMPION ──────────────────────────────────────────
const championRef = () => doc(db, 'officialResults', 'champion');

export function subscribeToOfficialChampion(callback) {
  return onSnapshot(championRef(), (snap) => {
    callback(snap.exists() ? (snap.data()?.team || null) : null);
  });
}

export async function saveOfficialChampion(teamCode) {
  await setDoc(championRef(), { team: teamCode, setAt: serverTimestamp() });
}

export async function clearOfficialChampion() {
  await setDoc(championRef(), { team: null, setAt: serverTimestamp() });
}

// ─── RANKING: stats por polla ────────────────────────────────────
/**
 * Cada usuario publica sus stats en /pools/{pollId}/stats/{uid}
 * para que el ranking pueda leerlas (la regla permite a cualquier miembro leer).
 */
export async function getPoolStats(pollId) {
  const snap = await getDocs(collection(db, 'pools', pollId, 'stats'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export function subscribeToPoolStats(pollId, callback) {
  if (!pollId) {
    callback([]);
    return () => {};
  }
  return onSnapshot(collection(db, 'pools', pollId, 'stats'), (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  });
}

export async function saveMyStats(pollId, uid, stats) {
  await setDoc(doc(db, 'pools', pollId, 'stats', uid), {
    ...stats,
    updatedAt: serverTimestamp(),
  });
}
