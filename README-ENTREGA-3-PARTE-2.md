# Entrega 3 Parte 2 — La gran final 🏆

Con esta entrega, **la app está lista para todo el Mundial 2026**. Incluye:

- ✅ Pestaña **Bracket** funcional (las 6 fases eliminatorias incluyendo 3er puesto)
- ✅ Pestaña **Campeón** con grid de 48 selecciones
- ✅ Pestaña **Ranking** con cálculo en vivo y posiciones de la polla
- ✅ Panel **Super-Admin** completo (`/admin`):
  - Carga resultados de grupos
  - Configura los cruces de eliminatorias (asume Opción 1: tú defines manualmente)
  - Carga resultados de eliminatorias (con manejo de penales)
  - Define el campeón oficial
- ✅ **RankingUpdater** automático: cada vez que cambia un pronóstico o resultado, las stats del usuario se publican para el ranking sin tener que recargar nada

## Decisión asumida: Opción 1 para clasificados

Tú como super-admin determinas manualmente qué equipos pasan en cada cruce. La app no calcula automáticamente la clasificación de grupos (es la opción más simple y confiable).

**Flujo durante el Mundial:**
1. Vas cargando resultados de grupos conforme se juegan.
2. El 27 de junio, cuando termine la fase, vas a "Configurar bracket" y defines los 16 cruces de dieciseisavos seleccionando los equipos (1ros, 2dos y los 8 mejores 3ros).
3. Cargas resultados de dieciseisavos.
4. Configuras octavos con los ganadores reales.
5. Y así hasta la final.

Te toma ~5 minutos cada paso del bracket. **No hay forma más confiable** que esto.

## Archivos nuevos/modificados

```
src/
├── App.jsx                                ← MODIFICADO (ruta /admin)
├── main.jsx                               ← MODIFICADO (CSS extra)
├── components/
│   ├── Header.jsx                         ← MODIFICADO (link a /admin para super-admin)
│   ├── BracketTab.jsx                     ← NUEVO
│   ├── ChampionTab.jsx                    ← NUEVO
│   ├── RankingTab.jsx                     ← NUEVO
│   └── RankingUpdater.jsx                 ← NUEVO (componente invisible)
├── lib/
│   ├── predictionsExtended.js             ← NUEVO
│   └── scoringExtended.js                 ← NUEVO
├── pages/
│   ├── PoolView.jsx                       ← REEMPLAZADO (todas las pestañas)
│   └── AdminPage.jsx                      ← NUEVO
└── styles/
    └── entrega-3b.css                     ← NUEVO

firestore.rules                            ← REEMPLAZADO (agrega permisos para stats)
```

⚠️ **OJO:** Esta entrega NO incluye los archivos que ya están en tu repo (como `Landing.jsx`, `Login.jsx`, etc. — se conservan tal cual).

## Pasos para deployar

### 1. Sube los archivos al repo
Rama nueva (`entrega-3-parte-2`). Reemplaza/agrega los archivos manteniendo la estructura `src/`.

### 2. Actualiza las reglas de Firestore
**Importante:** las nuevas reglas agregan permisos para la subcolección `stats/{userId}` dentro de cada polla. Sin esto, el ranking no funciona porque los usuarios no podrán publicar sus stats.

Verifica que el email super-admin en línea 6 sea el correcto. Si es otro, edítalo.

### 3. Mergea y prueba
- Abre tu polla → recorre las 4 pestañas: grupos (ya funcionaba), Bracket (mostrará el mensaje "Bracket en espera" hasta que termine la fase de grupos), Campeón (puedes elegir ya), Ranking (te mostrará a ti con 0 puntos al inicio).
- Como super-admin, verás un botón **⚙ ADMIN** arriba a la derecha → te lleva a `/admin`.

### 4. Cargar un resultado de prueba
1. En `/admin` → "Resultados de grupos" → Grupo A → México vs Sudáfrica → marcador 2-1 → Guardar.
2. Vuelve a tu polla → pestaña Fase de grupos → Grupo A → verás "Resultado: 2-1" en ese partido.
3. Si tu pronóstico era ese exacto, verás "🎯 EXACTO · +3" — y en el ranking, tus puntos suben.

## Flujo del Mundial

**11 - 27 jun:** Cargas resultados de grupos. La app calcula puntos en vivo.

**27 jun (después del último partido):**
1. Vas a `/admin` → "Configurar bracket" → "Dieciseisavos".
2. Para cada uno de los 16 partidos, seleccionas los dos equipos que tú determinaste pasaron.
3. Los miembros de cada polla pueden pronosticar marcadores.

**28 jun - 3 jul (dieciseisavos):**
- Cargas resultados con marcador de 90 min.
- Si va a penales, seleccionas quién pasó.

**4-7 jul (octavos):** Configuras los cruces con los ganadores, luego cargas resultados. Y así con cada fase.

**18 jul:** 3er puesto. **19 jul:** Final. Cargas el campeón en "Campeón oficial" → todos los que acertaron suman +5 pts.

## Sistema de puntos

| Acierto | Puntos |
|---------|--------|
| Marcador exacto (grupos o eliminatorias 90 min) | **3 pts** |
| Acierto del ganador (incluido empate) | **1 pt** |
| Acertar el campeón | **+5 pts** al cierre |

**Eliminatorias:** solo puntúa si acertaste **AMBOS equipos** del cruce. Si pronosticaste Argentina vs Brasil pero juegan Argentina vs Francia, ese partido vale 0 aunque hayas acertado el marcador.

## Limitaciones conocidas (intencionales para no sobreingeniería)

- El lock T-15 es solo en cliente. Si alguien manipula la app, puede pronosticar tarde. Para una polla de amigos es suficiente.
- El ranking depende de que cada usuario abra la app al menos una vez después de que se carguen resultados (porque su stats se calculan en cliente). Si alguien nunca abre la app, sus puntos no se actualizan.
- Los pronósticos siguen siendo privados. Si quieres que se vean los pronósticos ajenos después del lock, házmelo saber.

## ¡Listo para el Mundial!

Si todo deploya bien y pruebas el flujo completo, **estás 100% listo para el 11 de junio**.

Quedan cosas menores que podríamos agregar después si las quieres:
- Verificación de email
- Recuperar contraseña
- Borrar pollas / sacar miembros
- Pronósticos visibles a otros miembros después del lock
- Notificaciones push antes del kickoff
- Estadísticas más detalladas (mejor grupo, mejor fase, etc.)

Nada de eso es bloqueante. La app ya hace todo lo importante.

🎉
