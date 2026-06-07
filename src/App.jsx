import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Header from './components/Header.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MyPools from './pages/MyPools.jsx';
import CreatePool from './pages/CreatePool.jsx';
import JoinPool from './pages/JoinPool.jsx';
import PoolView from './pages/PoolView.jsx';
import AdminPage from './pages/AdminPage.jsx';

function NotFound() {
  return (
    <div className="container cnj-page" style={{ textAlign: 'center' }}>
      <h1 className="title-main">404</h1>
      <p className="subtitle">Esa ruta no existe.</p>
      <a href="/" className="btn btn-ghost">Volver al inicio</a>
    </div>
  );
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="cnj-loading">
        <div className="cnj-spinner" />
        <span>Cargando…</span>
      </div>
    );
  }
  return user ? <MyPools /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="app-shell">
          <div className="bg-orbs" />
          <div className="bg-noise" />
          <Header />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />

              <Route path="/crear-polla" element={
                <RequireAuth><CreatePool /></RequireAuth>
              } />
              <Route path="/unirse" element={
                <RequireAuth><JoinPool /></RequireAuth>
              } />
              <Route path="/unirse/:codigo" element={
                <RequireAuth><JoinPool /></RequireAuth>
              } />
              <Route path="/polla/:pollaId" element={
                <RequireAuth><PoolView /></RequireAuth>
              } />
              <Route path="/admin" element={
                <RequireAuth><AdminPage /></RequireAuth>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
