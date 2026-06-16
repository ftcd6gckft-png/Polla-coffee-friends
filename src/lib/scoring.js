// ─────────────────────────────────────────────────────────────────
// Sistema de puntuación
//
// Grupos:
//   - 3 puntos por marcador exacto
//   - 1 punto por acertar ganador (incluye empate)
//
// Eliminatorias:
//   - 5 puntos por marcador exacto (90 min)
//   - 2 puntos por acertar ganador (90 min, incluye empate)
//
// Campeón: 10 puntos
// ─────────────────────────────────────────────────────────────────

// Puntos para fase de grupos
export const POINTS_EXACT = 3;
export const POINTS_WINNER = 1;

// Puntos para fase eliminatoria
export const POINTS_EXACT_KO = 5;
export const POINTS_WINNER_KO = 2;

// Bonus por campeón
export const POINTS_CHAMPION = 10;

/**
 * Calcula puntos para un pronóstico de fase de grupos.
 */
export function calcMatchPoints(pred, result) {
  if (!result || !pred) return 0;
  const ph = parseInt(pred.home, 10);
  const pa = parseInt(pred.away, 10);
  const rh = parseInt(result.home, 10);
  const ra = parseInt(result.away, 10);
  if ([ph, pa, rh, ra].some((n) => Number.isNaN(n))) return 0;

  if (ph === rh && pa === ra) return POINTS_EXACT;

  const predOutcome = ph > pa ? 'H' : ph < pa ? 'A' : 'D';
  const realOutcome = rh > ra ? 'H' : rh < ra ? 'A' : 'D';
  if (predOutcome === realOutcome) return POINTS_WINNER;

  return 0;
}

/**
 * Calcula puntos para un pronóstico de fase eliminatoria.
 * Se evalúa contra el marcador de 90 minutos.
 */
export function calcKnockoutPoints(pred, result) {
  if (!result || !pred) return 0;
  const ph = parseInt(pred.home, 10);
  const pa = parseInt(pred.away, 10);
  const rh = parseInt(result.home, 10);
  const ra = parseInt(result.away, 10);
  if ([ph, pa, rh, ra].some((n) => Number.isNaN(n))) return 0;

  if (ph === rh && pa === ra) return POINTS_EXACT_KO;

  const predOutcome = ph > pa ? 'H' : ph < pa ? 'A' : 'D';
  const realOutcome = rh > ra ? 'H' : rh < ra ? 'A' : 'D';
  if (predOutcome === realOutcome) return POINTS_WINNER_KO;

  return 0;
}

export function isPredictionComplete(pred) {
  if (!pred) return false;
  const ph = parseInt(pred.home, 10);
  const pa = parseInt(pred.away, 10);
  return !Number.isNaN(ph) && !Number.isNaN(pa) && ph >= 0 && pa >= 0;
}

export function pointsLabel(pts) {
  if (pts === POINTS_EXACT_KO || pts === POINTS_EXACT) return '🎯 EXACTO';
  if (pts === POINTS_WINNER_KO || pts === POINTS_WINNER) return '✓ GANADOR';
  return '✗ FALLO';
}
