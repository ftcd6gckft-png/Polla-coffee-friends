import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GROUP_MATCHES } from '../data/groupMatches.js';
import {
  KNOCKOUT_MATCHES,
  PHASE_LABELS,
  PHASES_ORDER,
} from '../data/knockoutTemplate.js';
import { TEAMS, GROUPS, teamLabel } from '../data/teams.js';
import { subscribeToGroupResults } from '../lib/predictions.js';
import {
  saveOfficialGroupResult,
  clearOfficialGroupResult,
  subscribeToKnockoutResults,
  saveOfficialKnockoutResult,
  clearOfficialKnockoutResult,
  subscribeToKnockoutBracket,
  saveBracketParticipants,
  subscribeToOfficialChampion,
  saveOfficialChampion,
  clearOfficialChampion,
} from '../lib/predictionsExtended.js';
import { useToast } from '../components/Toast.jsx';
import { formatMatchDateTime } from '../lib/time.js';

const ADMIN_SECTIONS = [
  { id: 'grupos', label: 'Resultados de grupos', icon: '⚽' },
  { id: 'bracket', label: 'Configurar bracket', icon: '🔗' },
  { id: 'eliminatorias', label: 'Resultados eliminatorias', icon: '🏆' },
  { id: 'campeon', label: 'Campeón oficial', icon: '👑' },
];

