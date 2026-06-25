import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Target, 
  TrendingUp, 
  Layers, 
  Calendar, 
  DollarSign,
  Info,
  ChevronRight,
  PieChart,
  BarChart4
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

const API_URL_INVESTIMENTOS = 'http://localhost:8080/api/investimentos';
const API_URL_CAIXINHAS = 'http://localhost:8080/api/caixinhas';

const COLORS_PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#6366f1'];

export default function Investimentos() {
  const [investimentos, setInvestimentos] = useState([]);
  const [caixinhas, setCaixinhas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Caixinha Form State
  const [showCaixinhaModal, setShowCaixinhaModal] = useState(false);
  const [editingCaixinhaId, setEditingCaixinhaId] = useState(null);
  const [caixinhaForm, setCaixinhaForm] = useState({ nome: '' });

  // Aporte Form State
  const [showAporteModal, setShowAporteModal] = useState(false);
  const [editingAporteId, setEditingAporteId] = useState(null);
  const [aporteForm, setAporteForm] = useState({
    tipo: 'RENDA_FIXA',
    valor: '',
    data: '',
    tipoPrazo: 'CURTO_PRAZO',
    caixinhaId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resInv, resCx] = await Promise.all([
        axios.get(API_URL_INVESTIMENTOS),
        axios.get(API_URL_CAIXINHAS)
      ]);
      setInvestimentos(resInv.data);
      setCaixinhas(resCx.data);
    } catch (err) {
      console.error('Erro ao buscar dados de investimentos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Caixinhas CRUD
  const handleOpenCreateCaixinha = () => {
    setEditingCaixinhaId(null);
    setCaixinhaForm({ nome: '' });
    setShowCaixinhaModal(true);
  };

  const handleOpenEditCaixinha = (c) => {
    setEditingCaixinhaId(c.id);
    setCaixinhaForm({ nome: c.nome });
    setShowCaixinhaModal(true);
  };

  const handleSaveCaixinha = async (e) => {
    e.preventDefault();
    if (!caixinhaForm.nome) return;

    try {
      if (editingCaixinhaId) {
        await axios.put(`${API_URL_CAIXINHAS}/${editingCaixinhaId}`, caixinhaForm);
      } else {
        await axios.post(API_URL_CAIXINHAS, caixinhaForm);
      }
      setShowCaixinhaModal(false);
      fetchData();
    } catch (err) {
      console.error('Erro ao salvar caixinha:', err);
    }
  };

  const handleDeleteCaixinha = async (id) => {
    if (!confirm('Deseja realmente excluir esta caixinha? Todos os aportes associados serão desvinculados.')) return;
    try {
      await axios.delete(`${API_URL_CAIXINHAS}/${id}`);
      fetchData();
    } catch (err) {
      console.error('Erro ao excluir caixinha:', err);
    }
  };

  // Aportes CRUD
  const handleOpenCreateAporte = () => {
    setEditingAporteId(null);
    setAporteForm({
      tipo: 'RENDA_FIXA',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      tipoPrazo: 'CURTO_PRAZO',
      caixinhaId: '',
    });
    setShowAporteModal(true);
  };

  const handleOpenEditAporte = (a) => {
    setEditingAporteId(a.id);
    setAporteForm({
      tipo: a.tipo,
      valor: a.valor,
      data: a.data,
      tipoPrazo: a.tipoPrazo || 'CURTO_PRAZO',
      caixinhaId: a.caixinha ? a.caixinha.id.toString() : '',
    });
    setShowAporteModal(true);
  };

  const handleSaveAporte = async (e) => {
    e.preventDefault();
    if (!aporteForm.valor || !aporteForm.data) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      tipo: aporteForm.tipo,
      valor: parseFloat(aporteForm.valor),
      data: aporteForm.data,
      tipoPrazo: aporteForm.tipoPrazo,
      caixinha: aporteForm.caixinhaId ? { id: parseInt(aporteForm.caixinhaId) } : null,
    };

    try {
      if (editingAporteId) {
        await axios.put(`${API_URL_INVESTIMENTOS}/${editingAporteId}`, payload);
      } else {
        await axios.post(API_URL_INVESTIMENTOS, payload);
      }
      setShowAporteModal(false);
      fetchData();
    } catch (err) {
      console.error('Erro ao salvar aporte:', err);
    }
  };

  const handleDeleteAporte = async (id) => {
    if (!confirm('Deseja realmente excluir este aporte?')) return;
    try {
      await axios.delete(`${API_URL_INVESTIMENTOS}/${id}`);
      fetchData();
    } catch (err) {
      console.error('Erro ao excluir aporte:', err);
    }
  };

  // Helper Formatters
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getPrazoLabel = (p) => {
    switch (p) {
      case 'CURTO_PRAZO': return 'Curto Prazo';
      case 'MEDIO_PRAZO': return 'Médio Prazo';
      case 'LONGO_PRAZO': return 'Longo Prazo';
      default: return 'Não Especificado';
    }
  };

  const getPrazoBadgeColor = (p) => {
    switch (p) {
      case 'CURTO_PRAZO': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
      case 'MEDIO_PRAZO': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'LONGO_PRAZO': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  // Calculations for summaries
  const totalInvestido = investimentos.reduce((sum, a) => sum + (a.valor || 0), 0);
  
  const totalCurto = investimentos.filter(a => a.tipoPrazo === 'CURTO_PRAZO').reduce((sum, a) => sum + (a.valor || 0), 0);
  const totalMedio = investimentos.filter(a => a.tipoPrazo === 'MEDIO_PRAZO').reduce((sum, a) => sum + (a.valor || 0), 0);
  const totalLongo = investimentos.filter(a => a.tipoPrazo === 'LONGO_PRAZO').reduce((sum, a) => sum + (a.valor || 0), 0);

  // Group by Caixinha data for Chart
  const caixinhaSummary = caixinhas.map(c => {
    const total = investimentos.filter(a => a.caixinha && a.caixinha.id === c.id).reduce((sum, a) => sum + (a.valor || 0), 0);
    return { name: c.nome, value: total };
  }).filter(c => c.value > 0);

  const semCaixinhaTotal = investimentos.filter(a => !a.caixinha).reduce((sum, a) => sum + (a.valor || 0), 0);
  if (semCaixinhaTotal > 0) {
    caixinhaSummary.push({ name: 'Sem Caixinha', value: semCaixinhaTotal });
  }

  // Group by Term for Chart
  const termSummary = [
    { prazo: 'Curto Prazo', valor: totalCurto },
    { prazo: 'Médio Prazo', valor: totalMedio },
    { prazo: 'Longo Prazo', valor: totalLongo },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Detalhamento de Investimentos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie aportes mensais, defina caixinhas de objetivos e organize seus prazos.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenCreateCaixinha}
            className="flex items-center justify-center gap-2 border border-blue-200 bg-white hover:bg-gray-50 text-blue-600 font-semibold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all"
          >
            <Target size={18} /> Nova Caixinha
          </button>
          <button
            onClick={handleOpenCreateAporte}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl cursor-pointer transition-all"
          >
            <Plus size={18} /> Registrar Aporte
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Investido</span>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(totalInvestido)}</h3>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp size={12} /> Saldo consolidado
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Curto Prazo</span>
          <h3 className="text-2xl font-black text-cyan-600 mt-1">{formatCurrency(totalCurto)}</h3>
          <span className="text-xs text-gray-400 block mt-2">Liquidez imediata (até 1 ano)</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Médio Prazo</span>
          <h3 className="text-2xl font-black text-amber-500 mt-1">{formatCurrency(totalMedio)}</h3>
          <span className="text-xs text-gray-400 block mt-2">Projetos próximos (1 a 5 anos)</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Longo Prazo</span>
          <h3 className="text-2xl font-black text-indigo-600 mt-1">{formatCurrency(totalLongo)}</h3>
          <span className="text-xs text-gray-400 block mt-2">Aposentadoria / Planos distantes</span>
        </div>
      </div>

      {/* Dashboard Plots */}
      {!loading && investimentos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart Caixinhas */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <PieChart size={18} className="text-gray-400" />
              Investimentos por Caixinha
            </h4>
            {caixinhaSummary.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Nenhuma caixinha possui aportes ainda.
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={caixinhaSummary}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {caixinhaSummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="w-1/3 flex flex-col justify-center gap-2 pr-4">
                  {caixinhaSummary.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS_PALETTE[i % COLORS_PALETTE.length] }}></span>
                      <span className="text-gray-600 truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bar Chart Prazos */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <BarChart4 size={18} className="text-gray-400" />
              Investimentos por Tipo de Prazo
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={termSummary} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="prazo" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `R$ ${val}`} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="valor" fill="#2563eb" radius={[6, 6, 0, 0]}>
                    {termSummary.map((entry, index) => {
                      const colors = ['#06b6d4', '#f59e0b', '#6366f1'];
                      return <Cell key={`cell-${index}`} fill={colors[index % 3]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left (Caixinhas List), Right (Aportes Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Caixinhas Management */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Target size={18} className="text-gray-400" />
              Caixinhas (Objetivos)
            </h3>
            <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
              {caixinhas.length}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : caixinhas.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              Nenhuma caixinha cadastrada. Crie uma para começar a agrupar seus aportes!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {caixinhas.map(c => {
                const totalNaCaixinha = investimentos
                  .filter(a => a.caixinha && a.caixinha.id === c.id)
                  .reduce((sum, a) => sum + (a.valor || 0), 0);

                return (
                  <div key={c.id} className="py-3 flex items-center justify-between group">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{c.nome}</h4>
                      <span className="text-xs text-gray-500 font-medium">{formatCurrency(totalNaCaixinha)} investidos</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditCaixinha(c)}
                        title="Editar"
                        className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCaixinha(c.id)}
                        title="Excluir"
                        className="p-1.5 rounded-lg border border-gray-100 text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Aportes List */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Layers size={18} className="text-gray-400" />
              Histórico de Aportes
            </h3>
            <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
              {investimentos.length}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : investimentos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum aporte registrado. Clique em "Registrar Aporte" no topo para lançar seu primeiro investimento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Caixinha</th>
                    <th className="pb-3">Prazo</th>
                    <th className="pb-3 text-right">Valor</th>
                    <th className="pb-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {investimentos.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 text-gray-600 font-medium">
                        {formatDate(a.data)}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${a.tipo === 'RENDA_FIXA' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {a.tipo === 'RENDA_FIXA' ? 'Renda Fixa' : 'Renda Variável'}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-700 font-semibold">
                        {a.caixinha ? a.caixinha.nome : '-'}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${getPrazoBadgeColor(a.tipoPrazo)}`}>
                          {getPrazoLabel(a.tipoPrazo)}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-black text-gray-900">
                        {formatCurrency(a.valor)}
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditAporte(a)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAporte(a.id)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Caixinha Modal */}
      {showCaixinhaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {editingCaixinhaId ? 'Editar Caixinha' : 'Nova Caixinha'}
              </h3>
              <p className="text-xs text-gray-500">Defina um nome para o seu objetivo de investimento.</p>
            </div>

            <form onSubmit={handleSaveCaixinha} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nome do Objetivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Férias, Reserva de Emergência..."
                  value={caixinhaForm.nome}
                  onChange={(e) => setCaixinhaForm({ nome: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCaixinhaModal(false)}
                  className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aporte Modal */}
      {showAporteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {editingAporteId ? 'Editar Aporte' : 'Registrar Aporte'}
              </h3>
              <p className="text-xs text-gray-500">Lance o valor e classifique a sua contribuição.</p>
            </div>

            <form onSubmit={handleSaveAporte} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={14} />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={aporteForm.valor}
                      onChange={(e) => setAporteForm({ ...aporteForm, valor: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Data do Aporte *
                  </label>
                  <input
                    type="date"
                    required
                    value={aporteForm.data}
                    onChange={(e) => setAporteForm({ ...aporteForm, data: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Tipo de Investimento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAporteForm({ ...aporteForm, tipo: 'RENDA_FIXA' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${aporteForm.tipo === 'RENDA_FIXA' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Renda Fixa
                  </button>
                  <button
                    type="button"
                    onClick={() => setAporteForm({ ...aporteForm, tipo: 'VARIAVEL' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${aporteForm.tipo === 'VARIAVEL' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Renda Variável
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Prazo / Liquidez
                  </label>
                  <select
                    value={aporteForm.tipoPrazo}
                    onChange={(e) => setAporteForm({ ...aporteForm, tipoPrazo: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="CURTO_PRAZO">Curto Prazo</option>
                    <option value="MEDIO_PRAZO">Médio Prazo</option>
                    <option value="LONGO_PRAZO">Longo Prazo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Caixinha (Objetivo)
                  </label>
                  <select
                    value={aporteForm.caixinhaId}
                    onChange={(e) => setAporteForm({ ...aporteForm, caixinhaId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Sem Caixinha</option>
                    {caixinhas.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAporteModal(false)}
                  className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
