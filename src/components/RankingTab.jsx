import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  subscribeToPoolStats,
  subscribeToOfficialChampion,
} from '../lib/predictionsExtended.js';
import {
  subscribeToGroupResults,
  subscribeToAllPoolPredictions,
} from '../lib/predictions.js';
import { subscribeToKnockoutResults } from '../lib/predictionsExtended.js';
import { subscribeToPoolPayments, setPaymentStatus } from '../lib/payments.js';
import { calcTotalStats } from '../lib/scoringExtended.js';
import { TEAMS } from '../data/teams.js';
import { useToast } from './Toast.jsx';

const VALOR_INSCRIPCION = 15000;

function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Ranking en tiempo real (versión 2).
 *
 * Estrategia:
 *  - Lee TODOS los documentos de /stats/ → obtenemos uids y displayNames de todos los miembros.
 *  - Lee TODAS las predicciones → para calcular puntos en vivo.
 *  - Para CADA stat publicado, busca su prediction (si existe) y calcula los puntos al vuelo.
 *  - Si no hay prediction para un miembro, queda con 0 puntos.
 *
 * Por qué esta estrategia:
 *  - Las stats tienen los displayNames (que se publican cuando el usuario entra la primera vez).
 *  - Las predictions tienen los pronósticos reales.
 *  - Combinando ambas, conseguimos: nombres correctos + cálculo siempre fresco.
 */
