import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getPool } from '../lib/pools.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  subscribeToPoolStats,
  subscribeToOfficialChampion,
} from '../lib/predictionsExtended.js';
import { subscribeToGroupResults } from '../lib/predictions.js';
import { subscribeToKnockoutResults } from '../lib/predictionsExtended.js';
import { TEAMS } from '../data/teams.js';

/**
 * Ranking de los miembros de la polla.
 *
 * Cada usuario publica sus stats en /pools/{pollId}/stats/{uid} (un doc por
 * miembro) cada vez que cambia su pronóstico o cambia un resultado oficial.
 * Esa subcolección es legible por todos los miembros de la polla, así que
 * el ranking puede leerse en tiempo real.
 *
 * El cálculo se hace en background desde el componente RankingUpdater que
 * vive en PoolView (ver más abajo).
 */
export default function RankingTab({ pollId }) {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [members, setMembers] = useState({});
  const [officialChamp, setOfficialChamp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar info de miembros (nombres, avatars)
  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      const pool = await getPool(pollId);
      if (!pool) return;
      const m = {};
      // Por las reglas no podemos leer /users/{otherUid}. En lugar de eso,
      // cada usuario publica su displayName en /pools/{pollId}/stats/{uid}.
      // Y ya viene en el snapshot de stats. Esta función solo establece base.
      setMembers(m);
    }
    loadMembers();
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
    const unsub = subscribeToOfficialChampion(setOfficialChamp);
    return unsub;
  }, []);

  // Forzar dependencias a resultados para que el RankingUpdater de PoolView
  // se entere de los cambios. No usamos los valores aquí.
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

  // Ordenar: pts desc, exact desc, winner desc, displayName asc
  const sorted = [...stats].sort((a, b) => {
    if ((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);
    if ((b.exact || 0) !== (a.exact || 0)) return (b.exact || 0) - (a.exact || 0);
    if ((b.winner || 0) !== (a.winner || 0)) return (b.winner || 0) - (a.winner || 0);
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

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
          return (
            <div
              key={row.uid}
              className={`ranking-row rank-${rank} ${isMe ? 'is-me' : ''}`}
            >
              <div className="rank-num">{rank}</div>
              <div className="rank-player">
                <div className="rank-avatar">
                  {(row.displayName || '?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div>
                  <div className="rank-name">
                    {row.displayName || row.uid.slice(0, 6)}
                    {isMe && <span className="rank-you">TÚ</span>}
                  </div>
                  {team && (
                    <div className={`rank-champ ${officialChamp === team.code ? 'is-ok' : ''}`}>
                      {team.flag} {team.name}
                      {officialChamp && officialChamp === team.code && ' +5'}
                    </div>
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
        🎯 Exacto = 3 pts · ✓ Ganador = 1 pt · 👑 Campeón = 5 pts (solo al finalizar el torneo)
      </div>
    </div>
  );
}
