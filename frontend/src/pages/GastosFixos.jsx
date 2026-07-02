import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, CheckSquare, Square, Loader2 } from 'lucide-react';
const API_URL = '/api/gastos-fixos';

const GastosFixos = () => {
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: '', tipo: 'CONTA', valor: '', diaVencimento: '', ativo: true, pago: false, categoriaIds: [] });

  const fetchGastos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setGastos(response.data);
    } catch (error) {
      console.error("Erro ao buscar gastos fixos:", error);
    }
    setLoading(false);
  };

  const fetchCategorias = async () => {
    try {
      const response = await axios.get('/api/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    fetchGastos();
    fetchCategorias();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.valor || !formData.diaVencimento) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const payload = {
        id: formData.id,
        nome: formData.nome,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        diaVencimento: parseInt(formData.diaVencimento),
        ativo: formData.ativo,
        pago: formData.pago,
        categorias: formData.categoriaIds.map(id => ({ id }))
      };

      if (formData.id) {
        await axios.put(`${API_URL}/${formData.id}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }
      setShowModal(false);
      fetchGastos();
    } catch (error) {
      console.error("Erro ao salvar gasto fixo:", error);
      alert("Erro ao salvar gasto fixo.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja realmente excluir este gasto fixo?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchGastos();
    } catch (error) {
      console.error("Erro ao excluir gasto fixo:", error);
      alert("Erro ao excluir gasto fixo.");
    }
  };

  const handleTogglePagoGasto = async (gasto) => {
    try {
      const novoStatus = !gasto.pago;
      await axios.put(`${API_URL}/${gasto.id}/pagar`, null, {
        params: { pago: novoStatus }
      });
      fetchGastos();
    } catch (error) {
      console.error("Erro ao alterar status de pagamento do gasto fixo:", error);
    }
  };

  const openModal = (gasto = null) => {
    if (gasto) {
      setFormData({
        ...gasto,
        pago: gasto.pago || false,
        categoriaIds: gasto.categorias ? gasto.categorias.map(c => c.id) : []
      });
    } else {
      setFormData({ id: null, nome: '', tipo: 'CONTA', valor: '', diaVencimento: '', ativo: true, pago: false, categoriaIds: [] });
    }
    setShowModal(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // Calculations for summary indicators
  const gastosAtivos = gastos.filter(g => g.ativo);
  const totalAtivo = gastosAtivos.reduce((sum, g) => sum + (g.valor || 0), 0);
  const totalPago = gastosAtivos.filter(g => g.pago).reduce((sum, g) => sum + (g.valor || 0), 0);
  const totalPendente = totalAtivo - totalPago;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gastos Fixos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie contas de consumo, assinaturas e despesas mensais recorrentes.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
        >
          <Plus size={18} /> Novo Gasto
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-750 uppercase tracking-wider block">Total Ativo</span>
            <h3 className="text-2xl font-black text-blue-900 mt-1">{formatCurrency(totalAtivo)}</h3>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-full text-blue-600 shrink-0">
            <Plus size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Pago</span>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(totalPago)}</h3>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-full text-emerald-600 shrink-0">
            <CheckSquare size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">Pendente</span>
            <h3 className="text-2xl font-black text-rose-900 mt-1">{formatCurrency(totalPendente)}</h3>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-full text-rose-600 shrink-0">
            <Square size={24} />
          </div>
        </div>
      </div>

      {/* Grid List of items */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : gastos.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          Nenhum gasto fixo cadastrado. Comece adicionando um novo!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gastos.map((gasto) => {
            const isAssinatura = gasto.tipo === 'ASSINATURA';
            const isFinanciamento = gasto.tipo === 'FINANCIAMENTO';

            return (
              <div
                key={gasto.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${!gasto.ativo ? 'border-gray-200 opacity-60' : gasto.pago ? 'border-emerald-150 hover:border-emerald-250' : 'border-amber-150 hover:border-amber-250'
                  }`}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${!gasto.ativo ? 'bg-gray-300' : gasto.pago ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>

                <div className="space-y-4">
                  {/* Header: Type and Status Badges */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${isAssinatura ? 'bg-purple-50 text-purple-650 border border-purple-100' : isFinanciamento ? 'bg-indigo-50 text-indigo-650 border border-indigo-100' : 'bg-blue-50 text-blue-650 border border-blue-100'
                      }`}>
                      {gasto.tipo}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-md ${gasto.pago ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-705 border-amber-200'
                        }`}>
                        {gasto.pago ? 'Pago' : 'Pendente'}
                      </span>
                      {!gasto.ativo && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-md">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Categories */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 truncate">{gasto.nome}</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {gasto.categorias && gasto.categorias.length > 0 ? (
                        gasto.categorias.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-full border"
                            style={{ backgroundColor: `${cat.cor}12`, borderColor: `${cat.cor}30`, color: cat.cor }}
                          >
                            {cat.nome}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">Sem categoria</span>
                      )}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="text-xs text-gray-500">
                    <span>Vence todo dia <strong className="text-gray-700">{gasto.diaVencimento}</strong></span>
                  </div>
                </div>

                {/* Footer: Price and Actions */}
                <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-450 uppercase tracking-wider block">Valor Mensal</span>
                    <span className={`text-xl font-black ${gasto.pago ? 'text-emerald-650' : 'text-gray-900'}`}>
                      {formatCurrency(gasto.valor)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePagoGasto(gasto)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${gasto.pago ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      title={gasto.pago ? "Marcar como Pendente" : "Marcar como Pago"}
                    >
                      {gasto.pago ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <button
                      onClick={() => openModal(gasto)}
                      className="p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(gasto.id)}
                      className="p-2 bg-rose-55 border border-rose-100 hover:bg-rose-100 text-red-655 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{formData.id ? 'Editar Gasto' : 'Novo Gasto Fixo'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Nome</label>
                <input
                  required
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Ex: Energia, Aluguel, Netflix"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="CONTA">Conta</option>
                  <option value="ASSINATURA">Assinatura</option>
                  <option value="FINANCIAMENTO">Financiamento</option>
                  <option value="INVESTIMENTO">Investimento</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Categorias</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
                  {categorias.map((cat) => {
                    const isChecked = formData.categoriaIds.includes(cat.id);
                    return (
                      <label key={cat.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...formData.categoriaIds, cat.id]
                              : formData.categoriaIds.filter(id => id !== cat.id);
                            setFormData({ ...formData, categoriaIds: newIds });
                          }}
                          className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Valor (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  placeholder="Ex: 150.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Dia de Vencimento</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="31"
                  name="diaVencimento"
                  value={formData.diaVencimento}
                  onChange={handleChange}
                  placeholder="Ex: 15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="ativo"
                    id="modal-ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="modal-ativo" className="ml-2 block text-xs text-gray-700 font-medium cursor-pointer">Ativo</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="pago"
                    id="modal-pago"
                    checked={formData.pago}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="modal-pago" className="ml-2 block text-xs text-gray-700 font-medium cursor-pointer">Pago</label>
                </div>
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

export default GastosFixos;
