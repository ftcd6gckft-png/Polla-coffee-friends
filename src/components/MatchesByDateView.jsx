import { useState, useMemo } from 'react';
import { GROUP_MATCHES } from '../data/groupMatches.js';
import MatchPredictionCard from './MatchPredictionCard.jsx';
import { isMatchLocked } from '../lib/time.js';
import { isPredictionComplete } from '../lib/scoring.js';

/**
 * Vista de partidos de FASE DE GRUPOS agrupados por día (orden cronológico).
 *
 * Props:
 *   pollId, userId
 *   predictions      → { groupMatches: {...} }
 *   results          → resultados oficiales
 *   now              → timestamp (de useNow)
 *   allPredictions   → todas las del pool (para lista pública post-lock)
 *   stats            → para mapear uid → displayName
 */
export default function MatchesByDateView({
  pollId,
  userId,
  predictions,
  results,
  now,
  allPredictions,
  stats,
}) {
  const [onlyPending, setOnlyPending] = useState(false);
  const groupPreds = predictions?.groupMatches || {};

  // Determinar para cada partido si está "pendiente" (no bloqueado y sin pronóstico)
  const isPending = (match) => {
    if (isMatchLocked(match, now)) return false;
    const p = groupPreds[match.id];
    return !isPredictionComplete(p);
  };

  // Total de pendientes (para el contador del botón)
  const totalPending = useMemo(
    () => GROUP_MATCHES.filter(isPending).length,
    [groupPreds, now]
  );

  // Filtrar y agrupar por fecha
  const groupedByDate = useMemo(() => {
    const filtered = onlyPending
      ? GROUP_MATCHES.filter(isPending)
      : GROUP_MATCHES;

    // Ya están ordenados por fecha+hora en groupMatches.js (G01 → G72 son cronológicos),
    // pero por si acaso ordenamos también.
    const sorted = [...filtered].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    // Agrupar por fecha
    const map = new Map();
    for (const m of sorted) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    }
    return Array.from(map.entries()); // [[date, matches[]], ...]
  }, [onlyPending, groupPreds, now]);

  return (
    <div className="by-date-view">
      <div className="by-date-controls">
        <button
          className={`by-date-filter ${onlyPending ? 'is-active' : ''}`}
          onClick={() => setOnlyPending((v) => !v)}
        >
          {onlyPending ? '✓ ' : ''}Mostrar solo pendientes
          {totalPending > 0 && (
            <span className="by-date-filter-count">{totalPending}</span>
          )}
        </button>
      </div>

      {groupedByDate.length === 0 ? (
        <div className="by-date-empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <h3 className="by-date-empty-title">¡No te queda nada por pronosticar!</h3>
          <p className="by-date-empty-text">
            Ya hiciste tu pronóstico de todos los partidos abiertos.
          </p>
        </div>
      ) : (
        groupedByDate.map(([date, matches]) => (
          <div key={date} className="by-date-day">
            <DayHeader date={date} matches={matches} groupPreds={groupPreds} now={now} />
            <div className="by-date-day-matches">
              {matches.map((match) => (
                <MatchPredictionCard
                  key={match.id}
                  match={match}
                  prediction={groupPreds[match.id] || null}
                  result={results?.[match.id] || null}
                  now={now}
                  pollId={pollId}
                  userId={userId}
                  allPredictions={allPredictions}
                  stats={stats}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function DayHeader({ date, matches, groupPreds, now }) {
  // Parse YYYY-MM-DD a hora local-COL (usamos mediodía UTC para evitar shifts de día)
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const dayName = DAY_NAMES[dt.getUTCDay()];
  const monthName = MONTH_NAMES[m - 1];

  // Stats del día: cuántos pronosticados, cuántos bloqueados
  const total = matches.length;
  const pronosticados = matches.filter((mm) => {
    const p = groupPreds[mm.id];
    return p && p.home != null && p.away != null;
  }).length;
  const bloqueados = matches.filter((mm) => isMatchLocked(mm, now)).length;

  return (
    <div className="by-date-day-header">
      <div className="by-date-day-title">
        {dayName} <span className="by-date-day-num">{d}</span> de {monthName}
      </div>
      <div className="by-date-day-meta">
        <span>{total} partido{total !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span className={pronosticados === total ? 'is-complete' : ''}>
          {pronosticados}/{total} pronosticados
        </span>
        {bloqueados > 0 && (
          <>
            <span>·</span>
            <span className="is-locked-info">🔒 {bloqueados} cerrados</span>
          </>
        )}
      </div>
    </div>
  );
}
