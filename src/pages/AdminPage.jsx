import { useEffect, useState, useMemo } from 'react';
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
// SECCIÓN: RESULTADOS DE GRUPOS (con sub-tab Por fecha)
// ════════════════════════════════════════════════════════════════

function AdminGroupResults() {
  const [results, setResults] = useState({});
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]);
  const [drafts, setDrafts] = useState({});
  const [viewMode, setViewMode] = useState('groups'); // 'groups' | 'date'
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToGroupResults(setResults);
    return unsub;
  }, []);

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

      {/* Sub-tabs: Por grupos / Por fecha */}
      <div className="subview-tabs">
        <button
          className={`subview-tab ${viewMode === 'groups' ? 'is-active' : ''}`}
          onClick={() => setViewMode('groups')}
        >
          🔠 Por grupos
        </button>
        <button
          className={`subview-tab ${viewMode === 'date' ? 'is-active' : ''}`}
          onClick={() => setViewMode('date')}
        >
          📅 Por fecha
        </button>
      </div>

      {viewMode === 'groups' ? (
        <AdminGroupResultsByGroup
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          results={results}
          drafts={drafts}
          setDrafts={setDrafts}
          saveOne={saveOne}
          clearOne={clearOne}
        />
      ) : (
        <AdminGroupResultsByDate
          results={results}
          drafts={drafts}
          setDrafts={setDrafts}
          saveOne={saveOne}
          clearOne={clearOne}
        />
      )}
    </>
  );
}

function AdminGroupResultsByGroup({ activeGroup, setActiveGroup, results, drafts, setDrafts, saveOne, clearOne }) {
  const matches = GROUP_MATCHES.filter((m) => m.group === activeGroup);

  return (
    <>
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
        {matches.map((m) => (
          <AdminGroupMatchCard
            key={m.id}
            match={m}
            existing={results[m.id]}
            drafts={drafts}
            setDrafts={setDrafts}
            saveOne={saveOne}
            clearOne={clearOne}
          />
        ))}
      </div>
    </>
  );
}

