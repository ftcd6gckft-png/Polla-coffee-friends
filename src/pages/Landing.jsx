import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing container">
      <div className="brand-mark">
        <span className="dot" />
        <span>Coffee'n Jesus · Polla Mundial 2026</span>
      </div>

      <h1 className="title-main">Chickengirl</h1>

      <p className="subtitle">
        La polla del Mundial. Crea tu grupo, invita a tus amigos con un código,
        pronostica los partidos y compite por el puntaje más alto del torneo.
      </p>

      <div className="cnj-cta-row">
        <Link to="/registro" className="btn btn-accent">Crear mi cuenta</Link>
        <Link to="/login" className="btn btn-ghost">Ya tengo cuenta</Link>
      </div>

      <div className="cnj-features">
        <div className="cnj-feature">
          <div className="cnj-feature-icon">🎯</div>
          <div className="cnj-feature-text">
            <strong>3 puntos</strong> por marcador exacto
          </div>
        </div>
        <div className="cnj-feature">
          <div className="cnj-feature-icon">✓</div>
          <div className="cnj-feature-text">
            <strong>1 punto</strong> por acertar el ganador
          </div>
        </div>
        <div className="cnj-feature">
          <div className="cnj-feature-icon">🏆</div>
          <div className="cnj-feature-text">
            <strong>5 puntos</strong> si aciertas el campeón
          </div>
        </div>
      </div>

      <div className="cnj-footnote">
        Mundial 2026 · USA · México · Canadá · 48 selecciones · 104 partidos
      </div>
    </div>
  );
}