export default function AdminPage() {
  const { isSuperAdmin, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const section = params.get('section') || 'grupos';

  if (loading) {
    return (
      <div className="cnj-loading" style={{ padding: 60 }}>
        <div className="cnj-spinner" />
        <span>Cargando…</span>
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const setSection = (s) => {
    const next = new URLSearchParams(params);
    next.set('section', s);
    setParams(next, { replace: true });
  };

  return (
    <div className="container cnj-page">
      <div className="admin-header">
        <Link to="/" className="cnj-back-link">← Volver</Link>
        <h1 className="cnj-h1">
          Panel <span className="cnj-h1-accent">Super-Admin</span>
        </h1>
        <p className="cnj-h1-sub">
          Aquí cargas los resultados oficiales del Mundial 2026. Estos resultados
          aplican a <strong>todas las pollas</strong> automáticamente.
        </p>
      </div>

      <nav className="pool-tabs">
        {ADMIN_SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`pool-tab ${section === s.id ? 'is-active' : ''}`}
            onClick={() => setSection(s.id)}
          >
            <span className="pool-tab-icon">{s.icon}</span>
            <span className="pool-tab-label">{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="pool-tab-content">
        {section === 'grupos' && <AdminGroupResults />}
        {section === 'bracket' && <AdminBracketConfig />}
        {section === 'eliminatorias' && <AdminKnockoutResults />}
        {section === 'campeon' && <AdminChampion />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECCIÓN: RESULTADOS DE GRUPOS
// ════════════════════════════════════════════════════════════════

function AdminGroupResults() {
  const [results, setResults] = useState({});
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]);
  const [drafts, setDrafts] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToGroupResults(setResults);
    return unsub;
  }, []);

  const matches = GROUP_MATCHES.filter((m) => m.group === activeGroup);

  const saveOne = async (matchId) => {
    const d = drafts[matchId];
    if (!d || d.home === '' || d.away === '') {
      showToast('Completa el marcador', { icon: '⚠️', type: 'warn' });
      return;
    }
    try {
      await saveOfficialGroupResult(matchId, d);
      showToast('Resultado guardado', { icon: '✓' });
      setDrafts((s) => {
        const c = { ...s };
        delete c[matchId];
        return c;
      });
    } catch (e) {
      showToast(`Error: ${e?.code || e.message}`, { icon: '✗', type: 'error' });
    }
  };

  const clearOne = async (matchId) => {
    if (!confirm('¿Eliminar resultado oficial de este partido?')) return;
    await clearOfficialGroupResult(matchId);
    showToast('Resultado eliminado', { icon: '🗑️' });
  };

  return (
    <>
      <p className="admin-help">
        Carga el resultado oficial de cada partido. Los puntos de todos los miembros
        de todas las pollas se calculan automáticamente al guardar.
      </p>
      <div className="group-tabs">
        {GROUPS.map((g) => {
          const total = GROUP_MATCHES.filter((m) => m.group === g).length;
          const done = GROUP_MATCHES.filter(
            (m) => m.group === g && results[m.id]
          ).length;
          return (
            <button
              key={g}
              className={`group-tab ${activeGroup === g ? 'is-active' : ''} ${
                done === total ? 'is-done' : ''
              }`}
              onClick={() => setActiveGroup(g)}
            >
              <span className="group-tab-letter">Grupo {g}</span>
              <span className="group-tab-count">
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="admin-list">
        {matches.map((m) => {
          const existing = results[m.id];
          const draft = drafts[m.id] ?? {
            home: existing?.home?.toString() ?? '',
            away: existing?.away?.toString() ?? '',
          };
          return (
            <div key={m.id} className="admin-match-card">
              <div className="admin-match-meta">
                <span>{formatMatchDateTime(m)}</span>
                {existing && (
                  <span className="m-status m-status-final">
                    ✓ Cargado: {existing.home}-{existing.away}
                  </span>
                )}
              </div>
              <div className="admin-match-body">
                <div className="admin-match-team admin-team-home">
                  {teamLabel(m.home)}
                </div>
                <div className="admin-match-score">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="pred-input"
                    value={draft.home}
                    onChange={(e) =>
                      setDrafts((s) => ({
                        ...s,
                        [m.id]: {
                          ...draft,
                          home: e.target.value.replace(/[^0-9]/g, '').slice(0, 2),
                        },
                      }))
                    }
                  />
                  <span className="pred-dash">–</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="pred-input"
                    value={draft.away}
                    onChange={(e) =>
                      setDrafts((s) => ({
                        ...s,
                        [m.id]: {
                          ...draft,
                          away: e.target.value.replace(/[^0-9]/g, '').slice(0, 2),
                        },
                      }))
                    }
                  />
                </div>
                <div className="admin-match-team admin-team-away">
                  {teamLabel(m.away)}
                </div>
              </div>
              <div className="admin-match-actions">
                <button className="btn btn-accent btn-xs" onClick={() => saveOne(m.id)}>
                  {existing ? 'Actualizar' : 'Guardar'}
                </button>
                {existing && (
                  <button className="btn btn-danger btn-xs" onClick={() => clearOne(m.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// SECCIÓN: CONFIGURAR BRACKET
// ════════════════════════════════════════════════════════════════

function AdminBracketConfig() {
  const [bracket, setBracket] = useState({});
  const [drafts, setDrafts] = useState({});
  const [activePhase, setActivePhase] = useState(PHASES_ORDER[0]);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToKnockoutBracket(setBracket);
    return unsub;
  }, []);

  const matchesInPhase = KNOCKOUT_MATCHES.filter((m) => m.phase === activePhase);

  const saveOne = async (matchId) => {
    const d = drafts[matchId];
    if (!d || !d.home || !d.away) {
      showToast('Selecciona ambos equipos', { icon: '⚠️', type: 'warn' });
      return;
    }
    if (d.home === d.away) {
      showToast('Los equipos deben ser diferentes', { icon: '⚠️', type: 'warn' });
      return;
    }
    try {
      await saveBracketParticipants(matchId, d);
      showToast('Cruce guardado', { icon: '✓' });
      setDrafts((s) => {
        const c = { ...s };
        delete c[matchId];
        return c;
      });
    } catch (e) {
      showToast(`Error: ${e?.code || e.message}`, { icon: '✗', type: 'error' });
    }
  };

  return (
    <>
      <p className="admin-help">
        Define qué equipos juegan en cada cruce de la fase eliminatoria. Una vez
        guardado, los miembros de todas las pollas pueden pronosticar el marcador.
      </p>
      <div className="phase-tabs">
        {PHASES_ORDER.map((p) => {
          const total = KNOCKOUT_MATCHES.filter((m) => m.phase === p).length;
          const done = KNOCKOUT_MATCHES.filter(
            (m) => m.phase === p && bracket[m.id]
          ).length;
          return (
            <button
              key={p}
              className={`group-tab ${activePhase === p ? 'is-active' : ''} ${
                done === total ? 'is-done' : ''
              }`}
              onClick={() => setActivePhase(p)}
            >
              <span className="group-tab-letter">{PHASE_LABELS[p]}</span>
              <span className="group-tab-count">
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="admin-list">
        {matchesInPhase.map((m) => {
          const existing = bracket[m.id];
          const draft = drafts[m.id] ?? {
            home: existing?.home || '',
            away: existing?.away || '',
          };
          return (
            <div key={m.id} className="admin-match-card">
              <div className="admin-match-meta">
                <span>
                  {formatMatchDateTime(m)} · {m.city}
                </span>
                <span className="m-status m-status-locked">
                  Slots: {m.homeSlot} vs {m.awaySlot}
                </span>
              </div>
              <div className="admin-match-body admin-bracket-body">
                <select
                  className="fi fi-select"
                  value={draft.home}
                  onChange={(e) =>
                    setDrafts((s) => ({
                      ...s,
                      [m.id]: { ...draft, home: e.target.value },
                    }))
                  }
                >
                  <option value="">— Selecciona local —</option>
                  {TEAMS.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.flag} {t.name}
                    </option>
                  ))}
                </select>
                <span className="pred-dash">vs</span>
                <select
                  className="fi fi-select"
                  value={draft.away}
                  onChange={(e) =>
                    setDrafts((s) => ({
                      ...s,
                      [m.id]: { ...draft, away: e.target.value },
                    }))
                  }
                >
                  <option value="">— Selecciona visitante —</option>
                  {TEAMS.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.flag} {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-match-actions">
                <button className="btn btn-accent btn-xs" onClick={() => saveOne(m.id)}>
                  {existing ? 'Actualizar cruce' : 'Guardar cruce'}
                </button>
                {existing && (
                  <span className="admin-existing">
                    Actual: {TEAMS.find((t) => t.code === existing.home)?.name} vs{' '}
                    {TEAMS.find((t) => t.code === existing.away)?.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// SECCIÓN: RESULTADOS DE ELIMINATORIAS
// ════════════════════════════════════════════════════════════════

function AdminKnockoutResults() {
  const [results, setResults] = useState({});
  const [bracket, setBracket] = useState({});
  const [drafts, setDrafts] = useState({});
  const [activePhase, setActivePhase] = useState(PHASES_ORDER[0]);
  const { showToast } = useToast();

  useEffect(() => {
    const a = subscribeToKnockoutResults(setResults);
    const b = subscribeToKnockoutBracket(setBracket);
    return () => {
      a();
      b();
    };
  }, []);

  const matchesInPhase = KNOCKOUT_MATCHES.filter((m) => m.phase === activePhase);

  const saveOne = async (matchId) => {
    const part = bracket[matchId];
    if (!part) {
      showToast('Primero configura el cruce en "Configurar bracket"', {
        icon: '⚠️',
        type: 'warn',
      });
      return;
    }
    const d = drafts[matchId];
    if (!d || d.scoreHome === '' || d.scoreAway === '') {
      showToast('Completa el marcador (90 minutos)', { icon: '⚠️', type: 'warn' });
      return;
    }
    const sh = parseInt(d.scoreHome, 10);
    const sa = parseInt(d.scoreAway, 10);
    let winner = null;
    if (sh > sa) winner = part.home;
    else if (sa > sh) winner = part.away;
    else {
      // empate en 90 min → necesitamos saber quién pasó por penales
      if (!d.penWinner) {
        showToast('Hubo empate en 90 min. Selecciona quién pasó por penales.', {
          icon: '⚠️',
          type: 'warn',
        });
        return;
      }
      winner = d.penWinner;
    }
    try {
      await saveOfficialKnockoutResult(matchId, {
        home: part.home,
        away: part.away,
        scoreHome: sh,
        scoreAway: sa,
        winner,
        status: 'final',
      });
      showToast('Resultado guardado', { icon: '✓' });
      setDrafts((s) => {
        const c = { ...s };
        delete c[matchId];
        return c;
      });
    } catch (e) {
      showToast(`Error: ${e?.code || e.message}`, { icon: '✗', type: 'error' });
    }
  };

  const clearOne = async (matchId) => {
    if (!confirm('¿Eliminar resultado de eliminatoria?')) return;
    await clearOfficialKnockoutResult(matchId);
    showToast('Resultado eliminado', { icon: '🗑️' });
  };

  return (
    <>
      <p className="admin-help">
        Carga el marcador de los <strong>90 minutos</strong> (sin alargues ni penales).
        Si el partido fue a penales, selecciona quién pasó para que la app sepa armar
        los cruces siguientes.
      </p>
      <div className="phase-tabs">
        {PHASES_ORDER.map((p) => {
          const total = KNOCKOUT_MATCHES.filter((m) => m.phase === p).length;
          const done = KNOCKOUT_MATCHES.filter(
            (m) => m.phase === p && results[m.id]
          ).length;
          return (
            <button
              key={p}
              className={`group-tab ${activePhase === p ? 'is-active' : ''} ${
                done === total ? 'is-done' : ''
              }`}
              onClick={() => setActivePhase(p)}
            >
              <span className="group-tab-letter">{PHASE_LABELS[p]}</span>
              <span className="group-tab-count">
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="admin-list">
        {matchesInPhase.map((m) => {
          const existing = results[m.id];
          const part = bracket[m.id];
          const draft = drafts[m.id] ?? {
            scoreHome: existing?.scoreHome?.toString() ?? '',
            scoreAway: existing?.scoreAway?.toString() ?? '',
            penWinner: existing?.winner || '',
          };
          const isDraw =
            draft.scoreHome !== '' &&
            draft.scoreAway !== '' &&
            parseInt(draft.scoreHome, 10) === parseInt(draft.scoreAway, 10);

          if (!part) {
            return (
              <div key={m.id} className="admin-match-card is-pending">
                <div className="admin-match-meta">
                  <span>{formatMatchDateTime(m)} · {m.city}</span>
                  <span className="m-status m-status-locked">
                    Falta configurar el cruce
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="admin-match-card">
              <div className="admin-match-meta">
                <span>{formatMatchDateTime(m)} · {m.city}</span>
                {existing && (
                  <span className="m-status m-status-final">
                    ✓ {existing.scoreHome}-{existing.scoreAway}
                    {existing.scoreHome === existing.scoreAway && existing.winner && (
                      <> (pen: {TEAMS.find(t=>t.code===existing.winner)?.name})</>
                    )}
                  </span>
                )}
              </div>
              <div className="admin-match-body">
                <div className="admin-match-team admin-team-home">
                  {teamLabel(part.home)}
                </div>
                <div className="admin-match-score">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="pred-input"
                    value={draft.scoreHome}
                    onChange={(e) =>
                      setDrafts((s) => ({
                        ...s,
                        [m.id]: {
                          ...draft,
                          scoreHome: e.target.value.replace(/[^0-9]/g, '').slice(0, 2),
                        },
                      }))
                    }
                  />
                  <span className="pred-dash">–</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="pred-input"
                    value={draft.scoreAway}
                    onChange={(e) =>
                      setDrafts((s) => ({
                        ...s,
                        [m.id]: {
                          ...draft,
                          scoreAway: e.target.value.replace(/[^0-9]/g, '').slice(0, 2),
                        },
                      }))
                    }
                  />
                </div>
                <div className="admin-match-team admin-team-away">
                  {teamLabel(part.away)}
                </div>
              </div>
              {isDraw && (
                <div className="admin-pen-row">
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Empate en 90 min. ¿Quién pasó por penales?
                  </span>
                  <select
                    className="fi fi-select"
                    value={draft.penWinner}
                    onChange={(e) =>
                      setDrafts((s) => ({
                        ...s,
                        [m.id]: { ...draft, penWinner: e.target.value },
                      }))
                    }
                  >
                    <option value="">— Selecciona ganador —</option>
                    <option value={part.home}>
                      {TEAMS.find((t) => t.code === part.home)?.name}
                    </option>
                    <option value={part.away}>
                      {TEAMS.find((t) => t.code === part.away)?.name}
                    </option>
                  </select>
                </div>
              )}
              <div className="admin-match-actions">
                <button className="btn btn-accent btn-xs" onClick={() => saveOne(m.id)}>
                  {existing ? 'Actualizar' : 'Guardar'}
                </button>
                {existing && (
                  <button className="btn btn-danger btn-xs" onClick={() => clearOne(m.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// SECCIÓN: CAMPEÓN OFICIAL
// ════════════════════════════════════════════════════════════════

function AdminChampion() {
  const [officialChamp, setOfficialChamp] = useState(null);
  const [draft, setDraft] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToOfficialChampion((team) => {
      setOfficialChamp(team);
      setDraft(team || '');
    });
    return unsub;
  }, []);

  const save = async () => {
    if (!draft) {
      showToast('Selecciona un campeón', { icon: '⚠️', type: 'warn' });
      return;
    }
    try {
      await saveOfficialChampion(draft);
      showToast(
        `Campeón oficial: ${TEAMS.find((t) => t.code === draft)?.name}`,
        { icon: '👑' }
      );
    } catch (e) {
      showToast(`Error: ${e?.code || e.message}`, { icon: '✗', type: 'error' });
    }
  };

  const clear = async () => {
    if (!confirm('¿Eliminar el campeón oficial? Los +5 puntos se quitarán de quienes acertaron.')) return;
    await clearOfficialChampion();
    showToast('Campeón eliminado', { icon: '🗑️' });
  };

  return (
    <>
      <p className="admin-help">
        Al cargar el campeón oficial, todos los usuarios que lo hayan pronosticado
        correctamente reciben automáticamente +5 puntos.
      </p>
      {officialChamp && (
        <div className="champ-current" style={{ margin: '20px 0' }}>
          <div className="champ-current-label">CAMPEÓN OFICIAL ACTUAL</div>
          <div className="champ-current-team">
            {TEAMS.find((t) => t.code === officialChamp)?.flag}{' '}
            {TEAMS.find((t) => t.code === officialChamp)?.name}
          </div>
        </div>
      )}
      <div className="fg" style={{ maxWidth: 480 }}>
        <label className="fl">Selecciona el campeón</label>
        <select
          className="fi fi-select"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        >
          <option value="">— Sin definir —</option>
          {TEAMS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="cnj-cta-row" style={{ justifyContent: 'flex-start' }}>
        <button className="btn btn-accent" onClick={save}>
          {officialChamp ? 'Actualizar campeón' : 'Guardar campeón'}
        </button>
        {officialChamp && (
          <button className="btn btn-danger" onClick={clear}>
            Eliminar campeón
          </button>
        )}
      </div>
    </>
  );
}
