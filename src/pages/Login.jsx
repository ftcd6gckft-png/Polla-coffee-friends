import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';
import { useToast } from '../components/Toast.jsx';

const ERR_MESSAGES = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Problema de conexión. Revisa tu internet.',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErr('Completa correo y contraseña.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('¡Bienvenido de nuevo!', { icon: '⚽' });
      navigate(next, { replace: true });
    } catch (e) {
      const msg = ERR_MESSAGES[e.code] || `Error al iniciar sesión (${e.code || 'desconocido'})`;
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Iniciar sesión</h2>
        <p className="auth-sub">Ingresa con tu cuenta para acceder a tus pollas.</p>

        {err && <div className="err">{err}</div>}

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label className="fl" htmlFor="email">Correo</label>
            <input
              id="email"
              className="fi"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="fg">
            <label className="fl" htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="fi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar al torneo →'}
          </button>
        </form>

        <div className="auth-foot">
          ¿No tienes cuenta?{' '}
          <Link to={`/registro${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}>
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
