import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Manager from './pages/Manager';
import Waiter from './pages/Waiter';
import Home from './pages/Home';
import Login from './pages/Login';
import { api } from './services/api';

export default function App() {
  const [userRole, setUserRole] = useState<'admin' | 'waiter' | null>(null);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('pos_role') as 'admin' | 'waiter' | null;
    const loginTime = localStorage.getItem('pos_login_time');

    // Check if login was from today
    let isToday = false;
    if (loginTime) {
      const loginDate = new Date(parseInt(loginTime));
      const today = new Date();
      isToday = loginDate.toDateString() === today.toDateString();
    }

    if ((role === 'admin' || role === 'waiter') && isToday) {
      setUserRole(role);
    } else {
      // Force logout if not today or no login time
      handleLogout();
    }
  }, []);

  const handleLogin = async (pin: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const result = await api.loginWithPin(pin);
      if (result.success) {
        setUserRole(result.role);
        localStorage.setItem('pos_role', result.role);
        localStorage.setItem('pos_employee_name', result.name);
        localStorage.setItem('pos_login_time', Date.now().toString());
        setLoginError('');
      } else {
        setLoginError(result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Erro de conexão ao validar o PIN.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    }
    setUserRole(null);
    localStorage.removeItem('pos_role');
    localStorage.removeItem('pos_employee_name');
    localStorage.removeItem('pos_login_time');
  };

  if (!userRole) {
    return <Login onLogin={handleLogin} error={loginError} isLoading={isLoggingIn} />;
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
