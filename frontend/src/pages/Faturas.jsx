import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Eye, CreditCard, Trash2, Edit2, CheckSquare, Square, Plus, Loader2, Calendar, FileText, Check, X } from 'lucide-react';

const API_URL_FATURAS = '/api/faturas';
const API_URL_CARTOES = '/api/cartoes';

const Faturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState({ cartaoId: '', mesAno: '', file: null });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);

  const [showEditFaturaModal, setShowEditFaturaModal] = useState(false);
  const [editFaturaData, setEditFaturaData] = useState({ id: null, mesAno: '', fechada: false, pago: false });

  const [showEditLancamentoModal, setShowEditLancamentoModal] = useState(false);
  const [editLancamentoData, setEditLancamentoData] = useState({ id: null, descricao: '', valor: '', data: '', parcela: 1, totalParcelas: 1, categoriaIds: [] });

  const [showAddLancamentoModal, setShowAddLancamentoModal] = useState(false);
  const [addLancamentoData, setAddLancamentoData] = useState({ descricao: '', valor: '', data: '', parcela: 1, totalParcelas: 1, categoriaIds: [] });

  const fetchFaturas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL_FATURAS);
      setFaturas(response.data);
    } catch (error) {
      console.error("Erro ao buscar faturas:", error);
    }
    setLoading(false);
  };

  const fetchCartoes = async () => {
    try {
      const response = await axios.get(API_URL_CARTOES);
      setCartoes(response.data);
      if (response.data.length > 0) {
        setImportData(prev => ({ ...prev, cartaoId: response.data[0].id }));
      }
    } catch (error) {
      console.error("Erro ao buscar cartões:", error);
    }
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
    fetchFaturas();
    fetchCartoes();
    fetchCategorias();
  }, []);

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importData.cartaoId || !importData.mesAno || !importData.file) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('mesAno', importData.mesAno);
    formDataToSend.append('file', importData.file);

    try {
      await axios.post(`${API_URL_FATURAS}/${importData.cartaoId}/importar`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowImportModal(false);
      setImportData(prev => ({ ...prev, file: null }));
      fetchFaturas();
    } catch (error) {
      console.error("Erro ao importar fatura:", error);
      alert("Erro ao importar fatura.");
    }
  };

  const handleTogglePagoFatura = async (fatura) => {
    try {
      const novoStatus = !fatura.pago;
      await axios.patch(`${API_URL_FATURAS}/${fatura.id}/marcar-paga`, null, {
        params: { pago: novoStatus }
      });
      fetchFaturas();
    } catch (error) {
      console.error("Erro ao alterar status de pagamento da fatura:", error);
    }
  };

  const handleDeleteFatura = async (id) => {
    if (!confirm("Deseja realmente excluir esta fatura e todos os seus lançamentos?")) return;
    try {
      await axios.delete(`${API_URL_FATURAS}/${id}`);
      fetchFaturas();
    } catch (error) {
      console.error("Erro ao excluir fatura:", error);
      alert("Erro ao excluir fatura.");
    }
  };

  const openLancamentos = (fatura) => {
    setSelectedFatura(fatura);
    fetchLancamentos(fatura.id);
    setShowDetailModal(true);
  };

  const fetchLancamentos = async (faturaId) => {
    try {
      const response = await axios.get(`${API_URL_FATURAS}/${faturaId}/lancamentos`);
      setLancamentos(response.data);
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    }
  };

  const openEditFatura = (fatura) => {
    setEditFaturaData({
      id: fatura.id,
      mesAno: fatura.mesAno,
      fechada: fatura.fechada,
      pago: fatura.pago
    });
    setShowEditFaturaModal(true);
  };

  const handleEditFaturaSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL_FATURAS}/${editFaturaData.id}`, editFaturaData);
      setShowEditFaturaModal(false);
      fetchFaturas();
    } catch (error) {
      console.error("Erro ao editar fatura:", error);
      alert("Erro ao editar fatura.");
    }
  };

  const handleDeleteLancamento = async (id) => {
    if (!confirm("Deseja realmente excluir este lançamento?")) return;
    try {
      await axios.delete(`${API_URL_FATURAS}/lancamentos/${id}`);
      fetchLancamentos(selectedFatura.id);
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      alert("Erro ao excluir lançamento.");
    }
  };

  const openEditLancamento = (lancamento) => {
    setEditLancamentoData({
      id: lancamento.id,
      descricao: lancamento.descricao,
      valor: lancamento.valor,
      data: lancamento.data ? lancamento.data.split('T')[0] : '',
      parcela: lancamento.parcela || 1,
      totalParcelas: lancamento.totalParcelas || 1,
      categoriaIds: lancamento.categorias ? lancamento.categorias.map(c => c.id) : []
    });
    setShowEditLancamentoModal(true);
  };

  const handleEditLancamentoSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        descricao: editLancamentoData.descricao,
        valor: parseFloat(editLancamentoData.valor),
        data: editLancamentoData.data,
        parcela: parseInt(editLancamentoData.parcela),
        totalParcelas: parseInt(editLancamentoData.totalParcelas),
        categorias: editLancamentoData.categoriaIds.map(id => ({ id }))
      };
      await axios.put(`${API_URL_FATURAS}/lancamentos/${editLancamentoData.id}`, payload);
      setShowEditLancamentoModal(false);
      fetchLancamentos(selectedFatura.id);
    } catch (error) {
      console.error("Erro ao editar lancamento:", error);
      alert("Erro ao editar lançamento.");
    }
  };

  const openAddLancamento = () => {
    let defaultData = new Date().toISOString().split('T')[0];
    if (selectedFatura && selectedFatura.mesAno) {
      defaultData = `${selectedFatura.mesAno}-01`;
    }
    setAddLancamentoData({
      descricao: '',
      valor: '',
      data: defaultData,
      parcela: 1,
      totalParcelas: 1,
      categoriaIds: []
    });
    setShowAddLancamentoModal(true);
  };

  const handleAddLancamentoSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        descricao: addLancamentoData.descricao,
        valor: parseFloat(addLancamentoData.valor),
        data: addLancamentoData.data,
        parcela: parseInt(addLancamentoData.parcela),
        totalParcelas: parseInt(addLancamentoData.totalParcelas),
        categorias: addLancamentoData.categoriaIds.map(id => ({ id: parseInt(id) }))
      };
      await axios.post(`${API_URL_FATURAS}/${selectedFatura.id}/lancamentos`, payload);
      setShowAddLancamentoModal(false);
      fetchLancamentos(selectedFatura.id);
    } catch (error) {
      console.error("Erro ao adicionar lancamento:", error);
      alert("Erro ao adicionar lançamento.");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Faturas</h1>
          <p className="text-sm text-gray-500 mt-1">Importação e controle das faturas dos cartões cadastrados.</p>
        </div>
        <button 
          onClick={() => setShowImportModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
        >
          <Upload size={18} /> Importar Fatura (CSV)
        </button>
      </div>

      {/* Grid of Cards representing Faturas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : faturas.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          Nenhuma fatura encontrada. Importe sua primeira fatura clicando em "Importar Fatura (CSV)" acima.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faturas.map((fatura) => {
            return (
              <div 
                key={fatura.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${
                  fatura.pago ? 'border-emerald-150 hover:border-emerald-250' : 'border-amber-150 hover:border-amber-250'
                }`}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${fatura.pago ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

                <div className="space-y-4">
                  {/* Header: Card and Status */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-750 border border-blue-100">
                      <CreditCard size={12} />
                      {fatura.cartao?.nome || 'Cartão'}
                    </span>
                    <div className="flex gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-md ${
                        fatura.fechada ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {fatura.fechada ? 'Fechada' : 'Aberta'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-md ${
                        fatura.pago ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-705 border-amber-200'
                      }`}>
                        {fatura.pago ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 truncate">Fatura de {fatura.mesAno}</h4>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Fatura de Cartão</span>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleTogglePagoFatura(fatura)} 
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        fatura.pago ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                      title={fatura.pago ? "Marcar como Pendente" : "Marcar como Pago"}
                    >
                      {fatura.pago ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <button 
                      onClick={() => openLancamentos(fatura)}
                      className="p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                      title="Ver Lançamentos"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => openEditFatura(fatura)}
                      className="p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-yellow-600 rounded-lg transition-colors cursor-pointer"
                      title="Editar Fatura"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteFatura(fatura.id)}
                      className="p-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Fatura"
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

      {/* MODAL: Importar */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Importar Fatura (CSV)</h3>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Cartão de Crédito</label>
                <select 
                  required 
                  value={importData.cartaoId} 
                  onChange={(e) => setImportData({...importData, cartaoId: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  {cartoes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Mês/Ano (ex: 2025-06)</label>
                <input 
                  required 
                  type="text" 
                  placeholder="YYYY-MM"
                  value={importData.mesAno} 
                  onChange={(e) => setImportData({...importData, mesAno: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Arquivo de Fatura (CSV, XLS, XLSX)</label>
                <input 
                  required 
                  type="file" 
                  accept=".csv,.xls,.xlsx"
                  onChange={(e) => setImportData({...importData, file: e.target.files[0]})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm" 
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowImportModal(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Importar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Fatura */}
      {showEditFaturaModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Fatura</h3>
            <form onSubmit={handleEditFaturaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Mês/Ano (YYYY-MM)</label>
                <input 
                  required 
                  type="text" 
                  value={editFaturaData.mesAno} 
                  onChange={(e) => setEditFaturaData({...editFaturaData, mesAno: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="fechada"
                    checked={editFaturaData.fechada} 
                    onChange={(e) => setEditFaturaData({...editFaturaData, fechada: e.target.checked})} 
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded" 
                  />
                  <label htmlFor="fechada" className="ml-2 block text-xs text-gray-700 font-medium cursor-pointer">Fatura Fechada</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="pago"
                    checked={editFaturaData.pago} 
                    onChange={(e) => setEditFaturaData({...editFaturaData, pago: e.target.checked})} 
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded" 
                  />
                  <label htmlFor="pago" className="ml-2 block text-xs text-gray-700 font-medium cursor-pointer">Fatura Paga</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowEditFaturaModal(false)} 
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

      {/* MODAL: Detalhes da Fatura (Lançamentos) */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Lançamentos da Fatura {selectedFatura?.mesAno}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Cartão: <span className="font-semibold text-gray-700">{selectedFatura?.cartao?.nome}</span></p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => openAddLancamento()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl transition-all text-xs flex items-center gap-1 font-semibold shadow-sm cursor-pointer"
                >
                  <Plus size={16} /> Adicionar Lançamento
                </button>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="text-gray-400 hover:text-gray-700 font-medium text-xs flex items-center gap-1 border border-gray-250 px-2.5 py-1.5 rounded-xl bg-white cursor-pointer"
                >
                  <X size={14} /> Fechar
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Parcela</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lancamentos.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {l.data ? new Date(l.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 font-medium">{l.descricao}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-550">
                        {l.totalParcelas > 1 ? (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold text-xs border border-gray-200">
                            {l.parcela}/{l.totalParcelas}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {l.categorias && l.categorias.length > 0 ? (
                            l.categorias.map(cat => (
                              <span 
                                key={cat.id} 
                                className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
                                style={{ backgroundColor: (cat.cor || '#6b7280') + '12', color: cat.cor || '#6b7280', borderColor: (cat.cor || '#6b7280') + '30' }}
                              >
                                {cat.nome}
                              </span>
                            ))
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right font-black text-gray-900">
                        {formatCurrency(l.valor)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEditLancamento(l)} className="p-1.5 hover:bg-gray-100 text-yellow-600 rounded-lg transition-colors cursor-pointer" title="Editar">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteLancamento(l.id)} className="p-1.5 hover:bg-rose-50 text-red-600 rounded-lg transition-colors cursor-pointer" title="Remover">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {lancamentos.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-400">Nenhum lançamento encontrado nesta fatura.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center font-bold text-lg text-gray-900">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Acumulado</span>
              <span className="text-2xl font-black text-blue-600">
                {formatCurrency(lancamentos.reduce((acc, curr) => acc + (curr.valor || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Lançamento */}
      {showEditLancamentoModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Lançamento</h3>
            <form onSubmit={handleEditLancamentoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Descrição</label>
                <input 
                  required 
                  type="text" 
                  value={editLancamentoData.descricao} 
                  onChange={(e) => setEditLancamentoData({...editLancamentoData, descricao: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Valor (R$)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={editLancamentoData.valor} 
                    onChange={(e) => setEditLancamentoData({...editLancamentoData, valor: parseFloat(e.target.value)})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Data</label>
                  <input 
                    required 
                    type="date" 
                    value={editLancamentoData.data} 
                    onChange={(e) => setEditLancamentoData({...editLancamentoData, data: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Categorias</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
                  {categorias.map(c => {
                    const isChecked = editLancamentoData.categoriaIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked 
                              ? [...editLancamentoData.categoriaIds, c.id]
                              : editLancamentoData.categoriaIds.filter(id => id !== c.id);
                            setEditLancamentoData({...editLancamentoData, categoriaIds: newIds});
                          }}
                          className="rounded text-blue-600 border-gray-300 focus:ring-blue-500" 
                        />
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.cor }} />
                        {c.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Parcela Atual</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={editLancamentoData.parcela} 
                    onChange={(e) => setEditLancamentoData({...editLancamentoData, parcela: parseInt(e.target.value)})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Parcelas</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={editLancamentoData.totalParcelas} 
                    onChange={(e) => setEditLancamentoData({...editLancamentoData, totalParcelas: parseInt(e.target.value)})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowEditLancamentoModal(false)} 
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

      {/* MODAL: Adicionar Lançamento */}
      {showAddLancamentoModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Novo Lançamento</h3>
            <form onSubmit={handleAddLancamentoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Descrição</label>
                <input 
                  required 
                  type="text" 
                  value={addLancamentoData.descricao} 
                  onChange={(e) => setAddLancamentoData({...addLancamentoData, descricao: e.target.value})} 
                  placeholder="Ex: Supermercado, Combustível"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Valor (R$)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={addLancamentoData.valor} 
                    onChange={(e) => setAddLancamentoData({...addLancamentoData, valor: e.target.value})} 
                    placeholder="Ex: 85.50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Data</label>
                  <input 
                    required 
                    type="date" 
                    value={addLancamentoData.data} 
                    onChange={(e) => setAddLancamentoData({...addLancamentoData, data: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Categorias</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
                  {categorias.map(c => {
                    const isChecked = addLancamentoData.categoriaIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked 
                              ? [...addLancamentoData.categoriaIds, c.id]
                              : addLancamentoData.categoriaIds.filter(id => id !== c.id);
                            setAddLancamentoData({...addLancamentoData, categoriaIds: newIds});
                          }}
                          className="rounded text-blue-600 border-gray-300 focus:ring-blue-500" 
                        />
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.cor }} />
                        {c.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Parcela Atual</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={addLancamentoData.parcela} 
                    onChange={(e) => setAddLancamentoData({...addLancamentoData, parcela: parseInt(e.target.value)})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Parcelas</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={addLancamentoData.totalParcelas} 
                    onChange={(e) => setAddLancamentoData({...addLancamentoData, totalParcelas: parseInt(e.target.value)})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddLancamentoModal(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
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

export default Faturas;
