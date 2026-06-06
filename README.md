# Coffee'n Jesus Chickengirl

Polla del Mundial 2026 — construida con Vite + React + Firebase, deploy en Vercel.

---

## 📦 Entrega 1 — Estructura base + Fixture oficial

Esta entrega monta el esqueleto del proyecto, conecta con Firebase y precarga los datos del Mundial 2026:

- **48 selecciones** (Grupos A a L)
- **72 partidos de fase de grupos** con horarios Colombia y sedes
- **32 partidos de eliminatorias** (Dieciseisavos, Octavos, Cuartos, Semis, **3er puesto**, Final)
- **Branding** Pantone 2567 U (lavanda) + 7471 U (turquesa) sobre fondo oscuro
- **Router** listo para links de invitación

El App.jsx actual es una **landing diagnóstica** — confirma que Firebase está bien conectado y los datos cargados. Las pantallas reales (auth, pollas, pronósticos, ranking, admin) vienen en las Entregas 2, 3 y 4.

---

## 🚀 Cómo desplegar esta entrega

### 1. Sobrescribe el repo

Reemplaza el contenido de tu repo `Polla-coffee-friends` con los archivos de esta carpeta. No necesitas borrar el repo en GitHub: simplemente sobrescribe los archivos en tu rama.

Recomendación: trabaja en una rama nueva en vez de pisar `main` directo.

```bash
git checkout -b entrega-1
# Copia todos los archivos de esta carpeta a la raíz del repo
git add .
git commit -m "Entrega 1: estructura base + fixture oficial Mundial 2026"
git push origin entrega-1
```

Vercel te creará automáticamente un preview en una URL tipo `polla-coffee-friends-git-entrega-1-...vercel.app`. Pruébalo ahí antes de pasar a `main`.

### 2. Configura Firebase

En tu proyecto de Firebase Console:

**a) Habilitar Authentication**
- Authentication → Sign-in method → Email/Password → Enable

**b) Habilitar Firestore Database**
- Build → Firestore Database → Create database → modo **Production**
- Ubicación: la que prefieras (recomendado: `southamerica-east1` para latencia desde Colombia)

**c) Subir las reglas de seguridad**
- Firestore → Rules → pega el contenido de `firestore.rules` → Publish

### 3. Configura las variables de entorno en Vercel

Ve a tu proyecto en Vercel → **Settings → Environment Variables** y agrega/verifica:

| Variable | De dónde sacarla |
|----------|------------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project settings → General → Your apps → SDK setup |
| `VITE_FIREBASE_AUTH_DOMAIN` | mismo lugar |
| `VITE_FIREBASE_PROJECT_ID` | mismo lugar |
| `VITE_FIREBASE_STORAGE_BUCKET` | mismo lugar |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | mismo lugar |
| `VITE_FIREBASE_APP_ID` | mismo lugar |
| `VITE_FIREBASE_MEASUREMENT_ID` | (opcional, solo si tienes Analytics) |
| `VITE_SUPERADMIN_EMAIL` | tu correo con el que te vas a registrar como super-admin |

Aplica todas a los **3 environments** (Production, Preview, Development).

Después de agregar variables, debes **re-deployar**: Vercel → Deployments → último deploy → ⋯ → Redeploy.

### 4. Verifica en el preview

Abre la URL del preview de Vercel. Deberías ver la landing con todos los checks en verde:

- ✓ Config de Firebase
- ✓ Conexión a Firestore
- ✓ Super-admin configurado
- ✓ 48 selecciones cargadas
- ✓ 72 partidos de grupos
- ✓ 32 partidos eliminatorias

Si algo aparece en rojo, revisa las variables de entorno y vuelve a re-deployar.

### 5. Mergeas a `main`

Cuando todo esté verde, mergeas la rama a `main` y Vercel reflejará el cambio en producción.

---

## 🗺️ Roadmap

- **Entrega 1** (esta) — Estructura base + fixture oficial ✓
- **Entrega 2** — Auth (login/registro), crear pollas, unirse con código de invitación, listado "mis pollas"
- **Entrega 3** — Pronósticos por grupo, bracket completo, ranking dentro de cada polla, perfil
- **Entrega 4** — Panel super-admin (cargar resultados oficiales), reglas de seguridad finas, testing

---

## 🛠️ Desarrollo local

```bash
npm install
cp .env.example .env.local
# rellena .env.local con tus credenciales de Firebase
npm run dev
```

Abre `http://localhost:5173`.

---

## 🎨 Branding

- **Primario:** Pantone 2567 U → `#C09FDB` (lavanda)
- **Acento:** Pantone 7471 U → `#7FE2D8` (turquesa)
- **Fondo:** `#0a0612` (negro púrpura profundo)
- **Tipografía display:** Bebas Neue
- **Tipografía cuerpo:** Outfit

---

## 📁 Estructura del proyecto

```
.
├── index.html
├── package.json
├── vite.config.js
├── firestore.rules
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── main.jsx              # entry point, monta BrowserRouter
    ├── App.jsx               # landing diagnóstica (Entrega 1)
    ├── firebase.js           # init de Firebase desde env vars
    ├── styles/
    │   └── globals.css       # estilos + branding Pantone
    └── data/
        ├── teams.js          # 48 selecciones
        ├── groupMatches.js   # 72 partidos de grupos
        └── knockoutTemplate.js  # 32 partidos eliminatorias
```
