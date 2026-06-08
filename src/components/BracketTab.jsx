import { useState, useEffect } from 'react';
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
import { calcMatchPoints, pointsLabel } from '../lib/scoring.js';
import { useNow } from '../hooks/useNow.js';
import PublicPredictionsList from './PublicPredictionsList.jsx';

export default function BracketTab({ pollId }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState(null);
  const [results, setResults] = useState({});
  const [bracket, setBracket] = useState({});
  const [allPredictions, setAllPredictions] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = useNow(60 * 1000);

  useEffect(() => {
    if (!pollId || !user) return;
    const unsub = subscribeToPredictions(pollId, user.uid, (data) => {
      setPredictions(data);
      setLoading(false);
    });
    return unsub;
  }, [pollId, user?.uid]);

  useEffect(() => {
    const unsubR = subscribeToKnockoutResults(setResults);
    const unsubB = subscribeToKnockoutBracket(setBracket);
    return () => {
      unsubR();
      unsubB();
    };
  }, []);

  useEffect(() => {
    if (!pollId) return;
    const unsub = subscribeToAllPoolPredictions(pollId, setAllPredictions);
    return unsub;
  }, [pollId]);

  useEffect(() => {
    if (!pollId) return;
    const unsub = subscribeToPoolStats(pollId, setStats);
    return unsub;
  }, [pollId]);

  const lastGroupMatch = GROUP_MATCHES[GROUP_MATCHES.length - 1];
  const groupsFinished = isMatchLocked(lastGroupMatch, now);

  const koPreds = predictions?.knockoutMatches || {};

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
          La fase eliminatoria se desbloquea cuando termine la fase de grupos
          (28 de junio). En ese momento el super-admin configurará los
          clasificados y podrás pronosticar los cruces.
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

  return (
    <div className="bracket-tab">
      <div className="bracket-tip">
        <strong>📌 Cómo funciona:</strong> Pronostica el marcador del tiempo regular
        (90 minutos). Los penales no cuentan para los puntos pero sí definen quién pasa
        al siguiente cruce. Las reglas son las mismas que en fase de grupos: 3 pts
        marcador exacto, 1 pt acertar ganador. Cuando arranca cada partido, podrás ver
        los pronósticos de toda la polla.
      </div>

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
                return (
                  <KnockoutMatchCard
                    key={m.id}
                    match={{ ...m, ...participants }}
                    prediction={koPreds[m.id]}
                    result={results[m.id]}
                    now={now}
                    pollId={pollId}
                    userId={user.uid}
                    allPredictions={allPredictions}
                    stats={stats}
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

function KnockoutMatchCard({ match, prediction, result, now, pollId, userId, allPredictions, stats }) {
  const locked = isMatchLocked(match, now);
  const hasResult = !!result;
  const [showPublic, setShowPublic] = useState(false);

  const [scoreHome, setScoreHome] = useState(prediction?.scoreHome?.toString() ?? '');
  const [scoreAway, setScoreAway] = useState(prediction?.scoreAway?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setScoreHome(prediction?.scoreHome?.toString() ?? '');
    setScoreAway(prediction?.scoreAway?.toString() ?? '');
  }, [prediction?.scoreHome, prediction?.scoreAway]);

  useEffect(() => {
    if (locked) return;
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
  }, [scoreHome, scoreAway, locked, match.id, match.home, match.away, pollId, userId]);

  const handleNumeric = (setter) => (e) => {
    const v = e.target.value.replace(/[^0-9]/g, '');
    if (v === '') return setter('');
    const n = parseInt(v, 10);
    if (n > 20) return setter('20');
    setter(String(n));
  };

  // Puntos: solo importa el marcador (no los equipos)
  let pts = null;
  if (hasResult) {
    const ph = parseInt(scoreHome, 10);
    const pa = parseInt(scoreAway, 10);
    if (!Number.isNaN(ph) && !Number.isNaN(pa)) {
      pts = calcMatchPoints(
        { home: ph, away: pa },
        { home: result.scoreHome, away: result.scoreAway }
      );
    }
  }

  let statusLabel;
  let statusClass = 'm-status';
  if (hasResult) {
    statusLabel = `Resultado: ${result.scoreHome}-${result.scoreAway}${
      result.winner && result.scoreHome === result.scoreAway ? ` (pen. ${TEAMS.find(t=>t.code===result.winner)?.name || result.winner})` : ''
    }`;
    statusClass += ' m-status-final';
  } else if (locked) {
    statusLabel = '🔒 Cerrado · esperando resultado';
    statusClass += ' m-status-locked';
  } else {
    statusLabel = `Cierra en ${formatTimeUntilLock(match, now)}`;
    statusClass += ' m-status-open';
  }

  const predCount = (allPredictions || []).filter((p) => {
    const ko = p.knockoutMatches?.[match.id];
    return ko && ko.scoreHome != null && ko.scoreAway != null;
  }).length;

  return (
    <div className={`ko-card ${locked ? 'is-locked' : ''} ${hasResult ? 'has-result' : ''}`}>
      <div className="ko-card-meta">
        <span>{formatMatchDateTime(match)}</span>
        <span className={statusClass}>{statusLabel}</span>
      </div>
      <div className="ko-card-body">
        <div className="ko-team ko-team-home">{teamLabel(match.home)}</div>
        <div className="ko-score">
          <input
            type="text"
            inputMode="numeric"
            className="pred-input"
            value={scoreHome}
            onChange={handleNumeric(setScoreHome)}
            disabled={locked}
            aria-label="Goles local"
          />
          <span className="pred-dash">–</span>
          <input
            type="text"
            inputMode="numeric"
            className="pred-input"
            value={scoreAway}
            onChange={handleNumeric(setScoreAway)}
            disabled={locked}
            aria-label="Goles visitante"
          />
        </div>
        <div className="ko-team ko-team-away">{teamLabel(match.away)}</div>
      </div>
      <div className="ko-card-footer">
        {!locked && (saving || flash) && (
          <span className={`pred-save-flash ${flash ? 'shown' : ''}`}>
            {saving ? 'Guardando…' : '✓ Guardado'}
          </span>
        )}
        {pts != null && (
          <span className={`pred-points pred-pts-${pts}`}>
            {pointsLabel(pts)} · +{pts}
          </span>
        )}
        {match.city && <span className="ko-venue">{match.city}</span>}
      </div>

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
            result={result}
            phase="knockout"
            currentUid={userId}
            show={showPublic}
          />
        </div>
      )}
    </div>
  );
}