function AdminGroupResultsByDate({ results, drafts, setDrafts, saveOne, clearOne }) {
  const [expandedDates, setExpandedDates] = useState(() => new Set());
  const [autoExpandedOnce, setAutoExpandedOnce] = useState(false);

  // Agrupar partidos por fecha
  const groupedByDate = useMemo(() => {
    const sorted = [...GROUP_MATCHES].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    const map = new Map();
    for (const m of sorted) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    }
    return Array.from(map.entries());
  }, []);

  // Auto-expandir el primer día con partidos SIN resultado (es lo que toca cargar)
  useEffect(() => {
    if (autoExpandedOnce) return;
    if (groupedByDate.length === 0) return;
    let dateToExpand = null;
    for (const [date, matches] of groupedByDate) {
      const hasPending = matches.some((m) => !results[m.id]);
      if (hasPending) {
        dateToExpand = date;
        break;
      }
    }
    if (!dateToExpand) dateToExpand = groupedByDate[0][0];
    setExpandedDates(new Set([dateToExpand]));
    setAutoExpandedOnce(true);
  }, [groupedByDate, results, autoExpandedOnce]);

  const toggleDate = (date) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const expandAll = () => setExpandedDates(new Set(groupedByDate.map(([d]) => d)));
  const collapseAll = () => setExpandedDates(new Set());

  return (
    <div className="by-date-view">
      <div className="by-date-controls">
        <div />
        <div className="by-date-bulk">
          <button className="by-date-bulk-btn" onClick={expandAll}>Expandir todo</button>
          <span className="by-date-bulk-sep">·</span>
          <button className="by-date-bulk-btn" onClick={collapseAll}>Colapsar todo</button>
        </div>
      </div>

      {groupedByDate.map(([date, matches]) => {
        const isExpanded = expandedDates.has(date);
        const total = matches.length;
        const done = matches.filter((m) => results[m.id]).length;
        const pending = total - done;
        return (
          <div key={date} className={`by-date-day ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
            <DayHeader
              date={date}
              total={total}
              done={done}
              pending={pending}
              isExpanded={isExpanded}
              onToggle={() => toggleDate(date)}
            />
            {isExpanded && (
              <div className="by-date-day-matches">
                {matches.map((m) => (
                  <AdminGroupMatchCard
                    key={m.id}
                    match={m}
                    existing={results[m.id]}
                    drafts={drafts}
                    setDrafts={setDrafts}
                    saveOne={saveOne}
                    clearOne={clearOne}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdminGroupMatchCard({ match, existing, drafts, setDrafts, saveOne, clearOne }) {
  const draft = drafts[match.id] ?? {
    home: existing?.home?.toString() ?? '',
    away: existing?.away?.toString() ?? '',
  };
  return (
    <div className="admin-match-card">
      <div className="admin-match-meta">
        <span>{formatMatchDateTime(match)} · Grupo {match.group}</span>
        {existing && (
          <span className="m-status m-status-final">
            ✓ Cargado: {existing.home}-{existing.away}
          </span>
        )}
      </div>
      <div className="admin-match-body">
        <div className="admin-match-team admin-team-home">{teamLabel(match.home)}</div>
        <div className="admin-match-score">
          <input
            type="text"
            inputMode="numeric"
            className="pred-input"
            value={draft.home}
            onChange={(e) =>
              setDrafts((s) => ({
                ...s,
                [match.id]: {
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
                [match.id]: {
                  ...draft,
                  away: e.target.value.replace(/[^0-9]/g, '').slice(0, 2),
                },
              }))
            }
          />
        </div>
        <div className="admin-match-team admin-team-away">{teamLabel(match.away)}</div>
      </div>
      <div className="admin-match-actions">
        <button className="btn btn-accent btn-xs" onClick={() => saveOne(match.id)}>
          {existing ? 'Actualizar' : 'Guardar'}
        </button>
        {existing && (
          <button className="btn btn-danger btn-xs" onClick={() => clearOne(match.id)}>
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECCIÓN: CONFIGURAR BRACKET (acordeón por fase)
// ════════════════════════════════════════════════════════════════

function AdminBracketConfig() {
  const [bracket, setBracket] = useState({});
  const [drafts, setDrafts] = useState({});
  const [expandedPhases, setExpandedPhases] = useState(() => new Set([PHASES_ORDER[0]]));
  const [autoExpandedOnce, setAutoExpandedOnce] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToKnockoutBracket(setBracket);
    return unsub;
  }, []);

  // Auto-expandir la primera fase con cruces sin configurar
  useEffect(() => {
    if (autoExpandedOnce) return;
    let phaseToExpand = PHASES_ORDER[0];
    for (const phase of PHASES_ORDER) {
      const phaseMatches = KNOCKOUT_MATCHES.filter((m) => m.phase === phase);
      const hasPending = phaseMatches.some((m) => !bracket[m.id]);
      if (hasPending) {
        phaseToExpand = phase;
        break;
      }
    }
    setExpandedPhases(new Set([phaseToExpand]));
    setAutoExpandedOnce(true);
  }, [bracket, autoExpandedOnce]);

  const togglePhase = (phase) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  const expandAll = () => setExpandedPhases(new Set(PHASES_ORDER));
  const collapseAll = () => setExpandedPhases(new Set());

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

      <div className="by-date-controls">
        <div />
        <div className="by-date-bulk">
          <button className="by-date-bulk-btn" onClick={expandAll}>Expandir todo</button>
          <span className="by-date-bulk-sep">·</span>
          <button className="by-date-bulk-btn" onClick={collapseAll}>Colapsar todo</button>
        </div>
      </div>

      {PHASES_ORDER.map((phase) => {
        const phaseMatches = KNOCKOUT_MATCHES.filter((m) => m.phase === phase);
        const total = phaseMatches.length;
        const done = phaseMatches.filter((m) => bracket[m.id]).length;
        const pending = total - done;
        const isExpanded = expandedPhases.has(phase);

        return (
          <div key={phase} className={`by-date-day ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
            <PhaseHeader
              phaseLabel={PHASE_LABELS[phase]}
              total={total}
              done={done}
              pending={pending}
              isExpanded={isExpanded}
              onToggle={() => togglePhase(phase)}
            />
            {isExpanded && (
              <div className="by-date-day-matches">
                {phaseMatches.map((m) => {
                  const existing = bracket[m.id];
                  const draft = drafts[m.id] ?? {
                    home: existing?.home || '',
                    away: existing?.away || '',
                  };
                  return (
                    <div key={m.id} className="admin-match-card">
                      <div className="admin-match-meta">
                        <span>{formatMatchDateTime(m)} · {m.city}</span>
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
            )}
          </div>
        );
      })}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// SECCIÓN: RESULTADOS DE ELIMINATORIAS (acordeón por fase)
// ════════════════════════════════════════════════════════════════

function AdminKnockoutResults() {
  const [results, setResults] = useState({});
  const [bracket, setBracket] = useState({});
  const [drafts, setDrafts] = useState({});
  const [expandedPhases, setExpandedPhases] = useState(() => new Set([PHASES_ORDER[0]]));
  const [autoExpandedOnce, setAutoExpandedOnce] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const a = subscribeToKnockoutResults(setResults);
    const b = subscribeToKnockoutBracket(setBracket);
    return () => {
      a();
      b();
    };
  }, []);

  // Auto-expandir la primera fase con resultados pendientes
  useEffect(() => {
    if (autoExpandedOnce) return;
    let phaseToExpand = PHASES_ORDER[0];
    for (const phase of PHASES_ORDER) {
      const phaseMatches = KNOCKOUT_MATCHES.filter((m) => m.phase === phase);
      const hasPending = phaseMatches.some((m) => !results[m.id]);
      if (hasPending) {
        phaseToExpand = phase;
        break;
      }
    }
    setExpandedPhases(new Set([phaseToExpand]));
    setAutoExpandedOnce(true);
  }, [results, autoExpandedOnce]);

  const togglePhase = (phase) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  const expandAll = () => setExpandedPhases(new Set(PHASES_ORDER));
  const collapseAll = () => setExpandedPhases(new Set());

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

      <div className="by-date-controls">
        <div />
        <div className="by-date-bulk">
          <button className="by-date-bulk-btn" onClick={expandAll}>Expandir todo</button>
          <span className="by-date-bulk-sep">·</span>
          <button className="by-date-bulk-btn" onClick={collapseAll}>Colapsar todo</button>
        </div>
      </div>

      {PHASES_ORDER.map((phase) => {
        const phaseMatches = KNOCKOUT_MATCHES.filter((m) => m.phase === phase);
        const total = phaseMatches.length;
        const done = phaseMatches.filter((m) => results[m.id]).length;
        const pending = total - done;
        const isExpanded = expandedPhases.has(phase);

        return (
          <div key={phase} className={`by-date-day ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
            <PhaseHeader
              phaseLabel={PHASE_LABELS[phase]}
              total={total}
              done={done}
              pending={pending}
              isExpanded={isExpanded}
              onToggle={() => togglePhase(phase)}
            />
            {isExpanded && (
              <div className="by-date-day-matches">
                {phaseMatches.map((m) => {
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
            )}
          </div>
        );
      })}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// SECCIÓN: CAMPEÓN OFICIAL (sin cambios)
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
    if (!confirm('¿Eliminar el campeón oficial? Los puntos extra se quitarán de quienes acertaron.')) return;
    await clearOfficialChampion();
    showToast('Campeón eliminado', { icon: '🗑️' });
  };

  return (
    <>
      <p className="admin-help">
        Al cargar el campeón oficial, todos los usuarios que lo hayan pronosticado
        correctamente reciben automáticamente +10 puntos.
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

// ════════════════════════════════════════════════════════════════
// HEADERS REUTILIZABLES (Day y Phase)
// ════════════════════════════════════════════════════════════════

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function DayHeader({ date, total, done, pending, isExpanded, onToggle }) {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const dayName = DAY_NAMES[dt.getUTCDay()];
  const monthName = MONTH_NAMES[m - 1];

  return (
    <button
      className="by-date-day-header"
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      <div className="by-date-day-header-main">
        <span className="by-date-day-chevron">{isExpanded ? '▴' : '▾'}</span>
        <div className="by-date-day-title">
          {dayName} <span className="by-date-day-num">{d}</span> de {monthName}
        </div>
      </div>
      <div className="by-date-day-meta">
        <span>{total} partido{total !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span className={done === total ? 'is-complete' : ''}>
          {done}/{total} cargados
        </span>
        {pending > 0 && (
          <>
            <span>·</span>
            <span className="by-date-day-pending-pill">
              {pending} por cargar
            </span>
          </>
        )}
      </div>
    </button>
  );
}

function PhaseHeader({ phaseLabel, total, done, pending, isExpanded, onToggle }) {
  return (
    <button
      className="by-date-day-header"
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      <div className="by-date-day-header-main">
        <span className="by-date-day-chevron">{isExpanded ? '▴' : '▾'}</span>
        <div className="by-date-day-title">{phaseLabel}</div>
      </div>
      <div className="by-date-day-meta">
        <span className={done === total ? 'is-complete' : ''}>
          {done}/{total}
        </span>
        {pending > 0 && (
          <>
            <span>·</span>
            <span className="by-date-day-pending-pill">
              {pending} por cargar
            </span>
          </>
        )}
      </div>
    </button>
  );
}
