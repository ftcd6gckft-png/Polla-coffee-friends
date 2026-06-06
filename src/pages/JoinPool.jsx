import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { joinPoolByCode, resolveInviteCode } from '../lib/pools.js';
import { normalizeCode, isValidCodeFormat } from '../lib/inviteCodes.js';
import { useToast } from '../components/Toast.jsx';

export default function JoinPool() {
  const { codigo: codeFromUrl } = useParams();
  const [code, setCode] = useState(codeFromUrl || '');
  const [preview, setPreview] = useState(null); // datos de la polla antes de confirmar
  const [previewing, setPreviewing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState('');
  const { user, refreshUserDoc } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Si vino un código por URL, mostrar preview automáticamente
  useEffect(() => {
    if (codeFromUrl) {
      handlePreview(codeFromUrl);
    }
  }, [codeFromUrl]);

  const handlePreview = async (raw) => {
    const normalized = normalizeCode(raw);
    setErr('');
    if (!isValidCodeFormat(normalized)) {
      setErr('El código debe tener el formato MUNDIAL-XXXX');
      setPreview(null);
      return;
    }
    setPreviewing(true);
    try {
      const result = await resolveInviteCode(normalized);
      if (!result) {
        setErr('Ese código no existe. Verifica con quien te lo compartió.');
        setPreview(null);
      } else {
        setPreview(result.poll);
        setCode(normalized);
      }
    } catch (e) {
      setErr(e.message || 'No se pudo verificar el código');
    } finally {
      setPreviewing(false);
    }
  };

  const handleJoin = async () => {
    if (!preview) return;
    // Si ya es miembro, solo llevarlo a la polla
    if (preview.members?.includes(user.uid)) {
      navigate(`/polla/${preview.id}`);
      return;
    }
    setJoining(true);
    setErr('');
    try {
      await joinPoolByCode({ code, uid: user.uid });
      await refreshUserDoc();
      showToast(`Te uniste a "${preview.name}"`, { icon: '🎉' });
      navigate(`/polla/${preview.id}`);
    } catch (e) {
      setErr(e.message || 'No se pudo unir a la polla');
    } finally {
      setJoining(false);
    }
  };

  const isMember = preview && user && preview.members?.includes(user.uid);
  const isFull = preview && (preview.memberCount || preview.members?.length || 0) >= 50;

  return (
    <div className="container cnj-page">
      <div className="auth-wrap" style={{ paddingTop: 20 }}>
        <div className="auth-card">
          <h2 className="auth-title">Unirme a una polla</h2>
          <p className="auth-sub">
            Pega el código que te compartieron (formato <code>MUNDIAL-XXXX</code>).
          </p>

          {err && <div className="err">{err}</div>}

          <div className="fg">
            <label className="fl" htmlFor="code">Código de invitación</label>
            <input
              id="code"
              className="fi cnj-code-input"
              placeholder="MUNDIAL-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onBlur={(e) => e.target.value && handlePreview(e.target.value)}
              autoFocus
              maxLength={20}
            />
          </div>

          {previewing && (
            <div className="cnj-loading" style={{ padding: 20 }}>
              <div className="cnj-spinner" />
              <span>Verificando código…</span>
            </div>
          )}

          {preview && !previewing && (
            <div className="cnj-preview-card">
              <div className="cnj-preview-label">POLLA</div>
              <div className="cnj-preview-name">{preview.name}</div>
              <div className="cnj-preview-meta">
                {preview.memberCount || (preview.members || []).length} de 50 miembros
              </div>
              {isMember && (
                <div className="cnj-preview-note ok">
                  ✓ Ya eres miembro de esta polla
                </div>
              )}
              {isFull && !isMember && (
                <div className="cnj-preview-note bad">
                  ✗ Esta polla ya está llena (50/50)
                </div>
              )}
            </div>
          )}

          {!preview && !previewing && code && (
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => handlePreview(code)}
            >
              Verificar código
            </button>
          )}

          {preview && (
            <button
              type="button"
              className="btn btn-accent btn-full"
              onClick={handleJoin}
              disabled={joining || (isFull && !isMember)}
              style={{ marginTop: 12 }}
            >
              {joining
                ? 'Uniéndote…'
                : isMember
                ? 'Ir a la polla →'
                : `Unirme a "${preview.name}"`}
            </button>
          )}

          <div className="auth-foot">
            <Link to="/">← Cancelar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
