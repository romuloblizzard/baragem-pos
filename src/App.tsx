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
  const [requiresForceAuthPin, setRequiresForceAuthPin] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('pos_role') as 'admin' | 'waiter' | null;
    const loginTime = localStorage.getItem('pos_login_time');
    const employeeId = localStorage.getItem('pos_employee_id');
    const deviceId = localStorage.getItem('pos_device_id');

    // Check if login was from today
    let isToday = false;
    if (loginTime) {
      const loginDate = new Date(parseInt(loginTime));
      const today = new Date();
      isToday = loginDate.toDateString() === today.toDateString();
    }

    if ((role === 'admin' || role === 'waiter') && isToday && employeeId && deviceId) {
      setUserRole(role);

      // Subscribe to eviction
      const unsubscribe = api.subscribeToEviction(employeeId, deviceId, () => {
        setLoginError('Sua sessão foi encerrada porque este usuário conectou em outro dispositivo.');
        handleLogout();
      });
      return () => unsubscribe();
    } else {
      // Force logout if not today or no login time
      handleLogout();
    }
  }, [userRole]);

  const handleLogin = async (pin: string, force: boolean = false) => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const result = await api.loginWithPin(pin, force);
      if (result.success) {
        localStorage.setItem('pos_role', result.role);
        localStorage.setItem('pos_employee_name', result.name);
        localStorage.setItem('pos_employee_id', result.employee_id);
        localStorage.setItem('pos_login_time', Date.now().toString());
        setRequiresForceAuthPin(null);
        setLoginError('');
        setUserRole(result.role);
      } else if (result.requiresForce) {
        setRequiresForceAuthPin(pin);
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
      const employeeId = localStorage.getItem('pos_employee_id');
      await api.logout(employeeId || undefined);
    } catch (e) {
      console.error(e);
    }
    setUserRole(null);
    localStorage.removeItem('pos_role');
    localStorage.removeItem('pos_employee_name');
    localStorage.removeItem('pos_login_time');
    localStorage.removeItem('pos_employee_id');
  };

  if (!userRole) {
    return (
      <Login
        onLogin={handleLogin}
        error={loginError}
        isLoading={isLoggingIn}
        requiresForcePin={requiresForceAuthPin}
        onCancelForce={() => {
          setRequiresForceAuthPin(null);
          setLoginError('');
        }}
      />
    );
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
