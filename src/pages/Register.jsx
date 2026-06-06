import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase.js';
import { ensureUserDoc } from '../lib/pools.js';
import { useToast } from '../components/Toast.jsx';

const ERR_MESSAGES = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión en lugar de registrarte.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/operation-not-allowed': 'El registro por correo no está habilitado en Firebase.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/network-request-failed': 'Problema de conexión. Revisa tu internet.',
};

export default function Register() {
  const [displayName, setDisplayName] = useState('');
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
    if (!displayName.trim() || !email || !password) {
      setErr('Completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setErr('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = displayName.trim().slice(0, 60);
      await updateProfile(cred.user, { displayName: cleanName });
      await ensureUserDoc(cred.user.uid, {
        email: cred.user.email,
        displayName: cleanName,
      });
      showToast(`¡Bienvenido, ${cleanName.split(' ')[0]}!`, { icon: '🎉' });
      navigate(next, { replace: true });
    } catch (e) {
      const msg = ERR_MESSAGES[e.code] || `Error al crear cuenta (${e.code || 'desconocido'})`;
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-sub">Tu cuenta te sirve para entrar y salir de varias pollas con el mismo usuario.</p>

        {err && <div className="err">{err}</div>}

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label className="fl" htmlFor="displayName">Tu nombre</label>
            <input
              id="displayName"
              className="fi"
              placeholder="Como quieres que te vean tus amigos"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
              maxLength={60}
            />
          </div>
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
            />
          </div>
          <div className="fg">
            <label className="fl" htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="fi"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
          </button>
        </form>

        <div className="auth-foot">
          ¿Ya tienes cuenta?{' '}
          <Link to={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
