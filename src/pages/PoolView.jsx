import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getPool } from '../lib/pools.js';
import { useToast } from '../components/Toast.jsx';

export default function PoolView() {
  const { pollaId } = useParams();
  const { user } = useAuth();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const navigate = useNavigate();
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

      <div className="cnj-soon-card">
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
        <h2 className="cnj-soon-title">Próximamente: Entrega 3</h2>
        <p className="cnj-soon-text">
          Aquí van a aparecer los pronósticos de la fase de grupos, el bracket de eliminatorias,
          el campeón y la tabla de posiciones de esta polla. Por ahora ya puedes invitar a más
          gente con el código.
        </p>
        <div className="cnj-soon-checklist">
          <div className="cnj-soon-item">⏳ Pronósticos por grupo (72 partidos)</div>
          <div className="cnj-soon-item">⏳ Bracket completo (16avos → Final)</div>
          <div className="cnj-soon-item">⏳ Pronóstico del campeón</div>
          <div className="cnj-soon-item">⏳ Tabla de posiciones por polla</div>
        </div>
      </div>
    </div>
  );
}
