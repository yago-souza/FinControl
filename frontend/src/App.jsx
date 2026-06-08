import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, CalendarDays, TrendingUp, BookOpen } from 'lucide-react';
import Instrucoes from './pages/Instrucoes';
import Faturas from './pages/Faturas';
import GastosFixos from './pages/GastosFixos';

// Placeholder Pages
const Dashboard = () => <div className="p-6"><h2 className="text-2xl font-bold mb-4">Dashboard</h2><p>Resumo financeiro do mês.</p></div>;
const Investimentos = () => <div className="p-6"><h2 className="text-2xl font-bold mb-4">Investimentos</h2><p>Acompanhamento de aportes mensais.</p></div>;

const SidebarItem = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <Icon size={20} />
      <span className="font-medium">{children}</span>
    </Link>
  );
};

function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <LayoutDashboard /> FinControl
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem to="/" icon={LayoutDashboard}>Dashboard</SidebarItem>
          <SidebarItem to="/faturas" icon={CreditCard}>Faturas</SidebarItem>
          <SidebarItem to="/gastos-fixos" icon={CalendarDays}>Gastos Fixos</SidebarItem>
          <SidebarItem to="/investimentos" icon={TrendingUp}>Investimentos</SidebarItem>
          <SidebarItem to="/instrucoes" icon={BookOpen}>Instruções</SidebarItem>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/faturas" element={<Faturas />} />
          <Route path="/gastos-fixos" element={<GastosFixos />} />
          <Route path="/investimentos" element={<Investimentos />} />
          <Route path="/instrucoes" element={<Instrucoes />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
