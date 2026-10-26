import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Products from './pages/Products';
import Orders from './pages/Orders';
import POS from './pages/POS';
import Settings from './pages/Settings';
import { Help } from './pages/Simple';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import { useStore } from './store';
import { useRole } from './hooks/useRole';
import LockScreen from './components/LockScreen';

function useTheme() {
  const theme = useStore((s) => s.settings.theme);
  const lang = useStore((s) => s.settings.lang);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches));
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
}

export default function App() {
  useTheme();
  const role = useRole();
  if (!role) return <LockScreen />;
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="pos" element={<POS />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="sales" element={<Sales />} />
          <Route path="customers" element={<Customers />} />
          <Route path="payments" element={<Payments />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
