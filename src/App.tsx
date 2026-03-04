import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Manager from './pages/Manager';
import Waiter from './pages/Waiter';
import Home from './pages/Home';
import Login from './pages/Login';

// Default PINs if no environment variable is set
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '123456';
const WAITER_PIN = import.meta.env.VITE_WAITER_PIN || '999999';

export default function App() {
  const [userRole, setUserRole] = useState<'admin' | 'waiter' | null>(null);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('pos_role') as 'admin' | 'waiter' | null;
    if (role === 'admin' || role === 'waiter') {
      setUserRole(role);
    }
  }, []);

  const handleLogin = (pin: string) => {
    if (pin === ADMIN_PIN) {
      setUserRole('admin');
      localStorage.setItem('pos_role', 'admin');
      setLoginError('');
    } else if (pin === WAITER_PIN) {
      setUserRole('waiter');
      localStorage.setItem('pos_role', 'waiter');
      setLoginError('');
    } else {
      setLoginError('PIN incorreto ou não autorizado. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('pos_role');
  };

  if (!userRole) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  // Define route protection component
  const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (userRole !== 'admin') {
      return <Navigate to="/waiter" replace />;
    }
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      {/* 
        Optional: We could add a global logout button somewhere, 
        but usually it's placed inside the Manager/Waiter header. 
        For now, the roles are fully protecting the routes.
      */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/manager/*"
          element={
            <ProtectedAdminRoute>
              <Manager />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/waiter/*" element={<Waiter />} />
      </Routes>
    </BrowserRouter>
  );
}
