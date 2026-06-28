// ─────────────────────────────────────────────────────────────────
// Propagación automática de ganadores en el bracket de eliminatorias.
//
// Cuando el admin guarda un resultado oficial de un partido KO, esta
// función se encarga de:
//   1. Determinar el ganador y el perdedor.
//   2. Buscar en KNOCKOUT_MATCHES los cruces siguientes cuyo slot
//      apunte a este partido (formato "W K01" o "L K29").
//   3. Actualizar el doc /officialResults/knockoutBracket llenando
//      los participantes (home/away) de esos cruces.
//
// Edge cases manejados:
//   - Re-edición: si se cambia un resultado, sobrescribe la propagación
//     (los partidos siguientes pueden quedar mal — el admin debe revisarlos).
//   - 3er puesto: el slot "L K29" / "L K30" recibe al perdedor de las semis.
//   - Final: el slot "W K29" / "W K30" recibe al ganador de las semis.
// ─────────────────────────────────────────────────────────────────
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { KNOCKOUT_MATCHES } from '../data/knockoutTemplate.js';

/**
 * Propaga el ganador (y perdedor) de un partido KO a los siguientes cruces.
 *
 * @param {string} matchId - ID del partido recién guardado (ej. "K01").
 * @param {Object} payload - { home, away, scoreHome, scoreAway, winner }
 * @returns {Promise<Object>} - mapa { nextMatchId: { home?, away? } } con lo que se propagó
 */
export async function propagateAfterKnockoutResult(matchId, payload) {
  if (!matchId || !payload?.winner) {
    return { updates: {}, count: 0 };
  }

  const winner = payload.winner;
  // Determinar perdedor a partir de los participantes
  let loser = null;
  if (payload.home && payload.away) {
    if (winner === payload.home) loser = payload.away;
    else if (winner === payload.away) loser = payload.home;
  }

  // Buscar todos los cruces que apunten a este partido
  // Formato esperado: "W K01" (ganador) o "L K01" (perdedor, solo 3er puesto)
  const updates = {};
  const slotRegex = /^([WL])\s+K(\d+)$/;

  for (const nextMatch of KNOCKOUT_MATCHES) {
    // Verificar homeSlot
    const homeM = (nextMatch.homeSlot || '').match(slotRegex);
    if (homeM) {
      const refType = homeM[1]; // 'W' o 'L'
      const refId = `K${homeM[2].padStart(2, '0')}`;
      if (refId === matchId) {
        const teamCode = refType === 'W' ? winner : loser;
        if (teamCode) {
          if (!updates[nextMatch.id]) updates[nextMatch.id] = {};
          updates[nextMatch.id].home = teamCode;
        }
      }
    }
    // Verificar awaySlot
    const awayM = (nextMatch.awaySlot || '').match(slotRegex);
    if (awayM) {
      const refType = awayM[1];
      const refId = `K${awayM[2].padStart(2, '0')}`;
      if (refId === matchId) {
        const teamCode = refType === 'W' ? winner : loser;
        if (teamCode) {
          if (!updates[nextMatch.id]) updates[nextMatch.id] = {};
          updates[nextMatch.id].away = teamCode;
        }
      }
    }
  }

  // Si no hay nada que propagar, salir
  const ids = Object.keys(updates);
  if (ids.length === 0) {
    return { updates: {}, count: 0 };
  }

  // Aplicar al doc del bracket: merge con lo existente
  const bracketRef = doc(db, 'officialResults', 'knockoutBracket');
  const snap = await getDoc(bracketRef);
  const existing = snap.exists() ? snap.data() : {};

  const merged = { ...existing };
  for (const nextId of ids) {
    merged[nextId] = {
      ...(merged[nextId] || {}),
      ...updates[nextId],
    };
  }

  await setDoc(bracketRef, merged);

  return { updates, count: ids.length };
}
