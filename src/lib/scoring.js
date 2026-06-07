// ─────────────────────────────────────────────────────────────────
// Sistema de puntuación
// 3 puntos por marcador exacto
// 1 punto por acertar ganador (incluye empate)
// 0 puntos por fallo
// Para eliminatorias: se usa el marcador de tiempo regular (90 min)
// ─────────────────────────────────────────────────────────────────

export const POINTS_EXACT = 3;
export const POINTS_WINNER = 1;
export const POINTS_CHAMPION = 5;

/**
 * Calcula puntos para un pronóstico individual contra un resultado oficial.
 *
 * @param pred  { home: number, away: number } - pronóstico del usuario
 * @param result { home: number, away: number } - resultado oficial
 * @returns number 0, 1, o 3
 */
export function calcMatchPoints(pred, result) {
  if (!result || !pred) return 0;
  const ph = parseInt(pred.home, 10);
  const pa = parseInt(pred.away, 10);
  const rh = parseInt(result.home, 10);
  const ra = parseInt(result.away, 10);
  if ([ph, pa, rh, ra].some((n) => Number.isNaN(n))) return 0;

  // Marcador exacto
  if (ph === rh && pa === ra) return POINTS_EXACT;

  // Mismo ganador (o empate)
  const predOutcome = ph > pa ? 'H' : ph < pa ? 'A' : 'D';
  const realOutcome = rh > ra ? 'H' : rh < ra ? 'A' : 'D';
  if (predOutcome === realOutcome) return POINTS_WINNER;

  return 0;
}

/**
 * ¿Está el pronóstico completo? (los dos lados llenos con números válidos)
 */
export function isPredictionComplete(pred) {
  if (!pred) return false;
  const ph = parseInt(pred.home, 10);
  const pa = parseInt(pred.away, 10);
  return !Number.isNaN(ph) && !Number.isNaN(pa) && ph >= 0 && pa >= 0;
}

/**
 * Etiqueta legible para un puntaje individual.
 */
export function pointsLabel(pts) {
  if (pts === POINTS_EXACT) return '🎯 EXACTO';
  if (pts === POINTS_WINNER) return '✓ GANADOR';
  return '✗ FALLO';
}
