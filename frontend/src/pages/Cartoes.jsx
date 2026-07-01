import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, CreditCard, Loader2 } from 'lucide-react';

const API_URL = '/api/cartoes';

const GRADIENTS = [
  'from-indigo-650 via-blue-700 to-indigo-950',
  'from-slate-700 via-slate-800 to-slate-950',
  'from-purple-650 via-pink-700 to-purple-950',
  'from-emerald-650 via-teal-700 to-emerald-950',
  'from-rose-650 via-red-700 to-rose-950'
];

const Cartoes = () => {
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: '', limite: '', diaVencimento: '' });

  const fetchCartoes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setCartoes(response.data);
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCartoes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.limite || !formData.diaVencimento) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    try {
      if (formData.id) {
        await axios.put(`${API_URL}/${formData.id}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      setShowModal(false);
      fetchCartoes();
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      alert('Erro ao salvar cartão.');
    }
  };

  const handleEdit = (cartao) => {
    setFormData({
      id: cartao.id,
      nome: cartao.nome,
      limite: cartao.limite,
      diaVencimento: cartao.diaVencimento,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este cartão? Todas as faturas e lançamentos vinculados serão excluídos.')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchCartoes();
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      alert('Erro ao excluir cartão.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cartões de Crédito</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie limites e dias de vencimento de suas faturas.</p>
        </div>
        <button 
          onClick={() => { setFormData({ id: null, nome: '', limite: '', diaVencimento: '' }); setShowModal(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
        >
          <Plus size={18} /> Novo Cartão
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : cartoes.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          Nenhum cartão cadastrado. Comece adicionando um novo!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartoes.map((cartao, index) => {
            const gradient = GRADIENTS[index % GRADIENTS.length];
            return (
              <div 
                key={cartao.id}
                className={`relative bg-gradient-to-br ${gradient} text-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between h-48 overflow-hidden`}
              >
                {/* Visual Glass/Gloss Effect */}
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="space-y-4">
                  {/* Card header */}
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-lg tracking-wider uppercase">{cartao.nome}</span>
                    <CreditCard size={28} className="opacity-80" />
                  </div>
                  
                  {/* Card Details */}
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-white/60">Limite Total</span>
                    <h3 className="text-2xl font-black mt-0.5">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartao.limite || 0)}
                    </h3>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-end border-t border-white/10 pt-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/50 block">Vencimento</span>
                    <span className="text-xs font-semibold">Dia {cartao.diaVencimento}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(cartao)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cartao.id)}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Excluir"
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

      {/* Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{formData.id ? 'Editar Cartão' : 'Novo Cartão'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Nome do Cartão</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nome} 
                  onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                  placeholder="Ex: Nubank, Visa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Limite (R$)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  value={formData.limite} 
                  onChange={(e) => setFormData({...formData, limite: e.target.value})} 
                  placeholder="Ex: 5000.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Dia do Vencimento</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  max="31"
                  value={formData.diaVencimento} 
                  onChange={(e) => setFormData({...formData, diaVencimento: e.target.value})} 
                  placeholder="Ex: 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
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
};

export default Cartoes;