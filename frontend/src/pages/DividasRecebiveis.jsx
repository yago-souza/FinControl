import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  User, 
  DollarSign,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Search,
  Check
} from 'lucide-react';

const API_URL = '/api/dividas-recebiveis';

export default function DividasRecebiveis() {
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, DIVIDA, RECEBIVEL
  const [filterStatus, setFilterStatus] = useState('PENDENTE'); // ALL, PENDENTE, PAGO
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    tipo: 'DIVIDA',
    descricao: '',
    valor: '',
    dataVencimento: '',
    nomePessoa: '',
  });

  useEffect(() => {
    fetchTransacoes();
  }, []);

  const fetchTransacoes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setTransacoes(res.data);
    } catch (err) {
      console.error('Erro ao buscar dívidas/recebíveis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      tipo: 'DIVIDA',
      descricao: '',
      valor: '',
      dataVencimento: new Date().toISOString().split('T')[0],
      nomePessoa: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingId(t.id);
    setForm({
      tipo: t.tipo,
      descricao: t.descricao,
      valor: t.valor,
      dataVencimento: t.dataVencimento,
      nomePessoa: t.nomePessoa,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor || !form.dataVencimento || !form.nomePessoa) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
      } else {
        await axios.post(API_URL, form);
      }
      setShowModal(false);
      fetchTransacoes();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTransacoes();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleToggleQuitacao = async (id) => {
    try {
      await axios.patch(`${API_URL}/${id}/quitar`);
      fetchTransacoes();
    } catch (err) {
      console.error('Erro ao quitar transação:', err);
    }
  };

  // Helper Formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Filtering
  const filtered = transacoes.filter(t => {
    const matchesSearch = 
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nomePessoa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' || t.tipo === filterType;
    
    const matchesStatus = 
      filterStatus === 'ALL' || 
      (filterStatus === 'PENDENTE' && !t.pago) || 
      (filterStatus === 'PAGO' && t.pago);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Totals calculations
  const totalAPagar = transacoes
    .filter(t => t.tipo === 'DIVIDA' && !t.pago)
    .reduce((sum, t) => sum + (t.valor || 0), 0);

  const totalAReceber = transacoes
    .filter(t => t.tipo === 'RECEBIVEL' && !t.pago)
    .reduce((sum, t) => sum + (t.valor || 0), 0);

  const getVencimentoStatus = (dataVencimentoStr, pago) => {
    if (pago) return { label: 'Quitado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    
    const venc = new Date(dataVencimentoStr + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    if (venc < hoje) {
      return { label: 'Atrasado', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    } else if (venc.toDateString() === hoje.toDateString()) {
      return { label: 'Vence Hoje', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    } else {
      return { label: 'Pendente', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dívidas e Recebíveis (PIX)</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie empréstimos e contas com terceiros com controle de vencimento.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          <Plus size={18} /> Novo Registro
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-rose-700 uppercase tracking-wider">Total a Pagar (Pendentes)</span>
            <h3 className="text-3xl font-extrabold text-rose-900 mt-1">{formatCurrency(totalAPagar)}</h3>
          </div>
          <div className="bg-rose-500/10 p-4 rounded-full text-rose-600">
            <TrendingDown size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Total a Receber (Pendentes)</span>
            <h3 className="text-3xl font-extrabold text-emerald-900 mt-1">{formatCurrency(totalAReceber)}</h3>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-full text-emerald-600">
            <TrendingUp size={32} />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterType === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('DIVIDA')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterType === 'DIVIDA' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-rose-600'}`}
              >
                Contas a Pagar
              </button>
              <button
                onClick={() => setFilterType('RECEBIVEL')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterType === 'RECEBIVEL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-emerald-600'}`}
              >
                Valores a Receber
              </button>
            </div>

            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setFilterStatus('PENDENTE')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterStatus === 'PENDENTE' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilterStatus('PAGO')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterStatus === 'PAGO' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Quitados
              </button>
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterStatus === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Todos
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar descrição ou pessoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

        </div>

        {/* List of items */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum registro encontrado correspondente aos filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => {
              const status = getVencimentoStatus(t.dataVencimento, t.pago);
              const isDivida = t.tipo === 'DIVIDA';
              
              return (
                <div 
                  key={t.id} 
                  className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${t.pago ? 'border-gray-200 opacity-80' : isDivida ? 'border-rose-100 hover:border-rose-200' : 'border-emerald-100 hover:border-emerald-200'}`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${t.pago ? 'bg-gray-200' : isDivida ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

                  <div className="space-y-4">
                    {/* Header: Type and Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2.5 py-1 rounded-full ${isDivida ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isDivida ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        {isDivida ? 'A Pagar' : 'A Receber'}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 border rounded-md ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Description & Person */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 truncate">{t.descricao}</h4>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                        <User size={14} className="text-gray-400" />
                        <span>{isDivida ? 'Credor' : 'Devedor'}: <strong className="text-gray-700">{t.nomePessoa}</strong></span>
                      </div>
                    </div>

                    {/* Due Date & Pay Date */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={14} className="text-gray-400" />
                        <span>Vencimento: {formatDate(t.dataVencimento)}</span>
                      </div>
                      {t.pago && t.dataQuitacao && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                          <Check size={14} />
                          <span>Quitado em: {formatDate(t.dataQuitacao)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 uppercase tracking-wider block">Valor</span>
                      <span className={`text-xl font-black ${t.pago ? 'text-gray-500 line-through' : isDivida ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(t.valor)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleQuitacao(t.id)}
                        title={t.pago ? 'Marcar como Pendente' : isDivida ? 'Marcar como Pago' : 'Marcar como Recebido'}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${t.pago ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Editar"
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Excluir"
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Registro PIX' : 'Novo Registro PIX'}
              </h3>
              <p className="text-sm text-gray-500">Defina os detalhes da dívida ou valor a receber.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Transação</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo: 'DIVIDA' })}
                    className={`py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${form.tipo === 'DIVIDA' ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <TrendingDown size={16} />
                    Contas a Pagar
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo: 'RECEBIVEL' })}
                    className={`py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${form.tipo === 'RECEBIVEL' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <TrendingUp size={16} />
                    A Receber
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Descrição da Transação *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jantar no restaurante, Empréstimo..."
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {form.tipo === 'DIVIDA' ? 'Credor (Quem recebe) *' : 'Devedor (Quem paga) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome da pessoa..."
                    value={form.nomePessoa}
                    onChange={(e) => setForm({ ...form, nomePessoa: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Valor *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-gray-400" size={14} />
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0,00"
                        value={form.valor}
                        onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || '' })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Vencimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.dataVencimento}
                      onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer"
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
