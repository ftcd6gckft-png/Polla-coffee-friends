/**
 * Pestaña "Reglas" — vista estática con las reglas de la polla.
 * No se conecta a Firestore, no requiere props.
 */
export default function RulesTab() {
  return (
    <div className="rules-tab">
      <div className="rules-intro">
        <div className="rules-emoji">📜</div>
        <h2 className="rules-title">Reglas de la polla</h2>
        <p className="rules-subtitle">
          Léelas con calma. Si ya estás dentro, ya las aceptaste.
        </p>
      </div>

      {/* ───────── PUNTOS ───────── */}
      <section className="rules-card">
        <div className="rules-card-head">
          <span className="rules-card-icon">🎯</span>
          <h3 className="rules-card-title">Sistema de puntos</h3>
        </div>
        <ul className="rules-list">
          <li>
            <strong>Fase de grupos:</strong>
          </li>
          <li style={{ marginLeft: 16 }}>
            <strong>3 puntos</strong> por marcador exacto.
          </li>
          <li style={{ marginLeft: 16 }}>
            <strong>1 punto</strong> por acertar el ganador (o empate, si pronosticaste empate).
          </li>
          <li>
            <strong>Fase eliminatoria:</strong>
          </li>
          <li style={{ marginLeft: 16 }}>
            <strong>5 puntos</strong> por marcador exacto (90 minutos).
          </li>
          <li style={{ marginLeft: 16 }}>
            <strong>2 puntos</strong> por acertar el ganador en 90 minutos (o empate, si el partido va a penales).
          </li>
          <li>
            <strong>0 puntos</strong> por no acertar.
          </li>
          <li>
            <strong>+10 puntos extra</strong> si aciertas el campeón del Mundial (se suman al final del torneo).
          </li>
        </ul>
        <div className="rules-note">
          En eliminatorias, el marcador se evalúa con el resultado de los <strong>90 minutos</strong> (sin alargues ni penales). Si va a penales, cuenta como empate.
        </div>
      </section>

      {/* ───────── CIERRE ───────── */}
      <section className="rules-card">
        <div className="rules-card-head">
          <span className="rules-card-icon">⏰</span>
          <h3 className="rules-card-title">Cierre de pronósticos</h3>
        </div>
        <ul className="rules-list">
          <li>
            Cada partido se cierra <strong>15 minutos antes</strong> del kickoff (hora Colombia).
          </li>
          <li>
            Después del cierre no se puede editar el pronóstico de ese partido — quedan los puntos en 0 si nadie alcanzó.
          </li>
          <li>
            El pronóstico de <strong>campeón</strong> se cierra al iniciar el primer partido del Mundial: <strong>11 de junio · 13:45 COL</strong>.
          </li>
          <li>
            Puedes editar tus pronósticos las veces que quieras antes del cierre.
          </li>
        </ul>
      </section>

      {/* ───────── PAGO ───────── */}
      <section className="rules-card rules-card-highlight">
        <div className="rules-card-head">
          <span className="rules-card-icon">💵</span>
          <h3 className="rules-card-title">Valor de inscripción</h3>
        </div>
        <div className="rules-price">
          <div className="rules-price-amount">$15.000</div>
          <div className="rules-price-currency">COP por persona</div>
        </div>
        <ul className="rules-list">
          <li>
            <strong>Fecha límite de pago:</strong> lunes <strong>15 de junio de 2026</strong>.
          </li>
          <li>
            Si no realizas el pago antes de esa fecha, <strong>no serás tenido en cuenta en la puntuación general</strong>, aunque hayas pronosticado.
          </li>
          <li className="rules-pay-info">
            💬 <strong>Comunícate con el administrador de la polla</strong> para coordinar tu pago.
          </li>
        </ul>
      </section>

      {/* ───────── DESEMPATES ───────── */}
      <section className="rules-card">
        <div className="rules-card-head">
          <span className="rules-card-icon">📊</span>
          <h3 className="rules-card-title">Cómo se ordena la tabla</h3>
        </div>
        <p className="rules-paragraph">
          Si dos jugadores tienen los mismos puntos totales, se desempata en este orden:
        </p>
        <ol className="rules-list rules-list-numbered">
          <li>Más <strong>marcadores exactos</strong>.</li>
          <li>Más <strong>aciertos de ganador</strong>.</li>
          <li>Orden <strong>alfabético</strong> del nombre.</li>
        </ol>
      </section>

      {/* ───────── TIPS ───────── */}
      <section className="rules-card">
        <div className="rules-card-head">
          <span className="rules-card-icon">💡</span>
          <h3 className="rules-card-title">Tips</h3>
        </div>
        <ul className="rules-list">
          <li>
            Tus pronósticos se <strong>guardan automáticamente</strong> mientras los editas. No hace falta botón de guardar.
          </li>
          <li>
            Puedes ver tus pronósticos en dos vistas: <strong>por grupo</strong> o <strong>por fecha</strong>.
          </li>
          <li>
            Cuando un partido se cierra (15 min antes), aparece la opción de <strong>ver los pronósticos de toda la polla</strong> para ese partido.
          </li>
          <li>
            El <strong>ranking se actualiza automáticamente</strong> cuando se cargan los resultados oficiales — no necesitas refrescar la página.
          </li>
        </ul>
      </section>

      <div className="rules-footer">
        ⚽ <strong>¡Suerte!</strong> Que gane el que más sepa de fútbol… o el que tenga mejor olfato.
      </div>
    </div>
  );
}
