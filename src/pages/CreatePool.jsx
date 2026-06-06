import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createPool } from '../lib/pools.js';
import { useToast } from '../components/Toast.jsx';

export default function CreatePool() {
  const { user, userDoc, refreshUserDoc } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [createdPool, setCreatedPool] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Ponle un nombre a tu polla.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const { id, code } = await createPool({
        name: name.trim(),
        adminUid: user.uid,
        adminDisplayName: userDoc?.displayName || user.email,
      });
      await refreshUserDoc();
      setCreatedPool({ id, code, name: name.trim() });
      showToast('Polla creada', { icon: '🎉' });
    } catch (e) {
      setErr(e.message || 'Hubo un error al crear la polla.');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito: muestra el código y link de invitación
  if (createdPool) {
    const inviteUrl = `${window.location.origin}/unirse/${createdPool.code}`;
    const shareText = `Te invito a mi polla del Mundial 2026 "${createdPool.name}". Únete con este código: ${createdPool.code}\n\nO entra directo: ${inviteUrl}`;

    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        showToast('Link copiado', { icon: '📋' });
      } catch {
        showToast('No se pudo copiar, hazlo manualmente', { icon: '⚠️', type: 'warn' });
      }
    };

    const copyMessage = async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('Mensaje copiado', { icon: '📋' });
      } catch {
        showToast('No se pudo copiar, hazlo manualmente', { icon: '⚠️', type: 'warn' });
      }
    };

    return (
      <div className="container cnj-page">
        <div className="cnj-success">
          <div style={{ fontSize: 56 }}>🎉</div>
          <h1 className="cnj-h1">¡Polla creada!</h1>
          <p className="cnj-h1-sub">
            "{createdPool.name}" ya está lista. Comparte este código con tus amigos.
          </p>

          <div className="cnj-code-display">
            <div className="cnj-code-label">CÓDIGO DE INVITACIÓN</div>
            <div className="cnj-code-value">{createdPool.code}</div>
          </div>

          <div className="cnj-share-row">
            <button className="btn btn-ghost" onClick={copyLink}>
              📋 Copiar link
            </button>
            <button className="btn btn-ghost" onClick={copyMessage}>
              💬 Copiar mensaje para WhatsApp
            </button>
          </div>

          <div className="cnj-invite-url">
            <code>{inviteUrl}</code>
          </div>

          <div className="cnj-cta-row" style={{ marginTop: 24 }}>
            <button className="btn btn-accent" onClick={() => navigate(`/polla/${createdPool.id}`)}>
              Entrar a la polla →
            </button>
            <Link to="/" className="btn btn-ghost">Volver a mis pollas</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container cnj-page">
      <div className="auth-wrap" style={{ paddingTop: 20 }}>
        <div className="auth-card">
          <h2 className="auth-title">Crear nueva polla</h2>
          <p className="auth-sub">
            Cada polla es un grupo independiente. Tú quedas como admin y puedes invitar
            hasta 49 amigos más (50 total).
          </p>

          {err && <div className="err">{err}</div>}

          <form onSubmit={handleSubmit}>
            <div className="fg">
              <label className="fl" htmlFor="poolName">Nombre de la polla</label>
              <input
                id="poolName"
                className="fi"
                placeholder="Ej: Coffee'n Jesus 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoFocus
              />
              <div className="fhelp">{80 - name.length} caracteres restantes</div>
            </div>
            <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
              {loading ? 'Creando…' : 'Crear polla'}
            </button>
          </form>

          <div className="auth-foot">
            <Link to="/">← Cancelar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
