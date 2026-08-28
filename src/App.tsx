import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Manager from './pages/Manager';
import Waiter from './pages/Waiter';
import Home from './pages/Home';
import Login from './pages/Login';
import Menu from './pages/Menu';
import DigitalMenu from './pages/DigitalMenu';
import MenuConfig from './pages/MenuConfig';
import PrintQueue from './pages/PrintQueue';
import { api } from './services/api';

export default function App() {
  const [userRole, setUserRole] = useState<'admin' | 'waiter' | 'employee' | null>(null);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [requiresForceAuthPin, setRequiresForceAuthPin] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('pos_role') as 'admin' | 'waiter' | 'employee' | null;
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

      // Initialize activity time if missing
      if (!localStorage.getItem('pos_last_activity')) {
        localStorage.setItem('pos_last_activity', Date.now().toString());
      }

      const updateActivity = () => {
        localStorage.setItem('pos_last_activity', Date.now().toString());
      };

      // Listen to interactions
      window.addEventListener('click', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('touchstart', updateActivity);

      // Check inactivity every minute (3 hours = 10800000 ms)
      const INACTIVITY_LIMIT_MS = 3 * 60 * 60 * 1000;
      const inactivityInterval = setInterval(() => {
        const lastActivity = parseInt(localStorage.getItem('pos_last_activity') || Date.now().toString());
        if (Date.now() - lastActivity > INACTIVITY_LIMIT_MS) {
          handleLogout();
          alert("Sessão expirada por inatividade (mais de 3 horas). Por favor, faça login novamente.");
        }
      }, 60000);

      // Subscribe to eviction
      const unsubscribe = api.subscribeToEviction(employeeId, deviceId, () => {
        setLoginError('Sua sessão foi encerrada porque este usuário conectou em outro dispositivo.');
        handleLogout();
      });
      return () => {
        unsubscribe();
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('keydown', updateActivity);
        window.removeEventListener('touchstart', updateActivity);
        clearInterval(inactivityInterval);
      };
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
    localStorage.removeItem('pos_last_activity');
  };

  // Define route protection component
  const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (userRole !== 'admin') {
      return <Navigate to="/waiter" replace />;
    }
    return <>{children}</>;
  };

  const ProtectedApp = () => {
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

    return (
      <Routes>
        <Route path="/" element={<Home onLogout={handleLogout} />} />
        <Route
          path="/manager/*"
          element={
            <ProtectedAdminRoute>
              <Manager />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/waiter/*" element={<Waiter />} />
        <Route path="/print" element={<PrintQueue />} />
        <Route path="/menu-config" element={<ProtectedAdminRoute><MenuConfig /></ProtectedAdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública do Cardápio Digital (Acessível via QR Code) */}
        <Route path="/menu" element={<Menu />} />
        <Route path="/cardapio" element={<DigitalMenu />} />
        
        {/* Todas as outras rotas são protegidas pelo PIN */}
        <Route path="*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}

