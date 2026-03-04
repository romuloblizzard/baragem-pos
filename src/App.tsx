import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Manager from './pages/Manager';
import Waiter from './pages/Waiter';
import Home from './pages/Home';
import Login from './pages/Login';

// Default to 123456 if no environment variable is set
const APP_PIN = import.meta.env.VITE_APP_PIN || '123456';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('pos_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (pin: string) => {
    if (pin === APP_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem('pos_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('PIN incorreto. Tente novamente.');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manager/*" element={<Manager />} />
        <Route path="/waiter/*" element={<Waiter />} />
      </Routes>
    </BrowserRouter>
  );
}
