import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Manager from './pages/Manager';
import Waiter from './pages/Waiter';
import Home from './pages/Home';

export default function App() {
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
