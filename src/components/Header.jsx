import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, userDoc, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const initials = (() => {
    const name = userDoc?.displayName || user?.email || '';
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  })();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="cnj-header">
      <Link to="/" className="cnj-header-logo">
        <span className="cnj-logo-dot" />
        <span className="cnj-logo-text">
          <em>Coffee'n Jesus</em> · Chickengirl
        </span>
      </Link>

      {user ? (
        <div className="cnj-header-user">
          {isSuperAdmin && (
            <Link to="/admin" className="cnj-badge cnj-badge-admin cnj-badge-link" title="Panel super-admin">
              ⚙ ADMIN
            </Link>
          )}
          <div className="cnj-avatar" title={user.email}>{initials}</div>
          <span className="cnj-user-name">{userDoc?.displayName || user.email}</span>
          <button className="btn btn-ghost btn-xs" onClick={handleSignOut}>
            Salir
          </button>
        </div>
      ) : (
        <div className="cnj-header-user">
          <Link to="/login" className="btn btn-ghost btn-xs">Iniciar sesión</Link>
          <Link to="/registro" className="btn btn-accent btn-xs">Registrarme</Link>
        </div>
      )}
    </header>
  );
}
