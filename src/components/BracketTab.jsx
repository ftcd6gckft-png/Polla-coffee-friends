import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  KNOCKOUT_MATCHES,
  PHASE_LABELS,
  PHASES_ORDER,
} from '../data/knockoutTemplate.js';
import { GROUP_MATCHES } from '../data/groupMatches.js';
import {
  subscribeToPredictions,
  subscribeToAllPoolPredictions,
} from '../lib/predictions.js';
import {
  subscribeToKnockoutResults,
  subscribeToKnockoutBracket,
  subscribeToPoolStats,
} from '../lib/predictionsExtended.js';
import { isMatchLocked, formatMatchDateTime } from '../lib/time.js';
import { useNow } from '../hooks/useNow.js';
import KnockoutPredictionCard from './KnockoutPredictionCard.jsx';

export default function BracketTab({ pollId }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState(null);
  const [allPredictions, setAllPredictions] = useState([]);
  const [stats, setStats] = useState([]);
  const [results, setResults] = useState({});
  const [bracket, setBracket] = useState({});
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
    if (!pollId) return;
    const unsub = subscribeToAllPoolPredictions(pollId, setAllPredictions);
    return unsub;
  }, [pollId]);

  useEffect(() => {
    if (!pollId) return;
    const unsub = subscribeToPoolStats(pollId, setStats);
    return unsub;
  }, [pollId]);

  useEffect(() => {
    const unsubR = subscribeToKnockoutResults(setResults);
    const unsubB = subscribeToKnockoutBracket(setBracket);
    return () => {
      unsubR();
      unsubB();
    };
  }, []);

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

  return (
    <div className="bracket-tab">
      <div className="bracket-tip">
        <strong>📌 Cómo funciona:</strong> Pronostica el marcador del tiempo regular
        (90 minutos) — los penales no cuentan para los puntos pero sí definen
        quién pasa al siguiente cruce. <strong>5 pts</strong> marcador exacto,
        <strong> 2 pts</strong> acertar ganador.
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
                  <KnockoutPredictionCard
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
