import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getPool } from '../lib/pools.js';
import {
  subscribeToPoolStats,
  subscribeToOfficialChampion,
} from '../lib/predictionsExtended.js';
import { subscribeToGroupResults } from '../lib/predictions.js';
import { subscribeToKnockoutResults } from '../lib/predictionsExtended.js';
import { subscribeToPoolPayments, setPaymentStatus } from '../lib/payments.js';
import { TEAMS } from '../data/teams.js';
import { useToast } from './Toast.jsx';

/**
 * Ranking de los miembros de la polla.
 *
 * Si el usuario actual es el admin de la polla, ve un toggle al lado de cada
 * miembro para marcar quién pagó.
 *
 * Los no-pagados aparecen al final de la tabla con un indicador visual,
 * sin afectar el cálculo de puntos (la decisión de premios es humana).
 */
export default function RankingTab({ pollId }) {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [pool, setPool] = useState(null);
  const [payments, setPayments] = useState({});
  const [officialChamp, setOfficialChamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function loadPool() {
      const p = await getPool(pollId);
      if (!cancelled) setPool(p);
    }
    loadPool();
    return () => { cancelled = true; };
  }, [pollId]);

  useEffect(() => {
    const unsub = subscribeToPoolStats(pollId, (rows) => {
      setStats(rows);
      setLoading(false);
    });
    return unsub;
  }, [pollId]);

  useEffect(() => {
    const unsub = subscribeToPoolPayments(pollId, setPayments);
    return unsub;
  }, [pollId]);

  useEffect(() => {
    const unsub = subscribeToOfficialChampion(setOfficialChamp);
    return unsub;
  }, []);

  useEffect(() => {
    const a = subscribeToGroupResults(() => {});
    const b = subscribeToKnockoutResults(() => {});
    return () => { a(); b(); };
  }, []);

  if (loading) {
    return (
      <div className="cnj-loading" style={{ padding: 40 }}>
        <div className="cnj-spinner" />
        <span>Cargando ranking…</span>
      </div>
    );
  }

  const isAdmin = pool && user && pool.adminUid === user.uid;

  // Ordenar primero por estado de pago (pagados arriba), luego por pts, exact, winner, nombre
  const sorted = [...stats].sort((a, b) => {
    const paidA = payments[a.uid]?.paid === true;
    const paidB = payments[b.uid]?.paid === true;
    if (paidA !== paidB) return paidA ? -1 : 1;
    if ((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);
    if ((b.exact || 0) !== (a.exact || 0)) return (b.exact || 0) - (a.exact || 0);
    if ((b.winner || 0) !== (a.winner || 0)) return (b.winner || 0) - (a.winner || 0);
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  const paidCount = stats.filter((s) => payments[s.uid]?.paid).length;
  const unpaidCount = stats.length - paidCount;

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
      {isAdmin && (
        <div className="rank-admin-banner">
          <span className="rank-admin-banner-icon">⚙️</span>
          <div>
            <strong>Eres admin de esta polla.</strong> Puedes marcar quién pagó tocando el botón
            💵 al lado de cada miembro. Los que aparecen como "pendiente" no se consideran para
            la puntuación oficial (según las reglas).
          </div>
          <div className="rank-admin-counters">
            <span className="rank-admin-paid">{paidCount} pagados</span>
            <span className="rank-admin-unpaid">{unpaidCount} pendientes</span>
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
          return (
            <div
              key={row.uid}
              className={`ranking-row rank-${rank} ${isMe ? 'is-me' : ''} ${paid ? 'is-paid' : 'is-unpaid'}`}
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
                    {!paid && (
                      <span className="rank-unpaid-badge" title="Pago pendiente">💵 pendiente</span>
                    )}
                  </div>
                  {team && (
                    <div className={`rank-champ ${officialChamp === team.code ? 'is-ok' : ''}`}>
                      {team.flag} {team.name}
                      {officialChamp && officialChamp === team.code && ' +10'}
                    </div>
                  )}
                  {isAdmin && !isMe && (
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
