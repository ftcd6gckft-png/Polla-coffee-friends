import { useMemo } from 'react';
import { calcMatchPoints, isPredictionComplete } from '../lib/scoring.js';

/**
 * Lista de pronósticos de TODOS los miembros para un partido específico.
 * Se muestra solo cuando el partido ya está bloqueado (lock T-15).
 *
 * Props:
 *   allPredictions  → array [{ uid, displayName, groupMatches, knockoutMatches }]
 *   stats           → array [{ uid, displayName }] de stats (para mapear uid → nombre)
 *   match           → objeto del partido
 *   result          → { home, away } o { scoreHome, scoreAway } si hay resultado oficial
 *   phase           → 'group' | 'knockout'
 *   currentUid      → para resaltar al usuario actual
 *   show            → boolean, controla visibilidad del desplegable
 */
export default function PublicPredictionsList({
  allPredictions,
  stats,
  match,
  result,
  phase = 'group',
  currentUid,
  show,
}) {
  // Mapa uid → displayName (de stats, que es público y siempre tiene nombre)
  const nameByUid = useMemo(() => {
    const m = {};
    (stats || []).forEach((s) => {
      if (s.displayName) m[s.uid] = s.displayName;
    });
    return m;
  }, [stats]);

  const rows = useMemo(() => {
    if (!allPredictions) return [];
    return allPredictions.map((p) => {
      let pred = null;
      if (phase === 'group') {
        pred = p.groupMatches?.[match.id];
      } else {
        const ko = p.knockoutMatches?.[match.id];
        if (ko && ko.scoreHome != null && ko.scoreAway != null) {
          pred = { home: ko.scoreHome, away: ko.scoreAway };
        }
      }
      const hasPred = isPredictionComplete(pred);

      // Calcular puntos si hay resultado oficial
      let pts = null;
      if (hasPred && result) {
        const r =
          phase === 'group'
            ? { home: result.home, away: result.away }
            : { home: result.scoreHome, away: result.scoreAway };
        pts = calcMatchPoints(pred, r);
      }

      return {
        uid: p.uid,
        name: nameByUid[p.uid] || p.uid.slice(0, 6),
        pred,
        hasPred,
        pts,
      };
    });
  }, [allPredictions, match.id, phase, result, nameByUid]);

  // Ordenar: con puntos exactos (3) primero, luego ganador (1), luego sin puntos, luego sin pronóstico
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      // Sin pronóstico va al final
      if (!a.hasPred && b.hasPred) return 1;
      if (a.hasPred && !b.hasPred) return -1;
      // Si ambos tienen pronóstico, ordenar por puntos descendente
      if (a.pts != null && b.pts != null) {
        if (b.pts !== a.pts) return b.pts - a.pts;
      }
      // Alfabético
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [rows]);

  if (!show) return null;

  if (sorted.length === 0) {
    return (
      <div className="pub-preds-empty">
        Aún no hay pronósticos de otros miembros.
      </div>
    );
  }

  return (
    <div className="pub-preds-list">
      {sorted.map((row) => {
        const isMe = row.uid === currentUid;
        let ptsBadge = null;
        if (row.pts === 3) ptsBadge = <span className="pub-pts pub-pts-3">+3</span>;
        else if (row.pts === 1) ptsBadge = <span className="pub-pts pub-pts-1">+1</span>;
        else if (row.pts === 0) ptsBadge = <span className="pub-pts pub-pts-0">0</span>;

        return (
          <div key={row.uid} className={`pub-pred-row ${isMe ? 'is-me' : ''}`}>
            <span className="pub-pred-name">
              {row.name}
              {isMe && <span className="pub-pred-you"> (tú)</span>}
            </span>
            <span className="pub-pred-score">
              {row.hasPred ? (
                <>
                  <strong>{row.pred.home}</strong>
                  <span className="pub-pred-dash"> – </span>
                  <strong>{row.pred.away}</strong>
                </>
              ) : (
                <span className="pub-pred-missing">sin pronóstico</span>
              )}
            </span>
            {ptsBadge}
          </div>
        );
      })}
    </div>
  );
}
