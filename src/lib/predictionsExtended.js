// ─────────────────────────────────────────────────────────────────
// Scoring extendido — Calcula puntos totales de un usuario en una polla.
//
// Reglas:
//   Grupos:        3 exacto / 1 ganador / 0
//   Eliminatorias: 5 exacto / 2 ganador / 0 (sobre marcador de 90 min)
//   Campeón:       10 pts si acierta
// ─────────────────────────────────────────────────────────────────
import { GROUP_MATCHES } from '../data/groupMatches.js';
import { KNOCKOUT_MATCHES } from '../data/knockoutTemplate.js';
import {
  calcMatchPoints,
  calcKnockoutPoints,
  POINTS_CHAMPION,
  isPredictionComplete,
} from './scoring.js';

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

  // ── GRUPOS (3 exacto / 1 ganador) ──
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

  // ── ELIMINATORIAS (5 exacto / 2 ganador) ──
  for (const m of KNOCKOUT_MATCHES) {
    const p = koPreds[m.id];
    if (p && p.scoreHome != null && p.scoreAway != null) koComplete += 1;
    const r = knockoutResults[m.id];
    if (r && p && p.scoreHome != null && p.scoreAway != null) {
      scoredMatches += 1;
      const pPred = { home: p.scoreHome, away: p.scoreAway };
      const rRes = { home: r.scoreHome, away: r.scoreAway };
      const score = calcKnockoutPoints(pPred, rRes);
      pts += score;
      koPts += score;
      if (score === 5) exact += 1;
      if (score === 2) winner += 1;
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
