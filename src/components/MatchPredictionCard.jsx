import { useState, useEffect, useRef } from 'react';
import { teamLabel } from '../data/teams.js';
import { isMatchLocked, formatMatchDateTime, formatTimeUntilLock } from '../lib/time.js';
import { calcMatchPoints, pointsLabel, isPredictionComplete } from '../lib/scoring.js';
import { saveGroupPrediction } from '../lib/predictions.js';

/**
 * Tarjeta de pronóstico para un partido de fase de grupos.
 *
 * Props:
 *   match     → objeto del fixture (id, group, date, time, home, away, city, venue)
 *   prediction → { home, away } o null si no hay
 *   result    → { home, away } o null si no hay resultado oficial
 *   now       → timestamp actual (de useNow para reactividad del lock)
 *   pollId    → id de la polla
 *   userId    → uid del usuario
 *   onSaved   → callback (opcional) para mostrar toast u otra acción
 */
export default function MatchPredictionCard({
  match,
  prediction,
  result,
  now,
  pollId,
  userId,
  onSaved,
}) {
  const locked = isMatchLocked(match, now);
  const hasResult = !!result;

  // Estado local de los inputs para edición fluida sin re-render del padre
  const [home, setHome] = useState(prediction?.home?.toString() ?? '');
  const [away, setAway] = useState(prediction?.away?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Si la predicción cambia desde fuera (ej. otro dispositivo del mismo usuario), sincronizar
  useEffect(() => {
    setHome(prediction?.home?.toString() ?? '');
    setAway(prediction?.away?.toString() ?? '');
  }, [prediction?.home, prediction?.away]);

  // Debounced save: guarda 500ms después de la última tecla
  const saveTimer = useRef(null);
  useEffect(() => {
    if (locked) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    const ph = parseInt(home, 10);
    const pa = parseInt(away, 10);
    if (Number.isNaN(ph) || Number.isNaN(pa) || ph < 0 || pa < 0) return;
    // No guardar si no hay cambios respecto a lo que ya está
    if (prediction && prediction.home === ph && prediction.away === pa) return;

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveGroupPrediction(pollId, userId, match.id, { home: ph, away: pa });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
        onSaved?.(match.id);
      } catch (e) {
        console.error('[predict] save failed', e);
      } finally {
        setSaving(false);
      }
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [home, away, locked, match.id, pollId, userId]);

  // Clamps: solo dígitos, máximo 2 cifras, entre 0 y 20
  const handleNumeric = (setter) => (e) => {
    const v = e.target.value.replace(/[^0-9]/g, '');
    if (v === '') return setter('');
    const n = parseInt(v, 10);
    if (n > 20) return setter('20');
    setter(String(n));
  };

  const pts = hasResult && isPredictionComplete({ home, away })
    ? calcMatchPoints({ home, away }, result)
    : null;

  // Estado visual del partido
  let statusLabel;
  let statusClass = 'm-status';
  if (hasResult) {
    statusLabel = `Resultado: ${result.home} - ${result.away}`;
    statusClass += ' m-status-final';
  } else if (locked) {
    statusLabel = '🔒 Cerrado · esperando resultado';
    statusClass += ' m-status-locked';
  } else {
    statusLabel = `Cierra en ${formatTimeUntilLock(match, now)}`;
    statusClass += ' m-status-open';
  }

  return (
    <div className={`pred-card ${locked ? 'is-locked' : ''} ${hasResult ? 'has-result' : ''}`}>
      <div className="pred-card-meta">
        <span className="pred-card-date">{formatMatchDateTime(match)}</span>
        <span className={statusClass}>{statusLabel}</span>
      </div>

      <div className="pred-card-body">
        <div className="pred-team pred-team-home">
          <span className="pred-team-label">{teamLabel(match.home)}</span>
        </div>

        <div className="pred-score">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="pred-input"
            value={home}
            onChange={handleNumeric(setHome)}
            disabled={locked}
            aria-label={`Goles ${match.home}`}
          />
          <span className="pred-dash">–</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="pred-input"
            value={away}
            onChange={handleNumeric(setAway)}
            disabled={locked}
            aria-label={`Goles ${match.away}`}
          />
        </div>

        <div className="pred-team pred-team-away">
          <span className="pred-team-label">{teamLabel(match.away)}</span>
        </div>
      </div>

      <div className="pred-card-footer">
        {!locked && (saving || savedFlash) && (
          <span className={`pred-save-flash ${savedFlash ? 'shown' : ''}`}>
            {saving ? 'Guardando…' : '✓ Guardado'}
          </span>
        )}
        {pts != null && (
          <span className={`pred-points pred-pts-${pts}`}>
            {pointsLabel(pts)} · +{pts}
          </span>
        )}
        {match.city && (
          <span className="pred-venue">{match.city}</span>
        )}
      </div>
    </div>
  );
}
