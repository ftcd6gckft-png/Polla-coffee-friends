import { useState, useEffect, useMemo } from 'react';
import {
  calcAllGroupStandings,
  calcBestThirds,
  calcGroupsProgress,
} from '../lib/groupStandings.js';
import { subscribeToGroupResults } from '../lib/predictions.js';
import { GROUPS } from '../data/teams.js';

/**
 * Pestaña: tablas de posiciones de la fase de grupos en tiempo real.
 *
 * Aplica criterios FIFA Mundial 2026:
 *   1. Puntos
 *   2. Enfrentamiento directo (puntos → DG → GF entre empatados)
 *   3. Diferencia de goles general
 *   4. Goles a favor general
 *   5. Alfabético (fallback; FIFA usa fair play y ranking pero no los tenemos)
 *
 * Para "mejores terceros": puntos → DG → GF → alfabético
 * (no aplica H2H porque vienen de grupos distintos).
 */
export default function StandingsTab() {
  const [results, setResults] = useState({});
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]);
  const [view, setView] = useState('groups');

  useEffect(() => {
    const unsub = subscribeToGroupResults(setResults);
    return unsub;
  }, []);

  const allStandings = useMemo(() => calcAllGroupStandings(results), [results]);
  const bestThirds = useMemo(() => calcBestThirds(allStandings), [allStandings]);
  const progress = useMemo(() => calcGroupsProgress(results), [results]);

  return (
    <div className="standings-tab">
      <div className="standings-intro">
        <h2 className="standings-title">📊 Tablas en vivo</h2>
        <p className="standings-sub">
          Posiciones de cada grupo según los resultados oficiales cargados.
          Se actualizan automáticamente cuando se carga un partido nuevo.
        </p>
        <div className="standings-progress">
          <div className="standings-progress-bar">
            <div
              className="standings-progress-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="standings-progress-text">
            <strong>{progress.played}</strong> de {progress.total} partidos jugados
            ({progress.percent}%)
          </div>
        </div>
      </div>

      <div className="subview-tabs">
        <button
          className={`subview-tab ${view === 'groups' ? 'is-active' : ''}`}
          onClick={() => setView('groups')}
        >
          🔠 Por grupo
        </button>
        <button
          className={`subview-tab ${view === 'thirds' ? 'is-active' : ''}`}
          onClick={() => setView('thirds')}
        >
          🥉 Mejores terceros
        </button>
      </div>

      {view === 'groups' && (
        <>
          <div className="group-tabs">
            {GROUPS.map((g) => {
              const t = allStandings[g];
              const partidos = t.reduce((acc, x) => acc + x.pj, 0) / 2;
              return (
                <button
                  key={g}
                  className={`group-tab ${activeGroup === g ? 'is-active' : ''}`}
                  onClick={() => setActiveGroup(g)}
                >
                  <span className="group-tab-letter">Grupo {g}</span>
                  <span className="group-tab-count">{partidos}/6</span>
                </button>
              );
            })}
          </div>

          <GroupStandingsTable group={activeGroup} standings={allStandings[activeGroup]} />
        </>
      )}

      {view === 'thirds' && (
        <BestThirdsTable thirds={bestThirds} />
      )}

      <div className="standings-disclaimer">
        ℹ️ <strong>Cómo se ordena:</strong> Puntos → Enfrentamiento directo entre empatados →
        Diferencia de goles general → Goles a favor → Orden alfabético. La FIFA aplica
        además Fair Play y Ranking FIFA si persiste el empate (no los incluimos porque
        la app no guarda tarjetas).
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function GroupStandingsTable({ group, standings }) {
  return (
    <div className="standings-card">
      <div className="standings-card-head">
        <h3 className="standings-card-title">Grupo {group}</h3>
      </div>
      <div className="standings-table">
        <div className="st-row st-row-head">
          <div className="st-pos">#</div>
          <div className="st-team">Equipo</div>
          <div className="st-num" title="Partidos jugados">PJ</div>
          <div className="st-num" title="Ganados">G</div>
          <div className="st-num" title="Empatados">E</div>
          <div className="st-num" title="Perdidos">P</div>
          <div className="st-num" title="Goles a favor">GF</div>
          <div className="st-num" title="Goles en contra">GC</div>
          <div className="st-num" title="Diferencia de goles">DG</div>
          <div className="st-num st-pts" title="Puntos">PTS</div>
          <div className="st-status">Estado</div>
        </div>
        {standings.map((t) => (
          <div key={t.code} className={`st-row st-${t.status}`}>
            <div className="st-pos">{t.position}</div>
            <div className="st-team">
              <span className="st-flag">{t.flag}</span>
              <span className="st-name">{t.name}</span>
            </div>
            <div className="st-num">{t.pj}</div>
            <div className="st-num">{t.g}</div>
            <div className="st-num">{t.e}</div>
            <div className="st-num">{t.p}</div>
            <div className="st-num">{t.gf}</div>
            <div className="st-num">{t.gc}</div>
            <div className="st-num">{t.dif > 0 ? '+' : ''}{t.dif}</div>
            <div className="st-num st-pts">{t.pts}</div>
            <div className="st-status">
              {t.status === 'first' && <span className="st-badge st-badge-pass">✅ 1ro</span>}
              {t.status === 'second' && <span className="st-badge st-badge-pass">✅ 2do</span>}
              {t.status === 'third' && <span className="st-badge st-badge-third">🥉 3ro</span>}
              {t.status === 'fourth' && <span className="st-badge st-badge-out">❌</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="standings-legend">
        <span>✅ Pasa directo a dieciseisavos</span>
        <span>·</span>
        <span>🥉 Lugar para mejor tercero (revisa la tabla de Mejores terceros)</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function BestThirdsTable({ thirds }) {
  return (
    <div className="standings-card">
      <div className="standings-card-head">
        <h3 className="standings-card-title">🥉 Mejores terceros</h3>
        <p className="standings-card-sub">
          Los <strong>8 mejores terceros</strong> de los 12 grupos clasifican a dieciseisavos.
          Los otros 4 quedan eliminados.
        </p>
      </div>
      <div className="standings-table">
        <div className="st-row st-row-head">
          <div className="st-pos">#</div>
          <div className="st-team">Equipo</div>
          <div className="st-group">Grupo</div>
          <div className="st-num">PJ</div>
          <div className="st-num">GF</div>
          <div className="st-num">GC</div>
          <div className="st-num">DG</div>
          <div className="st-num st-pts">PTS</div>
          <div className="st-status">Estado</div>
        </div>
        {thirds.map((t) => (
          <div
            key={t.code}
            className={`st-row ${t.qualifies ? 'st-third-pass' : 'st-third-out'}`}
          >
            <div className="st-pos">{t.thirdsPosition}</div>
            <div className="st-team">
              <span className="st-flag">{t.flag}</span>
              <span className="st-name">{t.name}</span>
            </div>
            <div className="st-group">{t.group}</div>
            <div className="st-num">{t.pj}</div>
            <div className="st-num">{t.gf}</div>
            <div className="st-num">{t.gc}</div>
            <div className="st-num">{t.dif > 0 ? '+' : ''}{t.dif}</div>
            <div className="st-num st-pts">{t.pts}</div>
            <div className="st-status">
              {t.qualifies ? (
                <span className="st-badge st-badge-pass">✅ Clasifica</span>
              ) : (
                <span className="st-badge st-badge-out">❌ Eliminado</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {thirds.length === 0 && (
        <div className="standings-empty">
          Aún no hay terceros lugares definidos. Cuando se jueguen los partidos de grupos,
          esta tabla se va a llenar automáticamente.
        </div>
      )}
    </div>
  );
}
