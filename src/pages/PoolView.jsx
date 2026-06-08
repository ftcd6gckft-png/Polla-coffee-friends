import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getPool } from '../lib/pools.js';
import { useToast } from '../components/Toast.jsx';
import GroupPredictionsTab from '../components/GroupPredictionsTab.jsx';
import BracketTab from '../components/BracketTab.jsx';
import ChampionTab from '../components/ChampionTab.jsx';
import RankingTab from '../components/RankingTab.jsx';
import RulesTab from '../components/RulesTab.jsx';
import RankingUpdater from '../components/RankingUpdater.jsx';

const TABS = [
  { id: 'grupos',   label: 'Fase de grupos', icon: '⚽' },
  { id: 'bracket',  label: 'Eliminatorias',  icon: '🏆' },
  { id: 'campeon',  label: 'Campeón',        icon: '👑' },
  { id: 'ranking',  label: 'Ranking',        icon: '📊' },
  { id: 'reglas',   label: 'Reglas',         icon: '📜' },
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
      <RankingUpdater pollId={pool.id} />

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
        {activeTab === 'grupos'   && <GroupPredictionsTab pollId={pool.id} />}
        {activeTab === 'bracket'  && <BracketTab pollId={pool.id} />}
        {activeTab === 'campeon'  && <ChampionTab pollId={pool.id} />}
        {activeTab === 'ranking'  && <RankingTab pollId={pool.id} />}
        {activeTab === 'reglas'   && <RulesTab />}
      </div>
    </div>
  );
}
