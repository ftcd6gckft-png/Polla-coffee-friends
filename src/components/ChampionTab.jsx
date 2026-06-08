import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { TEAMS, GROUPS } from '../data/teams.js';
import { GROUP_MATCHES } from '../data/groupMatches.js';
import { subscribeToPredictions } from '../lib/predictions.js';
import {
  saveChampionPrediction,
  subscribeToOfficialChampion,
} from '../lib/predictionsExtended.js';
import { isMatchLocked } from '../lib/time.js';
import { useNow } from '../hooks/useNow.js';
import { useToast } from './Toast.jsx';

/**
 * Pestaña: pronóstico de campeón.
 * El usuario elige UNO de los 48 equipos.
 * Se bloquea automáticamente cuando ARRANCA el primer partido del Mundial
 * (México vs Sudáfrica, Jun 11 14:00 COL → lock = Jun 11 13:45 COL).
 */
export default function ChampionTab({ pollId }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState(null);
  const [officialChamp, setOfficialChamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const now = useNow(60 * 1000);
  const { showToast } = useToast();

  // El primer partido del torneo
  const firstMatch = GROUP_MATCHES.find((m) => m.id === 'G01');
  const tournamentStarted = firstMatch ? isMatchLocked(firstMatch, now) : false;
  const locked = tournamentStarted; // bloquea cuando arranca el primer lock

  useEffect(() => {
    if (!pollId || !user) return;
    const unsub = subscribeToPredictions(pollId, user.uid, (data) => {
      setPredictions(data);
      setLoading(false);
    });
    return unsub;
  }, [pollId, user?.uid]);

  useEffect(() => {
    const unsub = subscribeToOfficialChampion(setOfficialChamp);
    return unsub;
  }, []);

  const currentPick = predictions?.champion || null;

  const handlePick = async (code) => {
    if (locked) return;
    setSaving(true);
    try {
      await saveChampionPrediction(pollId, user.uid, code);
      const team = TEAMS.find((t) => t.code === code);
      showToast(`¡${team?.name || code} como campeón!`, { icon: '👑' });
    } catch (e) {
      showToast('No se pudo guardar', { icon: '⚠️', type: 'warn' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cnj-loading" style={{ padding: 40 }}>
        <div className="cnj-spinner" />
        <span>Cargando…</span>
      </div>
    );
  }

  return (
    <div className="champ-tab">
      <div className="champ-hero">
        <div className="champ-icon">👑</div>
        <h2 className="champ-title">
          {officialChamp
            ? 'Mundial finalizado'
            : locked
            ? 'Selección bloqueada'
            : '¿Quién ganará el Mundial 2026?'}
        </h2>
        <p className="champ-sub">
          {officialChamp ? (
            <>
              El campeón fue{' '}
              <strong>
                {TEAMS.find((t) => t.code === officialChamp)?.flag}{' '}
                {TEAMS.find((t) => t.code === officialChamp)?.name}
              </strong>
              .
            </>
          ) : locked ? (
            'El torneo ya inició. Tu pronóstico de campeón quedó guardado.'
          ) : (
            'Vale +5 puntos si aciertas. Puedes cambiar tu elección hasta que arranque el primer partido (11 jun · 14:00 COL).'
          )}
        </p>

        {currentPick && (
          <div className="champ-current">
            <div className="champ-current-label">TU CAMPEÓN</div>
            <div className="champ-current-team">
              {TEAMS.find((t) => t.code === currentPick)?.flag}{' '}
              {TEAMS.find((t) => t.code === currentPick)?.name}
            </div>
            {officialChamp && (
              <div
                className={`champ-result ${
                  officialChamp === currentPick ? 'ok' : 'bad'
                }`}
              >
                {officialChamp === currentPick
                  ? '🎉 ¡Acertaste! +5 puntos'
                  : '✗ No acertaste'}
              </div>
            )}
          </div>
        )}
      </div>

      {!officialChamp && (
        <div className="champ-groups">
          {GROUPS.map((g) => (
            <div key={g} className="champ-group-block">
              <div className="champ-group-label">Grupo {g}</div>
              <div className="champ-group-teams">
                {TEAMS.filter((t) => t.group === g).map((t) => (
                  <button
                    key={t.code}
                    className={`champ-team-btn ${
                      currentPick === t.code ? 'is-picked' : ''
                    } ${locked ? 'is-locked' : ''}`}
                    onClick={() => handlePick(t.code)}
                    disabled={locked || saving}
                    aria-pressed={currentPick === t.code}
                  >
                    <span className="champ-team-flag">{t.flag}</span>
                    <span className="champ-team-name">{t.name}</span>
                    {currentPick === t.code && (
                      <span className="champ-team-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
