import { useState, useMemo, useEffect } from 'react';
import { GROUP_MATCHES } from '../data/groupMatches.js';
import MatchPredictionCard from './MatchPredictionCard.jsx';
import { isMatchLocked } from '../lib/time.js';
import { isPredictionComplete } from '../lib/scoring.js';

/**
 * Vista de partidos de FASE DE GRUPOS agrupados por día (orden cronológico).
 * Cada día es un acordeón colapsable. Por defecto se expande automáticamente
 * el próximo día con partidos pendientes.
 *
 * Props:
 *   pollId, userId
 *   predictions, results, now, allPredictions, stats
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
  const [expandedDates, setExpandedDates] = useState(() => new Set());
  const [autoExpandedOnce, setAutoExpandedOnce] = useState(false);
  const groupPreds = predictions?.groupMatches || {};

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

    const sorted = [...filtered].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    const map = new Map();
    for (const m of sorted) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    }
    return Array.from(map.entries());
  }, [onlyPending, groupPreds, now]);

  // Auto-expandir el próximo día con pendientes la primera vez que cargamos
  useEffect(() => {
    if (autoExpandedOnce) return;
    if (groupedByDate.length === 0) return;

    // Buscar el primer día (cronológicamente) que tenga al menos un partido pendiente
    let dateToExpand = null;
    for (const [date, matches] of groupedByDate) {
      const hasPending = matches.some(isPending);
      if (hasPending) {
        dateToExpand = date;
        break;
      }
    }
    // Si no hay días con pendientes, expandir el primer día del listado (por si quiere ver historial)
    if (!dateToExpand && groupedByDate.length > 0) {
      dateToExpand = groupedByDate[0][0];
    }
    if (dateToExpand) {
      setExpandedDates(new Set([dateToExpand]));
      setAutoExpandedOnce(true);
    }
  }, [groupedByDate, autoExpandedOnce]);

  // Cuando se activa el filtro "solo pendientes", expandir todos los días filtrados
  // (porque obviamente quieres ver lo pendiente)
  useEffect(() => {
    if (onlyPending && groupedByDate.length > 0) {
      setExpandedDates(new Set(groupedByDate.map(([date]) => date)));
    }
  }, [onlyPending]);

  const toggleDate = (date) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDates(new Set(groupedByDate.map(([d]) => d)));
  };
  const collapseAll = () => {
    setExpandedDates(new Set());
  };

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
        {groupedByDate.length > 0 && (
          <div className="by-date-bulk">
            <button className="by-date-bulk-btn" onClick={expandAll}>
              Expandir todo
            </button>
            <span className="by-date-bulk-sep">·</span>
            <button className="by-date-bulk-btn" onClick={collapseAll}>
              Colapsar todo
            </button>
          </div>
        )}
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
        groupedByDate.map(([date, matches]) => {
          const isExpanded = expandedDates.has(date);
          return (
            <div key={date} className={`by-date-day ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
              <DayHeader
                date={date}
                matches={matches}
                groupPreds={groupPreds}
                now={now}
                isExpanded={isExpanded}
                onToggle={() => toggleDate(date)}
              />
              {isExpanded && (
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
              )}
            </div>
          );
        })
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

function DayHeader({ date, matches, groupPreds, now, isExpanded, onToggle }) {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const dayName = DAY_NAMES[dt.getUTCDay()];
  const monthName = MONTH_NAMES[m - 1];

  const total = matches.length;
  const pronosticados = matches.filter((mm) => {
    const p = groupPreds[mm.id];
    return p && p.home != null && p.away != null;
  }).length;
  const bloqueados = matches.filter((mm) => isMatchLocked(mm, now)).length;
  const pendingHere = matches.filter((mm) => {
    if (isMatchLocked(mm, now)) return false;
    const p = groupPreds[mm.id];
    return !(p && p.home != null && p.away != null);
  }).length;

  return (
    <button
      className="by-date-day-header"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={`day-${date}`}
    >
      <div className="by-date-day-header-main">
        <span className="by-date-day-chevron">{isExpanded ? '▴' : '▾'}</span>
        <div className="by-date-day-title">
          {dayName} <span className="by-date-day-num">{d}</span> de {monthName}
        </div>
      </div>
      <div className="by-date-day-meta">
        <span>{total} partido{total !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span className={pronosticados === total ? 'is-complete' : ''}>
          {pronosticados}/{total} pronosticados
        </span>
        {pendingHere > 0 && (
          <>
            <span>·</span>
            <span className="by-date-day-pending-pill">
              {pendingHere} pendiente{pendingHere !== 1 ? 's' : ''}
            </span>
          </>
        )}
        {bloqueados > 0 && (
          <>
            <span>·</span>
            <span className="is-locked-info">🔒 {bloqueados} cerrado{bloqueados !== 1 ? 's' : ''}</span>
          </>
        )}
      </div>
    </button>
  );
}
