import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { GROUP_MATCHES } from '../data/groupMatches.js';
import { GROUPS } from '../data/teams.js';
import { subscribeToPredictions, subscribeToGroupResults } from '../lib/predictions.js';
import { useNow } from '../hooks/useNow.js';
import { isMatchLocked } from '../lib/time.js';
import { calcMatchPoints, isPredictionComplete } from '../lib/scoring.js';
import GroupSelector from './GroupSelector.jsx';
import MatchPredictionCard from './MatchPredictionCard.jsx';

/**
 * Pestaña de pronósticos de la fase de grupos para una polla específica.
 *
 * Props:
 *   pollId → string
 */
export default function GroupPredictionsTab({ pollId }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState(null);
  const [results, setResults] = useState({});
  const [loadingPred, setLoadingPred] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]);
  const now = useNow(30 * 1000); // re-evalúa lock cada 30s

  // Suscripciones en tiempo real
  useEffect(() => {
    if (!pollId || !user) return;
    const unsub = subscribeToPredictions(pollId, user.uid, (data) => {
      setPredictions(data || { groupMatches: {} });
      setLoadingPred(false);
    });
    return unsub;
  }, [pollId, user?.uid]);

  useEffect(() => {
    const unsub = subscribeToGroupResults((data) => {
      setResults(data || {});
      setLoadingResults(false);
    });
    return unsub;
  }, []);

  const groupPredictions = predictions?.groupMatches || {};
  const matchesInGroup = GROUP_MATCHES.filter((m) => m.group === activeGroup);

  // Estadísticas globales para el header
  const stats = computeStats(groupPredictions, results, now);

  if (loadingPred || loadingResults) {
    return (
      <div className="cnj-loading" style={{ padding: 40 }}>
        <div className="cnj-spinner" />
        <span>Cargando pronósticos…</span>
      </div>
    );
  }

  return (
    <div className="preds-tab">
      <PredsHeader stats={stats} />

      <GroupSelector
        activeGroup={activeGroup}
        onChange={setActiveGroup}
        predictions={groupPredictions}
      />

      <div className="preds-list">
        {matchesInGroup.map((match) => (
          <MatchPredictionCard
            key={match.id}
            match={match}
            prediction={groupPredictions[match.id] || null}
            result={results[match.id] || null}
            now={now}
            pollId={pollId}
            userId={user.uid}
          />
        ))}
      </div>

      <div className="preds-tip">
        <strong>💡 Tip:</strong> tus pronósticos se guardan automáticamente. Puedes editarlos las
        veces que quieras hasta 15 minutos antes del inicio del partido. Después, quedan
        bloqueados y solo se calculan los puntos cuando se cargue el resultado oficial.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function computeStats(predsMap, resultsMap, now) {
  let total = 0;
  let completed = 0;
  let locked = 0;
  let points = 0;
  let exact = 0;
  let winner = 0;
  let scored = 0; // partidos con resultado oficial cargado

  for (const m of GROUP_MATCHES) {
    total += 1;
    const p = predsMap[m.id];
    if (p && p.home != null && p.away != null) completed += 1;
    if (isMatchLocked(m, now)) locked += 1;
    const r = resultsMap[m.id];
    if (r) {
      scored += 1;
      if (isPredictionComplete(p)) {
        const pts = calcMatchPoints(p, r);
        points += pts;
        if (pts === 3) exact += 1;
        if (pts === 1) winner += 1;
      }
    }
  }
  return { total, completed, locked, points, exact, winner, scored };
}

function PredsHeader({ stats }) {
  return (
    <div className="preds-header">
      <div className="preds-stat">
        <div className="preds-stat-value">{stats.completed}<span className="preds-stat-of">/{stats.total}</span></div>
        <div className="preds-stat-label">Pronosticados</div>
      </div>
      <div className="preds-stat">
        <div className="preds-stat-value">{stats.points}</div>
        <div className="preds-stat-label">Puntos</div>
      </div>
      <div className="preds-stat">
        <div className="preds-stat-value">{stats.exact}</div>
        <div className="preds-stat-label">Exactos 🎯</div>
      </div>
      <div className="preds-stat">
        <div className="preds-stat-value">{stats.winner}</div>
        <div className="preds-stat-label">Ganador ✓</div>
      </div>
    </div>
  );
}
