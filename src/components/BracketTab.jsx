import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  KNOCKOUT_MATCHES,
  PHASE_LABELS,
  PHASES_ORDER,
} from '../data/knockoutTemplate.js';
import { GROUP_MATCHES } from '../data/groupMatches.js';
import { TEAMS, teamLabel } from '../data/teams.js';
import {
  subscribeToPredictions,
  subscribeToAllPoolPredictions,
} from '../lib/predictions.js';
import {
  saveKnockoutPrediction,
  subscribeToKnockoutResults,
  subscribeToKnockoutBracket,
  subscribeToPoolStats,
} from '../lib/predictionsExtended.js';
import { isMatchLocked, formatMatchDateTime, formatTimeUntilLock } from '../lib/time.js';
import { calcKnockoutPoints } from '../lib/scoring.js';
import { useNow } from '../hooks/useNow.js';

/**
 * Pestaña: bracket de eliminatorias.
 *
 * Permite:
 *   - Pronosticar partidos abiertos (vista personal).
 *   - Después del lock de un partido, ver pronósticos de otros miembros.
 *
 * Sistema de puntos KO: 5 exacto / 2 ganador / 0.
 */
export default function BracketTab({ pollId }) {
  const { user } = useAuth();
  const [myPredictions, setMyPredictions] = useState(null);
  const [allPredictions, setAllPredictions] = useState([]);
  const [memberStats, setMemberStats] = useState([]);
  const [results, setResults] = useState({});
  const [bracket, setBracket] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewingUserId, setViewingUserId] = useState(null); // null = mis pronósticos
  const now = useNow(60 * 1000);

  // Mis pronósticos
  useEffect(() => {
    if (!pollId || !user) return;
    const unsub = subscribeToPredictions(pollId, user.uid, (data) => {
      setMyPredictions(data);
      setLoading(false);
    });
    return unsub;
  }, [pollId, user?.uid]);

  // Pronósticos de todos los miembros (array de { uid, ... })
  useEffect(() => {
    if (!pollId) return;
    const unsub = subscribeToAllPoolPredictions(pollId, (data) => {
      setAllPredictions(Array.isArray(data) ? data : []);
    });
    return unsub;
  }, [pollId]);

  // Stats para tener los displayNames de los miembros
  useEffect(() => {
    if (!pollId) return;
    const unsub = subscribeToPoolStats(pollId, (stats) => {
      setMemberStats(Array.isArray(stats) ? stats : []);
    });
    return unsub;
  }, [pollId]);

  // Resultados oficiales + bracket
  useEffect(() => {
    const unsubR = subscribeToKnockoutResults(setResults);
    const unsubB = subscribeToKnockoutBracket(setBracket);
    return () => {
      unsubR();
      unsubB();
    };
  }, []);

  // Mapa uid → predicciones para acceso rápido
  const predsByUid = useMemo(() => {
    const map = {};
    for (const p of allPredictions) {
      if (p && p.uid) map[p.uid] = p;
    }
    return map;
  }, [allPredictions]);

  const lastGroupMatch = GROUP_MATCHES[GROUP_MATCHES.length - 1];
  const groupsFinished = isMatchLocked(lastGroupMatch, now);

  if (loading) {
    return (
      <div className="cnj-loading" style={{ padding: 40 }}>
        <div className="cnj-spinner" />
        <span>Cargando…</span>
      </div>
    );
  }

  const anyBracketConfigured = Object.keys(bracket).length > 0;

  if (!groupsFinished && !anyBracketConfigured) {
    return (
      <div className="cnj-soon-card">
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
        <h2 className="cnj-soon-title">Bracket en espera</h2>
        <p className="cnj-soon-text">
          La fase eliminatoria se desbloquea cuando termine la fase de grupos.
          En ese momento el super-admin configurará los clasificados y podrás
          pronosticar los cruces.
        </p>
        <div className="cnj-soon-checklist">
          <div className="cnj-soon-item">📅 Dieciseisavos · 28 jun - 3 jul</div>
          <div className="cnj-soon-item">📅 Octavos · 4 - 7 jul</div>
          <div className="cnj-soon-item">📅 Cuartos · 9 - 11 jul</div>
          <div className="cnj-soon-item">📅 Semifinales · 14 - 15 jul</div>
          <div className="cnj-soon-item">📅 3er puesto · 18 jul</div>
          <div className="cnj-soon-item">📅 Final · 19 jul · MetLife</div>
        </div>
      </div>
    );
  }

  // Lista de miembros para el dropdown
  // Usa los stats si están disponibles; si no, cae a la lista de predicciones
  let memberList = [];
  if (memberStats.length > 0) {
    memberList = memberStats
      .filter((s) => (s.userId || s.uid) !== user.uid)
      .map((s) => ({
        uid: s.userId || s.uid,
        name: s.displayName || s.email || (s.userId || s.uid || '').slice(0, 6),
      }));
  } else {
    // Fallback: usar los uids de allPredictions
    memberList = allPredictions
      .filter((p) => p.uid !== user.uid)
      .map((p) => ({
        uid: p.uid,
        name: p.displayName || p.uid.slice(0, 6),
      }));
  }

  // Determinar qué predicciones mostrar
  const isViewingOther = !!viewingUserId && viewingUserId !== user.uid;
  const viewedUserData = isViewingOther
    ? predsByUid[viewingUserId]
    : myPredictions;
  const viewedKoPreds = viewedUserData?.knockoutMatches || {};
  const myKoPreds = myPredictions?.knockoutMatches || {};

  return (
    <div className="bracket-tab">
      <div className="bracket-tip">
        <strong>📌 Cómo funciona:</strong> Pronostica el marcador del tiempo regular
        (90 minutos) — los penales no cuentan para los puntos pero sí definen
        quién pasa al siguiente cruce. <strong>5 pts</strong> marcador exacto,
        <strong> 2 pts</strong> acertar ganador.
      </div>

      {memberList.length > 0 && (
        <div className="public-preds-bar">
          <label className="public-preds-label" htmlFor="ko-view-select">
            Ver pronósticos de:
          </label>
          <select
            id="ko-view-select"
            className="fi public-preds-select"
            value={viewingUserId || ''}
            onChange={(e) => setViewingUserId(e.target.value || null)}
          >
            <option value="">📝 Mis pronósticos</option>
            {memberList.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.name}
              </option>
            ))}
          </select>
          {isViewingOther && (
            <div className="public-preds-note">
              👁️ Viendo a otro miembro · solo se muestran partidos cerrados.
            </div>
          )}
        </div>
      )}

      {PHASES_ORDER.map((phase) => {
        const matchesInPhase = KNOCKOUT_MATCHES.filter((m) => m.phase === phase);
        const configured = matchesInPhase.filter((m) => bracket[m.id]);
        if (configured.length === 0) {
          return (
            <PhaseLockedBlock
              key={phase}
              phase={phase}
              totalMatches={matchesInPhase.length}
            />
          );
        }
        return (
          <div key={phase} className="bracket-phase">
            <div className="bracket-phase-header">
              <h3 className="bracket-phase-title">{PHASE_LABELS[phase]}</h3>
              <span className="bracket-phase-count">
                {configured.length}/{matchesInPhase.length}
              </span>
            </div>
            <div className="bracket-matches">
              {matchesInPhase.map((m) => {
                const participants = bracket[m.id];
                if (!participants) {
                  return <PendingMatchCard key={m.id} match={m} />;
                }

                const locked = isMatchLocked({ ...m, ...participants }, now);

                if (isViewingOther && !locked) {
                  return (
                    <LockedPrivacyCard key={m.id} match={{ ...m, ...participants }} now={now} />
                  );
                }

                const predToShow = isViewingOther
                  ? viewedKoPreds[m.id]
                  : myKoPreds[m.id];

                return (
                  <KnockoutMatchCard
                    key={m.id}
                    match={{ ...m, ...participants }}
                    prediction={predToShow}
                    result={results[m.id]}
                    now={now}
                    pollId={pollId}
                    userId={user.uid}
                    readOnly={isViewingOther}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function PhaseLockedBlock({ phase, totalMatches }) {
  return (
    <div className="bracket-phase is-locked">
      <div className="bracket-phase-header">
        <h3 className="bracket-phase-title">{PHASE_LABELS[phase]}</h3>
        <span className="bracket-phase-count">0/{totalMatches}</span>
      </div>
      <div className="bracket-phase-locked-msg">
        🔒 Esperando que termine la fase anterior y el super-admin configure los cruces.
      </div>
    </div>
  );
}

function PendingMatchCard({ match }) {
  return (
    <div className="ko-card is-pending">
      <div className="ko-card-meta">
        <span>{formatMatchDateTime(match)}</span>
        <span className="m-status m-status-locked">por definir</span>
      </div>
      <div className="ko-card-body">
        <span className="ko-pending-team">{match.homeSlot}</span>
        <span className="ko-vs">vs</span>
        <span className="ko-pending-team">{match.awaySlot}</span>
      </div>
      {match.city && <div className="ko-venue">{match.city}</div>}
    </div>
  );
}

function LockedPrivacyCard({ match, now }) {
  return (
    <div className="ko-card is-pending">
      <div className="ko-card-meta">
        <span>{formatMatchDateTime(match)}</span>
        <span className="m-status m-status-open">
          🔒 Cierra en {formatTimeUntilLock(match, now)}
        </span>
      </div>
      <div className="ko-card-body">
        <div className="ko-team ko-team-home">{teamLabel(match.home)}</div>
        <div className="ko-score">
          <span className="ko-vs">vs</span>
        </div>
        <div className="ko-team ko-team-away">{teamLabel(match.away)}</div>
      </div>
      <div className="ko-card-footer">
        <span style={{ fontSize: 11, color: 'var(--muted-2)', textAlign: 'center', width: '100%' }}>
          🔐 El pronóstico se podrá ver cuando se cierre el partido
        </span>
      </div>
    </div>
  );
}

function KnockoutMatchCard({ match, prediction, result, now, pollId, userId, readOnly }) {
  const locked = isMatchLocked(match, now);
  const hasResult = !!result;

  const [scoreHome, setScoreHome] = useState(
    prediction?.scoreHome?.toString() ?? ''
  );
  const [scoreAway, setScoreAway] = useState(
    prediction?.scoreAway?.toString() ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setScoreHome(prediction?.scoreHome?.toString() ?? '');
    setScoreAway(prediction?.scoreAway?.toString() ?? '');
  }, [prediction?.scoreHome, prediction?.scoreAway]);

  useEffect(() => {
    if (locked || readOnly) return;
    const ph = parseInt(scoreHome, 10);
    const pa = parseInt(scoreAway, 10);
    if (Number.isNaN(ph) || Number.isNaN(pa) || ph < 0 || pa < 0) return;
    if (
      prediction &&
      prediction.scoreHome === ph &&
      prediction.scoreAway === pa &&
      prediction.home === match.home &&
      prediction.away === match.away
    )
      return;

    const t = setTimeout(async () => {
      setSaving(true);
      try {
        await saveKnockoutPrediction(pollId, userId, match.id, {
          home: match.home,
          away: match.away,
          scoreHome: ph,
          scoreAway: pa,
        });
        setFlash(true);
        setTimeout(() => setFlash(false), 1200);
      } catch (e) {
        console.error('[ko-save]', e);
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [scoreHome, scoreAway, locked, readOnly, match.id, match.home, match.away, pollId, userId]);

  const handleNumeric = (setter) => (e) => {
    const v = e.target.value.replace(/[^0-9]/g, '');
    if (v === '') return setter('');
    const n = parseInt(v, 10);
    if (n > 20) return setter('20');
    setter(String(n));
  };

  let pts = null;
  if (hasResult) {
    const ph = parseInt(scoreHome, 10);
    const pa = parseInt(scoreAway, 10);
    if (!Number.isNaN(ph) && !Number.isNaN(pa)) {
      pts = calcKnockoutPoints(
        { home: ph, away: pa },
        { home: result.scoreHome, away: result.scoreAway }
      );
    }
  }

  let statusLabel;
  let statusClass = 'm-status';
  if (hasResult) {
    statusLabel = `Resultado: ${result.scoreHome}-${result.scoreAway}${
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

  const ptsLabel = (n) => {
    if (n === 5) return '🎯 EXACTO';
    if (n === 2) return '✓ GANADOR';
    return '✗ FALLO';
  };

  const hasPred = prediction && (prediction.scoreHome != null || prediction.scoreAway != null);

  return (
    <div className={`ko-card ${locked ? 'is-locked' : ''} ${hasResult ? 'has-result' : ''}`}>
      <div className="ko-card-meta">
        <span>{formatMatchDateTime(match)}</span>
        <span className={statusClass}>{statusLabel}</span>
      </div>
      <div className="ko-card-body">
        <div className="ko-team ko-team-home">{teamLabel(match.home)}</div>
        <div className="ko-score">
          {readOnly && !hasPred ? (
            <span className="pred-empty">— : —</span>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                className="pred-input"
                value={scoreHome}
                onChange={handleNumeric(setScoreHome)}
                disabled={locked || readOnly}
                aria-label="Goles local"
              />
              <span className="pred-dash">–</span>
              <input
                type="text"
                inputMode="numeric"
                className="pred-input"
                value={scoreAway}
                onChange={handleNumeric(setScoreAway)}
                disabled={locked || readOnly}
                aria-label="Goles visitante"
              />
            </>
          )}
        </div>
        <div className="ko-team ko-team-away">{teamLabel(match.away)}</div>
      </div>
      <div className="ko-card-footer">
        {!locked && !readOnly && (saving || flash) && (
          <span className={`pred-save-flash ${flash ? 'shown' : ''}`}>
            {saving ? 'Guardando…' : '✓ Guardado'}
          </span>
        )}
        {pts != null && (
          <span className={`pred-points pred-pts-${pts}`}>
            {ptsLabel(pts)} · +{pts}
          </span>
        )}
        {readOnly && !hasPred && (
          <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
            Este miembro no pronosticó este partido
          </span>
        )}
        {match.city && <span className="ko-venue">{match.city}</span>}
      </div>
    </div>
  );
}
