// ─────────────────────────────────────────────────────────────────
// Scoring extendido — Calcula puntos totales de un usuario en una polla.
//
// Reglas (idénticas en grupos y eliminatorias):
//   - 3 pts marcador exacto
//   - 1 pt acertar ganador (o empate)
//   - 0 pts fallo
//
// Eliminatorias: el marcador se evalúa contra los 90 minutos del partido
// (sin alargues ni penales). NO se requiere haber acertado los equipos
// del cruce - solo importa el marcador.
//
//   - 5 pts si aciertas el campeón
// ─────────────────────────────────────────────────────────────────
import { GROUP_MATCHES } from '../data/groupMatches.js';
import { KNOCKOUT_MATCHES } from '../data/knockoutTemplate.js';
import { calcMatchPoints, POINTS_CHAMPION, isPredictionComplete } from './scoring.js';

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
  // Misma lógica que grupos: solo importa el marcador (90 min).
  // No se exige haber acertado qué equipos jugaron.
  for (const m of KNOCKOUT_MATCHES) {
    const p = koPreds[m.id];
    if (p && p.scoreHome != null && p.scoreAway != null) koComplete += 1;
    const r = knockoutResults[m.id];
    if (r && p && p.scoreHome != null && p.scoreAway != null) {
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
