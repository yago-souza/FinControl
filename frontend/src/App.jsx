import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, CalendarDays, TrendingUp, BookOpen, Wallet, Tags, ArrowRightLeft, LogOut, Loader2, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Instrucoes from './pages/Instrucoes';
import Faturas from './pages/Faturas';
import GastosFixos from './pages/GastosFixos';
import Cartoes from './pages/Cartoes';
import Dashboard from './pages/Dashboard';
import Categorias from './pages/Categorias';
import Investimentos from './pages/Investimentos';
import DividasRecebiveis from './pages/DividasRecebiveis';
import Login from './pages/Login';
import Register from './pages/Register';

const SidebarItem = ({ to, icon: Icon, onClick, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <Icon size={20} />
      <span className="font-medium">{children}</span>
    </Link>
  );
};

function PrivateLayout() {
  const { user, loading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 font-medium">Carregando painel financeiro...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-xs md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100 md:border-none shrink-0">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <LayoutDashboard /> FinControl
          </h1>
          {/* Close button on mobile drawer header */}
          <button
            onClick={closeSidebar}
            className="p-1.5 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          <SidebarItem to="/" icon={LayoutDashboard} onClick={closeSidebar}>Dashboard</SidebarItem>
          <SidebarItem to="/cartoes" icon={Wallet} onClick={closeSidebar}>Cartões</SidebarItem>
          <SidebarItem to="/faturas" icon={CreditCard} onClick={closeSidebar}>Faturas</SidebarItem>
          <SidebarItem to="/gastos-fixos" icon={CalendarDays} onClick={closeSidebar}>Gastos Fixos</SidebarItem>
          <SidebarItem to="/dividas-recebiveis" icon={ArrowRightLeft} onClick={closeSidebar}>Dívidas & Recebíveis</SidebarItem>
          <SidebarItem to="/categorias" icon={Tags} onClick={closeSidebar}>Categorias</SidebarItem>
          <SidebarItem to="/investimentos" icon={TrendingUp} onClick={closeSidebar}>Investimentos</SidebarItem>
          <SidebarItem to="/instrucoes" icon={BookOpen} onClick={closeSidebar}>Instruções</SidebarItem>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
            >
              <Menu size={24} />
            </button>
            <div className="text-gray-700 font-medium hidden sm:block">
              Olá, <span className="font-semibold text-blue-600">{user?.nome}</span>! 👋
            </div>
            <div className="text-gray-700 font-medium sm:hidden">
              Olá, <span className="font-semibold text-blue-600">{user?.nome.split(' ')[0]}</span>! 👋
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50/50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cartoes" element={<Cartoes />} />
            <Route path="/faturas" element={<Faturas />} />
            <Route path="/gastos-fixos" element={<GastosFixos />} />
            <Route path="/dividas-recebiveis" element={<DividasRecebiveis />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/investimentos" element={<Investimentos />} />
            <Route path="/instrucoes" element={<Instrucoes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 font-medium">Carregando...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/*" element={<PrivateLayout />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
