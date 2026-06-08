// ─────────────────────────────────────────────────────────────────
// Scoring extendido — Entrega 3 Parte 2
// Calcula puntos totales de un usuario en una polla.
// ─────────────────────────────────────────────────────────────────
import { GROUP_MATCHES } from '../data/groupMatches.js';
import { KNOCKOUT_MATCHES } from '../data/knockoutTemplate.js';
import { calcMatchPoints, POINTS_CHAMPION, isPredictionComplete } from './scoring.js';

/**
 * Calcula los puntos de un usuario en una polla a partir de:
 *   - sus pronósticos (groupMatches, knockoutMatches, champion)
 *   - los resultados oficiales (groupResults, knockoutResults, officialChampion)
 *
 * Reglas:
 *   - Grupos: 3 exacto / 1 ganador / 0
 *   - Eliminatorias: SOLO puntúa si el usuario acertó AMBOS equipos del cruce.
 *     Si acertó los equipos: 3 exacto / 1 ganador (sobre marcador de 90 min).
 *     Si no acertó alguno de los equipos, ese partido vale 0.
 *   - Campeón: 5 puntos si acierta.
 */
export function calcTotalStats({
  predictions,
  groupResults = {},
  knockoutResults = {},
  officialChampion = null,
}) {
  let pts = 0;
  let exact = 0;
  let winner = 0;
  let scoredMatches = 0;
  let groupComplete = 0;
  let koComplete = 0;
  let groupPts = 0;
  let koPts = 0;
  let champPts = 0;

  const groupPreds = predictions?.groupMatches || {};
  const koPreds = predictions?.knockoutMatches || {};
  const champPred = predictions?.champion || null;

  // ── GRUPOS ──
  for (const m of GROUP_MATCHES) {
    const p = groupPreds[m.id];
    if (isPredictionComplete(p)) groupComplete += 1;
    const r = groupResults[m.id];
    if (r) {
      scoredMatches += 1;
      if (isPredictionComplete(p)) {
        const score = calcMatchPoints(p, r);
        pts += score;
        groupPts += score;
        if (score === 3) exact += 1;
        if (score === 1) winner += 1;
      }
    }
  }

  // ── ELIMINATORIAS ──
  for (const m of KNOCKOUT_MATCHES) {
    const p = koPreds[m.id];
    if (p && p.scoreHome != null && p.scoreAway != null) koComplete += 1;
    const r = knockoutResults[m.id];
    if (r && p) {
      // Para puntuar eliminatorias se requiere que el usuario haya acertado los DOS equipos
      const teamsMatch = p.home === r.home && p.away === r.away;
      if (teamsMatch) {
        scoredMatches += 1;
        const pPred = { home: p.scoreHome, away: p.scoreAway };
        const rRes = { home: r.scoreHome, away: r.scoreAway };
        const score = calcMatchPoints(pPred, rRes);
        pts += score;
        koPts += score;
        if (score === 3) exact += 1;
        if (score === 1) winner += 1;
      }
    }
  }

  // ── CAMPEÓN ──
  if (officialChampion && champPred && champPred === officialChampion) {
    pts += POINTS_CHAMPION;
    champPts = POINTS_CHAMPION;
  }

  return {
    pts,
    exact,
    winner,
    scoredMatches,
    groupComplete,
    koComplete,
    groupPts,
    koPts,
    champPts,
    champion: champPred,
    championCorrect: officialChampion && champPred === officialChampion,
  };
}
