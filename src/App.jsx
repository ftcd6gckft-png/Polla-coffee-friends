import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { isFirebaseConfigured, SUPERADMIN_EMAIL, db } from './firebase.js';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { TEAMS } from './data/teams.js';
import { GROUP_MATCHES } from './data/groupMatches.js';
import { KNOCKOUT_MATCHES } from './data/knockoutTemplate.js';

/**
 * ENTREGA 1 — Landing diagnóstica
 *
 * Este componente NO es la app final. Su único propósito es confirmar que:
 *  1. El build de Vite corre sin errores.
 *  2. Las variables de entorno de Firebase están bien seteadas en Vercel.
 *  3. Firestore es alcanzable.
 *  4. Los datos del fixture (48 selecciones, 72 partidos de grupos, 32 eliminatorias)
 *     se cargan correctamente.
 *  5. El branding Pantone se aplica.
 *
 * Cuando todo aparezca en verde, pasamos a la Entrega 2 (auth + pollas).
 */

function Landing() {
  const [firestoreOk, setFirestoreOk] = useState(null);
  const [firestoreErr, setFirestoreErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      if (!isFirebaseConfigured) {
        setFirestoreOk(false);
        setFirestoreErr('Faltan variables de entorno');
        return;
      }
      try {
        // Hacemos un query trivial a una colección que muy probablemente no existe.
        // Si las credenciales son válidas, Firestore responde (con 0 docs); si no, da error.
       const q = query(collection(db, '_diagnostic'), limit(1));
        await getDocs(q);
        if (!cancelled) setFirestoreOk(true);
      } catch (e) {
        if (!cancelled) {
          setFirestoreOk(false);
          setFirestoreErr(e?.code || e?.message || 'error desconocido');
        }
      }
    }
    ping();
    return () => { cancelled = true; };
  }, []);

  const superadminSet = !!SUPERADMIN_EMAIL && SUPERADMIN_EMAIL !== 'tu-correo@ejemplo.com';

  const status = (ok) =>
    ok === null ? <span className="diag-value">comprobando…</span>
    : ok ? <span className="diag-value diag-ok">✓ OK</span>
    : <span className="diag-value diag-bad">✗ FALLA</span>;

  return (
    <div className="landing container">
      <div className="brand-mark">
        <span className="dot" />
        <span>Coffee'n Jesus · Polla Mundial 2026</span>
      </div>

      <h1 className="title-main">Chickengirl</h1>

      <p className="subtitle">
        Entrega 1 lista. Esta es la pantalla de diagnóstico — si todo aparece en verde,
        pasamos a construir la autenticación y las pollas.
      </p>

      <div className="diag-card">
        <div className="diag-row">
          <span className="diag-label">Config de Firebase</span>
          {status(isFirebaseConfigured)}
        </div>
        <div className="diag-row">
          <span className="diag-label">Conexión a Firestore</span>
          {status(firestoreOk)}
        </div>
        {firestoreErr && (
          <div className="diag-row">
            <span className="diag-label">Detalle del error</span>
            <span className="diag-value diag-bad" style={{ fontSize: 11 }}>{firestoreErr}</span>
          </div>
        )}
        <div className="diag-row">
          <span className="diag-label">Super-admin configurado</span>
          {superadminSet
            ? <span className="diag-value diag-ok">✓ {SUPERADMIN_EMAIL}</span>
            : <span className="diag-value diag-bad">✗ falta VITE_SUPERADMIN_EMAIL</span>}
        </div>
        <div className="diag-row">
          <span className="diag-label">Selecciones cargadas</span>
          <span className="diag-value diag-ok">{TEAMS.length} / 48</span>
        </div>
        <div className="diag-row">
          <span className="diag-label">Partidos de grupos</span>
          <span className="diag-value diag-ok">{GROUP_MATCHES.length} / 72</span>
        </div>
        <div className="diag-row">
          <span className="diag-label">Partidos eliminatorias</span>
          <span className="diag-value diag-ok">{KNOCKOUT_MATCHES.length} / 32</span>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 480, lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--lavender)' }}>Siguiente paso:</strong> verifica que en
        Firebase Console tengas habilitados <em>Authentication → Email/Password</em> y
        <em> Firestore Database</em> (modo Production). Cuando esto cargue en verde, avísame y
        sigo con la Entrega 2 (registro, login, crear/unirse a pollas).
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="landing container">
      <h1 className="title-main">404</h1>
      <p className="subtitle">Esta ruta aún no existe. Volveremos pronto.</p>
      <a href="/" className="btn btn-ghost">Volver al inicio</a>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <div className="bg-orbs" />
      <div className="bg-noise" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
