# Entrega 2 — Auth + Pollas con código de invitación

## ¿Qué cambia respecto a la Entrega 1?

La landing diagnóstica se reemplaza por la app de verdad. Ahora puedes:

- **Crear cuenta** y **iniciar sesión** (Firebase Auth con email/contraseña)
- **Crear pollas** independientes (eres admin de las que tú creas)
- **Invitar a otros** con un código tipo `MUNDIAL-X7K2` o un link directo
- **Unirte a una polla** pegando el código o entrando por el link
- **Ver tu lista** de pollas en `/`
- **Entrar a una polla** específica (la vista interna es placeholder — se llena en Entrega 3)

Límite: **50 miembros por polla** (validado a nivel transacción para evitar race conditions).

## Archivos nuevos y modificados

```
src/
├── App.jsx                   ← REEMPLAZADO (rutas completas)
├── main.jsx                  ← MODIFICADO (importa nuevo CSS)
├── components/
│   ├── Header.jsx            ← NUEVO
│   ├── Toast.jsx             ← NUEVO
│   └── RequireAuth.jsx       ← NUEVO
├── context/
│   └── AuthContext.jsx       ← NUEVO
├── lib/
│   ├── inviteCodes.js        ← NUEVO
│   └── pools.js              ← NUEVO
├── pages/
│   ├── Landing.jsx           ← NUEVO (reemplaza la landing diagnóstica)
│   ├── Login.jsx             ← NUEVO
│   ├── Register.jsx          ← NUEVO
│   ├── MyPools.jsx           ← NUEVO
│   ├── CreatePool.jsx        ← NUEVO
│   ├── JoinPool.jsx          ← NUEVO
│   └── PoolView.jsx          ← NUEVO (placeholder, Entrega 3 lo completa)
└── styles/
    └── entrega-2.css         ← NUEVO (no toques globals.css)

firestore.rules               ← REEMPLAZADO (reglas más finas)
```

## Pasos para deployar

### 1. Sube los archivos al repo (rama nueva o directo a `main`)

Trabaja en una rama nueva para previsualizar antes de pisar producción:

```bash
git checkout -b entrega-2
# Copia los archivos nuevos de esta carpeta a su sitio correspondiente
git add .
git commit -m "Entrega 2: auth + pollas con código de invitación"
git push origin entrega-2
```

Vercel te genera un preview automático. Pruébalo antes de mergear a `main`.

### 2. Actualiza las reglas de Firestore

En Firebase Console:
1. Firestore Database → pestaña **Rules**
2. Borra todo y pega el contenido de `firestore.rules`
3. Click **Publish**

**Importante:** sin actualizar las reglas, las operaciones de crear polla/unirse van a fallar con `permission-denied`.

### 3. Asegúrate de que Authentication está habilitado

Firebase Console → Authentication → Sign-in method → Email/Password debe estar **enabled**.

### 4. Prueba el flujo completo

1. Abre la URL de Vercel (preview o producción).
2. Haz click en **"Crear mi cuenta"** y regístrate con un correo (puede ser el de super-admin).
3. Tras registrarte, te lleva a **"Mis pollas"**.
4. Click en **"+ Crear polla nueva"**, ponle un nombre.
5. Te muestra el código generado y el link de invitación. Cópialo.
6. **Abre el link en una ventana de incógnito** (simula otro usuario).
7. Te pedirá registrarte/loguearte. Crea una segunda cuenta.
8. Al loguear, te llevará automáticamente al preview de la polla.
9. Click en **"Unirme"** y deberías entrar.
10. Vuelve a la primera cuenta y verifica que ahora la polla tiene 2 miembros.

## Estructura de Firestore que se crea

```
/users/{uid}
  email: string
  displayName: string
  pools: string[]      ← IDs de las pollas a las que pertenece
  createdAt: timestamp

/pools/{pollId}
  name: string
  code: string         ← MUNDIAL-XXXX
  adminUid: string     ← uid del creador
  adminDisplayName: string
  members: string[]    ← uids de todos los miembros (incluye al admin)
  memberCount: number  ← redundante con members.length, sirve para queries
  createdAt: timestamp

/inviteCodes/{code}    ← código es la clave del documento
  pollId: string       ← apunta al doc de la polla
  createdAt: timestamp
```

## Lo que sigue (Entrega 3)

- Pronósticos por grupo (los 72 partidos)
- Bracket completo de eliminatorias (incluye 3er puesto y final)
- Pronóstico de campeón
- Ranking de la polla (suma puntos según pronósticos vs resultados)

## Notas de seguridad

Las reglas de esta entrega son **intermedias**: protegen lo básico (los datos del usuario A no son visibles para el usuario B, salvo en pollas comunes), pero todavía permiten algunas operaciones que en producción real querríamos restringir más. Lo refinaremos en la Entrega 4 con super-admin global y validaciones de límites en el servidor.
