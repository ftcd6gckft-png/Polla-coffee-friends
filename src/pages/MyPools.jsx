import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserPools } from '../lib/pools.js';

export default function MyPools() {
  const { user, userDoc } = useAuth();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      try {
        const list = await getUserPools(user.uid);
        if (!cancelled) setPools(list);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'No se pudieron cargar las pollas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, userDoc?.pools?.length]);

  const firstName = (userDoc?.displayName || user?.email || '').split(/\s+/)[0];

  return (
    <div className="container cnj-page">
      <div className="cnj-hello">
        <h1 className="cnj-h1">
          Hola, <span className="cnj-h1-accent">{firstName}</span>
        </h1>
        <p className="cnj-h1-sub">
          {pools.length === 0
            ? 'Todavía no eres parte de ninguna polla. Crea una nueva o únete con un código.'
            : `Estás en ${pools.length} ${pools.length === 1 ? 'polla' : 'pollas'}.`}
        </p>
      </div>

      <div className="cnj-cta-row">
        <Link to="/crear-polla" className="btn btn-accent">+ Crear polla nueva</Link>
        <Link to="/unirse" className="btn btn-ghost">Unirme con código</Link>
      </div>

      {err && <div className="err" style={{ marginTop: 20 }}>{err}</div>}

      {loading ? (
        <div className="cnj-loading" style={{ marginTop: 40 }}>
          <div className="cnj-spinner" />
          <span>Cargando tus pollas…</span>
        </div>
      ) : (
        <div className="cnj-pool-grid">
          {pools.map((p) => (
            <Link key={p.id} to={`/polla/${p.id}`} className="cnj-pool-card">
              <div className="cnj-pool-name">{p.name}</div>
              <div className="cnj-pool-meta">
                <span>{p.memberCount || (p.members || []).length} miembros</span>
                <span className="cnj-pool-code">{p.code}</span>
              </div>
              {p.adminUid === user.uid && (
                <span className="cnj-badge cnj-badge-admin">Admin</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