export default function RankingTab({ pollId }) {
  const { user } = useAuth();
  const [pool, setPool] = useState(null);
  const [stats, setStats] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]);
  const [groupResults, setGroupResults] = useState({});
  const [knockoutResults, setKnockoutResults] = useState({});
  const [officialChamp, setOfficialChamp] = useState(null);
  const [payments, setPayments] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPreds, setLoadingPreds] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!pollId) return;
    const unsub = onSnapshot(doc(db, 'pools', pollId), (snap) => {
      if (snap.exists()) setPool({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [pollId]);

  // Stats (para nombres)
  useEffect(() => {
    const unsub = subscribeToPoolStats(pollId, (rows) => {
      setStats(rows);
      setLoadingStats(false);
    });
    return unsub;
  }, [pollId]);

  // Predictions (para cálculo en vivo)
  useEffect(() => {
    if (!pollId) return;
    const unsub = subscribeToAllPoolPredictions(pollId, (rows) => {
      setAllPredictions(rows);
      setLoadingPreds(false);
    });
    return unsub;
  }, [pollId]);

  useEffect(() => {
    const unsub = subscribeToGroupResults(setGroupResults);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToKnockoutResults(setKnockoutResults);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToOfficialChampion(setOfficialChamp);
    return unsub;
  }, []);

  const isAdmin = pool && user && pool.adminUid === user.uid;
  useEffect(() => {
    if (!isAdmin) {
      setPayments({});
      return;
    }
    const unsub = subscribeToPoolPayments(pollId, setPayments);
    return unsub;
  }, [pollId, isAdmin]);

  // Index de predictions por uid (para lookup rápido)
  const predsByUid = useMemo(() => {
    const m = {};
    allPredictions.forEach((p) => { m[p.uid] = p; });
    return m;
  }, [allPredictions]);

  // Ranking final: para cada stat (que tiene nombre), calculamos puntos al vuelo
  // a partir de su predicción real (si existe).
  const rankingRows = useMemo(() => {
    return stats.map((s) => {
      const pred = predsByUid[s.uid];
      let computedStats = {
        pts: 0, exact: 0, winner: 0, champion: null, championCorrect: false,
      };
      if (pred) {
        computedStats = calcTotalStats({
          predictions: pred,
          groupResults,
          knockoutResults,
          officialChampion: officialChamp,
        });
      }
      return {
        uid: s.uid,
        displayName: s.displayName || (s.uid ? s.uid.slice(0, 6) : '?'),
        pts: computedStats.pts,
        exact: computedStats.exact,
        winner: computedStats.winner,
        champion: pred?.champion || s.champion || null,
        championCorrect: !!computedStats.championCorrect,
      };
    });
  }, [stats, predsByUid, groupResults, knockoutResults, officialChamp]);

  const loading = loadingStats || loadingPreds;

  if (loading) {
    return (
      <div className="cnj-loading" style={{ padding: 40 }}>
        <div className="cnj-spinner" />
        <span>Cargando ranking…</span>
      </div>
    );
  }

  const paidCount = pool?.paidCount || 0;
  const bolsa = paidCount * VALOR_INSCRIPCION;

  const adminPaid = rankingRows.filter((s) => payments[s.uid]?.paid).length;
  const adminUnpaid = rankingRows.length - adminPaid;

  const sorted = [...rankingRows].sort((a, b) => {
    if (isAdmin) {
      const paidA = payments[a.uid]?.paid === true;
      const paidB = payments[b.uid]?.paid === true;
      if (paidA !== paidB) return paidA ? -1 : 1;
    }
    if ((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);
    if ((b.exact || 0) !== (a.exact || 0)) return (b.exact || 0) - (a.exact || 0);
    if ((b.winner || 0) !== (a.winner || 0)) return (b.winner || 0) - (a.winner || 0);
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  const togglePaid = async (uid, currentlyPaid) => {
    try {
      await setPaymentStatus(pollId, uid, !currentlyPaid, user.uid);
      showToast(!currentlyPaid ? 'Marcado como pagado ✓' : 'Marcado como pendiente', {
        icon: !currentlyPaid ? '💵' : '⏳',
      });
    } catch (e) {
      showToast(`Error: ${e?.code || e.message}`, { icon: '⚠️', type: 'error' });
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="cnj-soon-card">
        <div style={{ fontSize: 48 }}>📊</div>
        <h2 className="cnj-soon-title">Ranking vacío</h2>
        <p className="cnj-soon-text">
          Cuando los miembros hagan sus pronósticos y se carguen resultados oficiales, aquí
          aparecerá la tabla de posiciones de esta polla.
        </p>
      </div>
    );
  }

  return (
    <div className="ranking-tab">
      <div className="bolsa-card">
        <div className="bolsa-label">💰 Bolsa de la polla</div>
        <div className="bolsa-amount">{formatCOP(bolsa)}</div>
      </div>

      {isAdmin && (
        <div className="rank-admin-banner">
          <span className="rank-admin-banner-icon">⚙️</span>
          <div>
            <strong>Eres admin de esta polla.</strong> Solo tú ves esta sección. Puedes marcar
            quién pagó tocando el botón al lado de cada miembro (incluido tú mismo). La
            información individual de pagos NO es visible para el resto de los jugadores
            — solo ven el monto total acumulado de la bolsa.
          </div>
          <div className="rank-admin-counters">
            <span className="rank-admin-paid">{adminPaid} pagados</span>
            <span className="rank-admin-unpaid">{adminUnpaid} pendientes</span>
          </div>
        </div>
      )}

      <div className="ranking-table">
        <div className="ranking-head">
          <div className="rc">#</div>
          <div className="rc">Jugador</div>
          <div className="rc rc-right">Pts</div>
          <div className="rc rc-right">🎯</div>
          <div className="rc rc-right">✓</div>
          <div className="rc rc-right">👑</div>
        </div>
        {sorted.map((row, idx) => {
          const isMe = row.uid === user.uid;
          const rank = idx + 1;
          const team = row.champion ? TEAMS.find((t) => t.code === row.champion) : null;
          const paid = payments[row.uid]?.paid === true;
          const paymentClass = isAdmin ? (paid ? 'is-paid' : 'is-unpaid') : '';
          return (
            <div
              key={row.uid}
              className={`ranking-row rank-${rank} ${isMe ? 'is-me' : ''} ${paymentClass}`}
            >
              <div className="rank-num">{rank}</div>
              <div className="rank-player">
                <div className="rank-avatar">
                  {(row.displayName || '?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div className="rank-player-info">
                  <div className="rank-name">
                    {row.displayName || row.uid.slice(0, 6)}
                    {isMe && <span className="rank-you">TÚ</span>}
                    {isAdmin && !paid && (
                      <span className="rank-unpaid-badge" title="Pago pendiente">💵 pendiente</span>
                    )}
                  </div>
                  {team && (
                    <div className={`rank-champ ${officialChamp === team.code ? 'is-ok' : ''}`}>
                      {team.flag} {team.name}
                      {officialChamp && officialChamp === team.code && ' +10'}
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      className={`rank-pay-toggle ${paid ? 'is-paid' : ''}`}
                      onClick={() => togglePaid(row.uid, paid)}
                      title={paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                    >
                      {paid ? '✓ Pagado' : 'Marcar pagado'}
                    </button>
                  )}
                </div>
              </div>
              <div className="rank-pts">{row.pts || 0}</div>
              <div className="rank-stat rank-stat-exact">{row.exact || 0}</div>
              <div className="rank-stat rank-stat-winner">{row.winner || 0}</div>
              <div className="rank-stat rank-stat-champ">
                {row.championCorrect ? '🎉' : team ? '·' : '–'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ranking-legend">
        🎯 Exacto = 3 pts · ✓ Ganador = 1 pt · 👑 Campeón = 10 pts (solo al finalizar el torneo)
      </div>
    </div>
  );
}
