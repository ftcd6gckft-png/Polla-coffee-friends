import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase.js';

const ERR_MESSAGES = {
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Problema de conexión. Revisa tu internet.',
  'auth/missing-email': 'Escribe tu correo.',
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [params] = useSearchParams();
  const next = params.get('next') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErr('Escribe tu correo.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (e) {
      const msg = ERR_MESSAGES[e.code] || `Error: ${e.code || 'desconocido'}`;
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 12 }}>📬</div>
          <h2 className="auth-title" style={{ textAlign: 'center' }}>
            Correo enviado
          </h2>
          <p className="auth-sub" style={{ textAlign: 'center' }}>
            Te enviamos un correo a <strong>{email}</strong> con las instrucciones
            para restablecer tu contraseña.
          </p>

          <div className="forgot-tips">
            <div className="forgot-tip">
              <strong>📌 Importante:</strong>
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                <li>Revisa la carpeta de <strong>spam</strong> si no lo ves en tu bandeja de entrada.</li>
                <li>El remitente es <em>noreply</em> de Firebase.</li>
                <li>El link expira en <strong>1 hora</strong>. Si lo dejas pasar, vuelve a pedirlo aquí.</li>
              </ul>
            </div>
          </div>

          <div className="auth-foot">
            <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">¿Olvidaste tu contraseña?</h2>
        <p className="auth-sub">
          Escribe el correo con el que te registraste y te enviamos un link para
          crear una contraseña nueva.
        </p>

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
          <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar link de recuperación'}
          </button>
        </form>

        <div className="auth-foot">
          <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
