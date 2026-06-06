import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Envuelve rutas que requieren estar logueado.
 * Si no hay sesión, redirige a /login y conserva la ruta original
 * (para volver ahí después del login - útil para /unirse/:codigo).
 */
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="cnj-loading">
        <div className="cnj-spinner" />
        <span>Cargando…</span>
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${redirect}`} replace />;
  }

  return children;
}
