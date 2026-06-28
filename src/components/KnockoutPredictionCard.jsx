import { useState, useEffect, useRef } from 'react';
import { TEAMS, teamLabel } from '../data/teams.js';
import { isMatchLocked, formatMatchDateTime, formatTimeUntilLock } from '../lib/time.js';
import { calcKnockoutPoints, isPredictionComplete } from '../lib/scoring.js';
import { saveKnockoutPrediction } from '../lib/predictionsExtended.js';
import PublicPredictionsList from './PublicPredictionsList.jsx';

/**
 * Tarjeta de pronóstico para un partido de eliminatorias.
 *
 * Réplica visual de MatchPredictionCard pero adaptada a la regla 5/2.
 *
 * Props:
 *   match              → objeto del partido (con home y away resueltos)
 *   prediction         → { home, away, scoreHome, scoreAway } o null
 *   result             → { scoreHome, scoreAway, winner } resultado oficial o null
 *   now                → timestamp actual
 *   pollId, userId
 *   allPredictions     → predicciones de TODOS los miembros
 *   stats              → para mapear uid → nombre
 */
export default function KnockoutPredictionCard({
  match,
  prediction,
  result,
  now,
  pollId,
  userId,
  allPredictions = [],
  stats = [],
}) {
  const locked = isMatchLocked(match, now);
  const hasResult = !!result;
  const [showPublic, setShowPublic] = useState(false);

  const [home, setHome] = useState(prediction?.scoreHome?.toString() ?? '');
  const [away, setAway] = useState(prediction?.scoreAway?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setHome(prediction?.scoreHome?.toString() ?? '');
    setAway(prediction?.scoreAway?.toString() ?? '');
  }, [prediction?.scoreHome, prediction?.scoreAway]);

  const saveTimer = useRef(null);
  useEffect(() => {
    if (locked) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    const ph = parseInt(home, 10);
    const pa = parseInt(away, 10);
    if (Number.isNaN(ph) || Number.isNaN(pa) || ph < 0 || pa < 0) return;
    if (
      prediction &&
      prediction.scoreHome === ph &&
      prediction.scoreAway === pa &&
      prediction.home === match.home &&
      prediction.away === match.away
    ) return;

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveKnockoutPrediction(pollId, userId, match.id, {
          home: match.home,
          away: match.away,
          scoreHome: ph,
          scoreAway: pa,
        });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
      } catch (e) {
        console.error('[ko-save]', e);
      } finally {
        setSaving(false);
      }
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [home, away, locked, match.id, match.home, match.away, pollId, userId]);

  const handleNumeric = (setter) => (e) => {
    const v = e.target.value.replace(/[^0-9]/g, '');
    if (v === '') return setter('');
    const n = parseInt(v, 10);
    if (n > 20) return setter('20');
    setter(String(n));
  };

  // Puntos con la regla 5/2
  const pts = hasResult && isPredictionComplete({ home, away })
    ? calcKnockoutPoints(
        { home, away },
        { home: result.scoreHome, away: result.scoreAway }
      )
    : null;

  const ptsLabel = (n) => {
    if (n === 5) return '🎯 EXACTO';
    if (n === 2) return '✓ GANADOR';
    return '✗ FALLO';
  };

  let statusLabel;
  let statusClass = 'm-status';
  if (hasResult) {
    statusLabel = `Resultado: ${result.scoreHome} - ${result.scoreAway}${
      result.winner && result.scoreHome === result.scoreAway
        ? ` (pen. ${TEAMS.find((t) => t.code === result.winner)?.name || result.winner})`
        : ''
    }`;
    statusClass += ' m-status-final';
  } else if (locked) {
    statusLabel = '🔒 Cerrado · esperando resultado';
    statusClass += ' m-status-locked';
  } else {
    statusLabel = `Cierra en ${formatTimeUntilLock(match, now)}`;
    statusClass += ' m-status-open';
  }

  // Cuántos miembros pronosticaron este partido
  const predCount = allPredictions.filter((p) => {
    const pm = p.knockoutMatches?.[match.id];
    return pm && pm.scoreHome != null && pm.scoreAway != null;
  }).length;

  // Resultado en formato compatible con PublicPredictionsList
  const resultForList = result
    ? { scoreHome: result.scoreHome, scoreAway: result.scoreAway }
    : null;

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
            {ptsLabel(pts)} · +{pts}
          </span>
        )}
        {match.city && (
          <span className="pred-venue">{match.city}</span>
        )}
      </div>

      {/* Botón para ver pronósticos de todos - solo cuando está bloqueado */}
      {locked && predCount > 0 && (
        <div className="pred-card-public">
          <button
            className="pub-preds-toggle"
            onClick={() => setShowPublic((s) => !s)}
            aria-expanded={showPublic}
          >
            {showPublic ? '▴ Ocultar pronósticos' : `▾ Ver pronósticos de la polla (${predCount})`}
          </button>
          <PublicPredictionsList
            allPredictions={allPredictions}
            stats={stats}
            match={match}
            result={resultForList}
            phase="knockout"
            currentUid={userId}
            show={showPublic}
          />
        </div>
      )}
    </div>
  );
}
