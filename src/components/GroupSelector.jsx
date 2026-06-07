import { GROUPS } from '../data/teams.js';
import { GROUP_MATCHES } from '../data/groupMatches.js';

/**
 * Tabs horizontales para navegar entre Grupos A-L.
 * Muestra para cada grupo un contador "N/6 pronósticos completos".
 */
export default function GroupSelector({ activeGroup, onChange, predictions }) {
  const groupStats = (g) => {
    const matches = GROUP_MATCHES.filter((m) => m.group === g);
    const completed = matches.filter((m) => {
      const p = predictions?.[m.id];
      return p && p.home != null && p.away != null;
    }).length;
    return { total: matches.length, completed };
  };

  return (
    <div className="group-tabs">
      {GROUPS.map((g) => {
        const { total, completed } = groupStats(g);
        const isComplete = completed === total;
        return (
          <button
            key={g}
            className={`group-tab ${activeGroup === g ? 'is-active' : ''} ${isComplete ? 'is-done' : ''}`}
            onClick={() => onChange(g)}
            aria-pressed={activeGroup === g}
          >
            <span className="group-tab-letter">Grupo {g}</span>
            <span className="group-tab-count">
              {completed}/{total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
