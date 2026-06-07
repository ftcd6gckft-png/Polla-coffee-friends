// ─────────────────────────────────────────────────────────────────
// Sistema de tiempo y bloqueos para pronósticos
// Todo en zona horaria Colombia (UTC-5, sin DST).
// ─────────────────────────────────────────────────────────────────

// Offset fijo de Colombia: UTC-5 (no usa horario de verano)
const COLOMBIA_OFFSET_HOURS = -5;

// Ventana de bloqueo: cuántos minutos ANTES del kickoff se cierra el pronóstico
export const LOCK_WINDOW_MINUTES = 15;

/**
 * Convierte la fecha+hora COL de un partido (formato "2026-06-11" + "14:00")
 * a un timestamp UTC en milisegundos.
 *
 * Implementación: armamos el timestamp como si fuera UTC, y le sumamos 5 horas
 * para "deshacer" la diferencia (porque las 14:00 COL = 19:00 UTC).
 */
export function matchKickoffMs(match) {
  if (!match || !match.date || !match.time) return null;
  const [y, m, d] = match.date.split('-').map(Number);
  const [hh, mm] = match.time.split(':').map(Number);
  // Date.UTC interpreta los args como UTC.
  // 14:00 COL = 19:00 UTC → sumamos |offset| horas
  const utcMs = Date.UTC(y, m - 1, d, hh - COLOMBIA_OFFSET_HOURS, mm, 0);
  return utcMs;
}

/**
 * Momento (ms UTC) en que se bloquea el pronóstico de un partido.
 * = kickoff - 15 minutos
 */
export function matchLockMs(match) {
  const k = matchKickoffMs(match);
  if (k == null) return null;
  return k - LOCK_WINDOW_MINUTES * 60 * 1000;
}

/**
 * ¿Está bloqueado el partido AHORA?
 * Usa Date.now() para que cada usuario en cada dispositivo evalúe
 * el lock contra su reloj actual (que se sincroniza vía NTP en casi todos).
 */
export function isMatchLocked(match, nowMs = Date.now()) {
  const lock = matchLockMs(match);
  if (lock == null) return true; // si no hay fecha válida, bloqueamos por seguridad
  return nowMs >= lock;
}

/**
 * Calcula cuánto falta para el lock (en ms). Negativo si ya pasó.
 */
export function msUntilLock(match, nowMs = Date.now()) {
  const lock = matchLockMs(match);
  if (lock == null) return -Infinity;
  return lock - nowMs;
}

/**
 * Formatea ms restantes como "2d 4h" / "3h 12m" / "12 min" / "ya cerrado".
 */
export function formatTimeUntilLock(match, nowMs = Date.now()) {
  const diff = msUntilLock(match, nowMs);
  if (diff <= 0) return 'cerrado';
  const totalMin = Math.floor(diff / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

/**
 * Formatea la fecha+hora del partido para mostrar al usuario.
 * Ej: "Jue 11 jun · 14:00"
 */
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatMatchDateTime(match) {
  if (!match?.date || !match?.time) return '';
  const [y, m, d] = match.date.split('-').map(Number);
  // Construir la fecha en hora local (no UTC) para sacar el día de la semana correcto
  // Como el partido es en hora Colombia, y queremos día de la semana en Colombia, usamos directamente.
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)); // mediodía UTC, evita líos de DST
  const dayName = DAY_NAMES[dt.getUTCDay()];
  const monthName = MONTH_NAMES[m - 1];
  return `${dayName} ${d} ${monthName} · ${match.time}`;
}
