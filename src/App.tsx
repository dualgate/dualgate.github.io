import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import LoginPage from '@/pages/LoginPage';
import VerifyPage from '@/pages/VerifyPage';
import DashboardPage from '@/pages/DashboardPage';

export default function App() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const token = api.loadToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate token by trying to fetch devices
    api
      .getPersonalDevices()
      .then(() => {
        const saved = localStorage.getItem('admin_user');
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          setUser({ email: '' });
        }
      })
      .catch(() => {
        api.clearToken();
        localStorage.removeItem('admin_user');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => {
      showToast('Session expired. Please log in again.');
      setUser(null);
      localStorage.removeItem('admin_user');
      navigate('/', { replace: true });
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, [showToast, navigate]);

  const handleLogin = (email: string, token: string) => {
    api.setToken(token);
    const u = { email };
    setUser(u);
    localStorage.setItem('admin_user', JSON.stringify(u));
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    api.clearToken();
    localStorage.removeItem('admin_user');
    setUser(null);
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/verify"
          element={
            user ? <Navigate to="/dashboard" replace /> : <VerifyPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? <DashboardPage onLogout={handleLogout} /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
