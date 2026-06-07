import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  subscribeToPredictions,
  subscribeToGroupResults,
} from '../lib/predictions.js';
import {
  subscribeToKnockoutResults,
  subscribeToOfficialChampion,
  saveMyStats,
} from '../lib/predictionsExtended.js';
import { calcTotalStats } from '../lib/scoringExtended.js';

/**
 * Componente invisible. Su único trabajo es:
 *   1. Suscribirse a los pronósticos del usuario actual + resultados oficiales
 *   2. Cuando cambia algo, recalcular las stats del usuario
 *   3. Guardar el resultado en /pools/{pollId}/stats/{uid} para que el ranking
 *      de la polla pueda leer los stats de todos los miembros.
 *
 * Esto evita tener que romper las reglas de privacidad (cada usuario solo
 * puede leer sus propias predicciones).
 *
 * Se monta en PoolView y vive mientras el usuario esté en la polla.
 */
export default function RankingUpdater({ pollId }) {
  const { user, userDoc } = useAuth();
  const stateRef = useRef({
    predictions: null,
    groupResults: {},
    knockoutResults: {},
    officialChampion: null,
  });
  const debounceRef = useRef(null);

  const recompute = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const s = stateRef.current;
      if (!s.predictions) return; // aún no llegó la primera carga
      const stats = calcTotalStats({
        predictions: s.predictions,
        groupResults: s.groupResults,
        knockoutResults: s.knockoutResults,
        officialChampion: s.officialChampion,
      });
      try {
        await saveMyStats(pollId, user.uid, {
          displayName: userDoc?.displayName || user.email,
          pts: stats.pts,
          exact: stats.exact,
          winner: stats.winner,
          scoredMatches: stats.scoredMatches,
          groupComplete: stats.groupComplete,
          koComplete: stats.koComplete,
          champion: stats.champion,
          championCorrect: !!stats.championCorrect,
        });
      } catch (e) {
        // Si las reglas no permiten, lo registramos en consola pero no fallamos
        console.warn('[ranking] no se pudieron publicar stats:', e?.code || e?.message);
      }
    }, 500);
  };

  useEffect(() => {
    if (!user || !pollId) return;

    const unsub1 = subscribeToPredictions(pollId, user.uid, (data) => {
      stateRef.current.predictions = data || {
        groupMatches: {},
        knockoutMatches: {},
        champion: null,
      };
      recompute();
    });

    const unsub2 = subscribeToGroupResults((data) => {
      stateRef.current.groupResults = data || {};
      recompute();
    });

    const unsub3 = subscribeToKnockoutResults((data) => {
      stateRef.current.knockoutResults = data || {};
      recompute();
    });

    const unsub4 = subscribeToOfficialChampion((team) => {
      stateRef.current.officialChampion = team || null;
      recompute();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pollId, user?.uid, userDoc?.displayName]);

  return null;
}
