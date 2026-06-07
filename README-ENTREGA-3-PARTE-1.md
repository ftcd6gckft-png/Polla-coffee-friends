# Entrega 3 — Parte 1 · Pronósticos de fase de grupos

## ¿Qué cambia respecto a la Entrega 2?

La vista interna de polla (`/polla/:pollaId`) ya no es un placeholder. Ahora tiene **pestañas funcionales**, y la pestaña de **Fase de grupos** está completa:

- ✅ 72 partidos navegables por grupo (A–L)
- ✅ Inputs de marcador con autoguardado (debounced 500ms)
- ✅ **Lock automático T-15 minutos** antes del kickoff (zona horaria Colombia)
- ✅ Estado visual: abierto · cerrado · con resultado oficial
- ✅ Cálculo de puntos por partido cuando el super-admin carga resultados
- ✅ Header con stats (pronosticados / puntos / exactos / ganadores)
- ✅ Indicador de cuánto falta para el cierre de cada partido ("3d 19h", "12 min", etc.)
- ✅ Tiempo real: si el mismo usuario edita en otro dispositivo, ambos se sincronizan
- ✅ Las otras 3 pestañas (Bracket, Campeón, Ranking) muestran placeholder

## Cómo funciona el lock T-15

Cada partido tiene `date` (2026-06-11) y `time` (14:00) en **zona horaria Colombia (UTC-5)**.

La app calcula `kickoff_UTC - 15 minutos = lock_UTC` y lo compara con `Date.now()`. Si el reloj actual está ≥ lock, los inputs se deshabilitan.

Un hook `useNow()` re-evalúa el lock cada 30 segundos, así que la UI cambia automáticamente sin que el usuario tenga que recargar.

**Importante:** la verificación es solo en cliente. Las reglas de Firestore aún permiten escribir pronósticos en cualquier momento. Esto es suficiente para una polla de amigos, pero si alguien manipula el cliente puede saltar el lock. En la Entrega 4 agregaremos validación server-side si lo necesitas.

## Archivos nuevos/modificados

```
src/
├── main.jsx                          ← MODIFICADO (importa entrega-3.css)
├── components/
│   ├── MatchPredictionCard.jsx       ← NUEVO
│   ├── GroupSelector.jsx             ← NUEVO
│   └── GroupPredictionsTab.jsx       ← NUEVO
├── hooks/
│   └── useNow.js                     ← NUEVO
├── lib/
│   ├── time.js                       ← NUEVO (lock, kickoff, formato)
│   ├── scoring.js                    ← NUEVO (puntos 3/1/0)
│   └── predictions.js                ← NUEVO (Firestore helpers)
├── pages/
│   └── PoolView.jsx                  ← REEMPLAZADO (pestañas funcionales)
└── styles/
    └── entrega-3.css                 ← NUEVO

firestore.rules                       ← REEMPLAZADO (agrega predictions y officialResults)
```

## Pasos para deployar

### 1. Sube los archivos al repo

Rama nueva, no pises `main` directo. Asegúrate de **mantener la estructura `src/...`**.

### 2. Actualiza las reglas de Firestore

⚠️ **Importante:** las nuevas reglas incluyen un check de super-admin **hardcoded con tu email**:

```js
function isSuperAdmin() {
  return request.auth != null
    && request.auth.token.email == 'camilocasteblanco93@gmail.com';
}
```

Si tu email super-admin es otro, **edita esa línea antes de publicar las reglas**. Si es el correcto, déjalo así.

Pega el contenido de `firestore.rules` en Firebase Console → Firestore → Rules → Publish.

### 3. Verifica el deploy

Después del merge a `main` y el re-deploy de Vercel:

1. Abre tu polla → pestaña "Fase de grupos".
2. Selecciona Grupo A.
3. Deberías ver 6 partidos (México vs Sudáfrica, etc.) con inputs habilitados.
4. Ingresa un marcador → debería autoguardar (verás "✓ Guardado" en gris-verde por un segundo).
5. Refresca la página → tu pronóstico debe seguir ahí.
6. Navega entre grupos (A, B, C…). El contador `N/6` se actualiza.

## Cosas a probar

- **Lock en tiempo real:** edita un partido. Como junio 2026 está lejos, todos están abiertos. Para probar el lock, puedes mover el reloj del sistema temporalmente o esperar a junio.
- **Tiempo real entre dispositivos:** abre tu polla en dos pestañas/dispositivos con el mismo usuario. Edita en una y verás el cambio en la otra (suscripción en vivo via `onSnapshot`).
- **Pronósticos por polla:** crea 2 pollas distintas, entra a cada una y verifica que los pronósticos son independientes (un usuario puede tener marcadores diferentes en pollas diferentes).
- **Counter del header:** llena varios partidos y verás los contadores actualizándose en vivo.

## Estructura de Firestore que se crea

```
/pools/{pollId}/predictions/{userId}
  groupMatches: {
    G01: { home: 2, away: 1, updatedAt: timestamp },
    G02: { home: 0, away: 0, updatedAt: timestamp },
    ...
  }
  knockoutMatches: {}    ← (vacío por ahora, se llena en Parte 2)
  champion: null         ← (se llena en Parte 2)
  updatedAt: timestamp

/officialResults/groupMatches    ← un único documento
  G01: { home: 2, away: 1, status: "final" }
  G02: ...
```

## Lo que sigue (Entrega 3 Parte 2)

- Pestaña "Eliminatorias" → bracket completo con pronóstico de cruces (libre desde día 1, locked por partido cuando se conozcan los participantes — Opción C)
- Pestaña "Campeón" → selección entre 48 selecciones
- Pestaña "Ranking" → tabla de posiciones de la polla con cálculo en vivo
- **Panel de super-admin** → para cargar los resultados oficiales (sin esto, los puntos nunca se calculan)

## Notas

- El check de super-admin en las reglas es por email. Esto funciona pero tiene una limitación: si cambias tu email en Firebase, hay que actualizar las reglas. En la Entrega 4 podemos pasar a custom claims si quieres mayor robustez.
- Los pronósticos son **privados** por defecto: cada usuario solo ve los suyos. Después del lock, podríamos hacerlos públicos dentro de la polla si quieres que se vean los pronósticos ajenos. Avísame si lo prefieres así.
