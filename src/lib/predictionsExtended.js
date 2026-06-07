// ─────────────────────────────────────────────────────────────────
// Acceso a Firestore — Entrega 3 Parte 2
// Extiende a predictions.js de Parte 1 con: eliminatorias, campeón,
// resultados oficiales de eliminatorias y de campeón.
// ─────────────────────────────────────────────────────────────────
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';

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
 * Para eliminatorias también guardamos qué EQUIPOS juegan (el usuario los conoce
 * cuando la fase ya está desbloqueada).
 *
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
 * Guarda el resultado oficial de un partido de eliminatorias (super-admin).
 *
 * { home: "ARG", away: "BRA", scoreHome: 2, scoreAway: 1, winner: "ARG" }
 *
 * El marcador (scoreHome/scoreAway) es el de 90 minutos.
 * El winner se usa para resolver los cruces siguientes (puede ser distinto
 * al marcador si hubo penales).
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
// El super-admin define los participantes de cada partido de eliminatorias
// (los clasificados de grupos, ganadores de cruces previos, etc.).
// Se guarda en /officialResults/knockoutBracket

const bracketRef = () => doc(db, 'officialResults', 'knockoutBracket');

/**
 * Estructura:
 * { K01: { home: "ARG", away: "BRA" }, K02: {...}, ... }
 *
 * Cada entrada le dice a la app QUÉ EQUIPOS realmente juegan ese partido,
 * después de que el super-admin haya determinado los clasificados.
 */
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

// ─── RANKING: lee predicciones de todos los miembros de una polla ────

/**
 * Lee todas las predicciones de los miembros de una polla.
 * Esto es para calcular el ranking - cada usuario solo puede LEER sus propias
 * predicciones (regla de Firestore), pero como super-admin tiene permisos extra
 * implementaremos un workaround:
 *
 * Cada usuario lee SU propia predicción y la guarda en un doc público de stats
 * que es legible por todos los miembros.
 *
 * Estructura: /pools/{pollId}/stats/{userId}
 *   pts, exact, winner, scored, champion, updatedAt
 *
 * Cuando un usuario edita pronósticos o cuando se cargan resultados oficiales,
 * recalculamos sus stats y los guardamos en este doc público.
 */
export async function getPoolStats(pollId) {
  const snap = await getDocs(collection(db, 'pools', pollId, 'stats'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export function subscribeToPoolStats(pollId, callback) {
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
