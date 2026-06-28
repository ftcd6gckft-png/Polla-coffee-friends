// ─────────────────────────────────────────────────────────────────
// Propagación automática de ganadores en el bracket de eliminatorias.
//
// Funciones:
//   - propagateAfterKnockoutResult: cuando se guarda un resultado,
//     llena los siguientes cruces con el ganador (y perdedor en 3er puesto).
//   - clearPropagationFromMatch: cuando se BORRA un resultado, limpia
//     los slots que se habían llenado automáticamente.
//
// Formato de slots reconocidos: "W K01" (ganador), "L K01" (perdedor, 3er puesto).
// ─────────────────────────────────────────────────────────────────
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { KNOCKOUT_MATCHES } from '../data/knockoutTemplate.js';

const SLOT_REGEX = /^([WL])\s+K(\d+)$/;

/**
 * Busca qué cruces siguientes apuntan a un partido determinado.
 * @returns Array de { nextMatchId, side: 'home'|'away', refType: 'W'|'L' }
 */
function findDependents(matchId) {
  const out = [];
  for (const m of KNOCKOUT_MATCHES) {
    const hm = (m.homeSlot || '').match(SLOT_REGEX);
    if (hm) {
      const refId = `K${hm[2].padStart(2, '0')}`;
      if (refId === matchId) {
        out.push({ nextMatchId: m.id, side: 'home', refType: hm[1] });
      }
    }
    const am = (m.awaySlot || '').match(SLOT_REGEX);
    if (am) {
      const refId = `K${am[2].padStart(2, '0')}`;
      if (refId === matchId) {
        out.push({ nextMatchId: m.id, side: 'away', refType: am[1] });
      }
    }
  }
  return out;
}

/**
 * Propaga el ganador (y perdedor) de un partido KO a los siguientes cruces.
 *
 * @param {string} matchId - ID del partido recién guardado (ej. "K01").
 * @param {Object} payload - { home, away, scoreHome, scoreAway, winner }
 * @returns {Promise<Object>} - { updates, count }
 */
export async function propagateAfterKnockoutResult(matchId, payload) {
  if (!matchId || !payload?.winner) {
    return { updates: {}, count: 0 };
  }

  const winner = payload.winner;
  let loser = null;
  if (payload.home && payload.away) {
    if (winner === payload.home) loser = payload.away;
    else if (winner === payload.away) loser = payload.home;
  }

  const dependents = findDependents(matchId);
  if (dependents.length === 0) {
    return { updates: {}, count: 0 };
  }

  const updates = {};
  for (const dep of dependents) {
    const teamCode = dep.refType === 'W' ? winner : loser;
    if (!teamCode) continue;
    if (!updates[dep.nextMatchId]) updates[dep.nextMatchId] = {};
    updates[dep.nextMatchId][dep.side] = teamCode;
  }

  if (Object.keys(updates).length === 0) {
    return { updates: {}, count: 0 };
  }

  const bracketRef = doc(db, 'officialResults', 'knockoutBracket');
  const snap = await getDoc(bracketRef);
  const existing = snap.exists() ? snap.data() : {};

  const merged = { ...existing };
  for (const nextId of Object.keys(updates)) {
    merged[nextId] = {
      ...(merged[nextId] || {}),
      ...updates[nextId],
    };
  }
  await setDoc(bracketRef, merged);

  return { updates, count: Object.keys(updates).length };
}

/**
 * Cuando se borra un resultado oficial, limpia los slots que se habían
 * llenado automáticamente en los cruces siguientes.
 *
 * Solo limpia el slot específico (home o away) que dependía de este partido.
 * NO borra el cruce completo (puede haber otro equipo del otro lado).
 *
 * @param {string} matchId - ID del partido cuyo resultado fue borrado.
 * @returns {Promise<Object>} - { cleared, count }
 */
export async function clearPropagationFromMatch(matchId) {
  if (!matchId) return { cleared: {}, count: 0 };

  const dependents = findDependents(matchId);
  if (dependents.length === 0) {
    return { cleared: {}, count: 0 };
  }

  const bracketRef = doc(db, 'officialResults', 'knockoutBracket');
  const snap = await getDoc(bracketRef);
  if (!snap.exists()) {
    return { cleared: {}, count: 0 };
  }

  const existing = snap.data();
  const merged = { ...existing };
  const cleared = {};

  for (const dep of dependents) {
    const nextSlot = merged[dep.nextMatchId];
    if (!nextSlot) continue;
    // Solo limpiar el side que dependía de este partido
    const newSlot = { ...nextSlot };
    delete newSlot[dep.side];
    if (!cleared[dep.nextMatchId]) cleared[dep.nextMatchId] = [];
    cleared[dep.nextMatchId].push(dep.side);
    // Si el cruce quedó vacío, lo eliminamos del doc
    if (Object.keys(newSlot).length === 0) {
      delete merged[dep.nextMatchId];
    } else {
      merged[dep.nextMatchId] = newSlot;
    }
  }

  await setDoc(bracketRef, merged);

  return { cleared, count: Object.keys(cleared).length };
}
