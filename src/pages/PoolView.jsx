import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getPool } from '../lib/pools.js';
import { useToast } from '../components/Toast.jsx';
import GroupPredictionsTab from '../components/GroupPredictionsTab.jsx';

const TABS = [
  { id: 'grupos',   label: 'Fase de grupos', icon: '⚽' },
  { id: 'bracket',  label: 'Eliminatorias',  icon: '🏆' },
  { id: 'campeon',  label: 'Campeón',        icon: '👑' },
  { id: 'ranking',  label: 'Ranking',        icon: '📊' },
];

export default function PoolView() {
  const { pollaId } = useParams();
  const { user } = useAuth();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'grupos';
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const p = await getPool(pollaId);
        if (!cancelled) {
          if (!p) {
            setErr('Esta polla no existe o fue eliminada.');
          } else if (!p.members?.includes(user.uid)) {
            setErr('No eres miembro de esta polla.');
          } else {
            setPool(p);
          }
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'No se pudo cargar la polla');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pollaId, user.uid]);

  const setTab = (id) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const copyInvite = async () => {
    const url = `${window.location.origin}/unirse/${pool.code}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link de invitación copiado', { icon: '📋' });
    } catch {
      showToast('No se pudo copiar, hazlo manualmente', { icon: '⚠️', type: 'warn' });
    }
  };

  if (loading) {
    return (
      <div className="container cnj-page">
        <div className="cnj-loading">
          <div className="cnj-spinner" />
          <span>Cargando polla…</span>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container cnj-page">
        <div className="err" style={{ maxWidth: 500, margin: '40px auto' }}>{err}</div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/" className="btn btn-ghost">← Volver a mis pollas</Link>
        </div>
      </div>
    );
  }

  const isAdmin = pool.adminUid === user.uid;
  const memberCount = pool.memberCount || (pool.members || []).length;

  return (
    <div className="container cnj-page">
      <div className="cnj-pool-header">
        <div>
          <Link to="/" className="cnj-back-link">← Mis pollas</Link>
          <h1 className="cnj-h1">{pool.name}</h1>
          <div className="cnj-pool-header-meta">
            <span>{memberCount} / 50 miembros</span>
            <span>·</span>
            <span>Código: <strong>{pool.code}</strong></span>
            {isAdmin && (
              <>
                <span>·</span>
                <span className="cnj-badge cnj-badge-admin">Eres admin</span>
              </>
            )}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={copyInvite}>
          📋 Copiar link de invitación
        </button>
      </div>

      <nav className="pool-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`pool-tab ${activeTab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-pressed={activeTab === t.id}
          >
            <span className="pool-tab-icon">{t.icon}</span>
            <span className="pool-tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="pool-tab-content">
        {activeTab === 'grupos' && <GroupPredictionsTab pollId={pool.id} />}

        {activeTab === 'bracket' && (
          <SoonPanel
            title="Bracket de eliminatorias"
            text="Se desbloqueará automáticamente cuando termine la fase de grupos (28 de junio). Cuando los 72 partidos de grupos tengan resultado oficial, podrás pronosticar octavos, cuartos, semis, 3er puesto y final."
            items={['16 partidos de dieciseisavos', '8 de octavos', '4 de cuartos', '2 semifinales', '3er puesto · 18 jul', 'Final · 19 jul · MetLife']}
          />
        )}

        {activeTab === 'campeon' && (
          <SoonPanel
            title="Pronóstico de campeón"
            text="Selecciona quién crees que ganará el Mundial 2026 entre las 48 selecciones. Si aciertas, ganas 5 puntos al final del torneo. Disponible en la próxima entrega."
            items={['+5 pts si aciertas', 'Bloqueado al inicio del Mundial', 'Una elección por polla']}
          />
        )}

        {activeTab === 'ranking' && (
          <SoonPanel
            title="Tabla de posiciones"
            text="Aquí aparecerá el ranking de todos los miembros de esta polla ordenados por puntaje. Se actualiza automáticamente conforme se cargan los resultados oficiales."
            items={['Puntos totales · exactos · ganadores', 'Tu posición destacada', 'Empate desempata por exactos']}
          />
        )}
      </div>
    </div>
  );
}

function SoonPanel({ title, text, items }) {
  return (
    <div className="cnj-soon-card">
      <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
      <h2 className="cnj-soon-title">{title}</h2>
      <p className="cnj-soon-text">{text}</p>
      <div className="cnj-soon-checklist">
        {items.map((i) => (
          <div key={i} className="cnj-soon-item">• {i}</div>
        ))}
      </div>
    </div>
  );
}
