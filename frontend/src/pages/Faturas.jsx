import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Eye, CreditCard, Trash2, Edit2, CheckSquare, Square, Plus } from 'lucide-react';

const API_URL_FATURAS = 'http://localhost:8080/api/faturas';
const API_URL_CARTOES = 'http://localhost:8080/api/cartoes';

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

  // Fatura Edit state
  const [showEditFaturaModal, setShowEditFaturaModal] = useState(false);
  const [editFaturaData, setEditFaturaData] = useState({ id: '', mesAno: '', fechada: false, pago: false });

  // Lancamento Edit state
  const [showEditLancamentoModal, setShowEditLancamentoModal] = useState(false);
  const [editLancamentoData, setEditLancamentoData] = useState({ id: '', descricao: '', valor: 0, data: '', parcela: 1, totalParcelas: 1, categoriaIds: [] });

  // Add Lancamento state
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
      const response = await axios.get('http://localhost:8080/api/categorias');
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
    if (!importData.file || !importData.cartaoId || !importData.mesAno) {
      alert("Preencha todos os campos e selecione um arquivo.");
      return;
    }

    const formData = new FormData();
    formData.append('file', importData.file);
    formData.append('mesAno', importData.mesAno);

    try {
      await axios.post(`${API_URL_FATURAS}/${importData.cartaoId}/importar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowImportModal(false);
      setImportData({ ...importData, file: null, mesAno: '' });
      fetchFaturas();
    } catch (error) {
      console.error("Erro ao importar fatura:", error);
      alert("Erro ao importar fatura.");
    }
  };

  // --- Fatura Actions ---

  const handleDeleteFatura = async (id) => {
    if (window.confirm("Deseja realmente remover esta fatura e todos os seus lançamentos?")) {
      try {
        await axios.delete(`${API_URL_FATURAS}/${id}`);
        fetchFaturas();
        if (selectedFatura && selectedFatura.id === id) {
          setShowDetailModal(false);
        }
      } catch (error) {
        console.error("Erro ao remover fatura:", error);
        alert("Erro ao remover fatura.");
      }
    }
  };

  const openEditFatura = (fatura) => {
    setEditFaturaData({ id: fatura.id, mesAno: fatura.mesAno, fechada: fatura.fechada, pago: fatura.pago || false });
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

  const handleTogglePagoFatura = async (fatura) => {
    try {
      const novoStatus = !fatura.pago;
      await axios.patch(`${API_URL_FATURAS}/${fatura.id}/marcar-paga`, null, {
        params: { pago: novoStatus }
      });
      fetchFaturas();
    } catch (error) {
      console.error("Erro ao alterar status de pagamento da fatura:", error);
      alert("Erro ao alterar status de pagamento.");
    }
  };

  // --- Lancamentos Actions ---

  const openLancamentos = async (fatura) => {
    setSelectedFatura(fatura);
    setShowDetailModal(true);
    fetchLancamentos(fatura.id);
  };

  const fetchLancamentos = async (faturaId) => {
    try {
      const response = await axios.get(`${API_URL_FATURAS}/${faturaId}/lancamentos`);
      setLancamentos(response.data);
    } catch (error) {
      console.error("Erro ao buscar lancamentos:", error);
    }
  };

  const handleDeleteLancamento = async (id) => {
    if (window.confirm("Deseja realmente remover este lançamento?")) {
      try {
        await axios.delete(`${API_URL_FATURAS}/lancamentos/${id}`);
        fetchLancamentos(selectedFatura.id);
      } catch (error) {
        console.error("Erro ao remover lancamento:", error);
        alert("Erro ao remover lançamento.");
      }
    }
  };

  const openEditLancamento = (lancamento) => {
    setEditLancamentoData({ 
      id: lancamento.id, 
      descricao: lancamento.descricao, 
      valor: lancamento.valor, 
      data: lancamento.data ? new Date(lancamento.data).toISOString().split('T')[0] : '',
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
        id: editLancamentoData.id,
        descricao: editLancamentoData.descricao,
        valor: parseFloat(editLancamentoData.valor),
        data: editLancamentoData.data,
        parcela: parseInt(editLancamentoData.parcela),
        totalParcelas: parseInt(editLancamentoData.totalParcelas),
        categorias: editLancamentoData.categoriaIds.map(id => ({ id: parseInt(id) }))
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


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Faturas</h2>
          <p className="text-gray-600">Importação e gerenciamento de faturas de cartão.</p>
        </div>
        <button 
          onClick={() => setShowImportModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Upload size={20} />
          Importar Fatura (CSV)
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês/Ano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faturas.map((fatura) => (
                <tr key={fatura.id}>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                    <CreditCard size={18} className="text-gray-400" />
                    {fatura.cartao?.nome || 'Desconhecido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{fatura.mesAno}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${fatura.fechada ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {fatura.fechada ? 'Fechada' : 'Aberta'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${fatura.pago ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {fatura.pago ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleTogglePagoFatura(fatura)} 
                        className={`${fatura.pago ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'} flex items-center`} 
                        title={fatura.pago ? "Marcar como Pendente" : "Marcar como Pago"}
                      >
                        {fatura.pago ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                      <button onClick={() => openLancamentos(fatura)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1" title="Ver Detalhes">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => openEditFatura(fatura)} className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1" title="Editar Fatura">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteFatura(fatura.id)} className="text-red-600 hover:text-red-900 flex items-center gap-1" title="Remover Fatura">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {faturas.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Nenhuma fatura cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Importar */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Importar Fatura (CSV)</h3>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cartão</label>
                <select 
                  required 
                  value={importData.cartaoId} 
                  onChange={(e) => setImportData({...importData, cartaoId: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  {cartoes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mês/Ano (ex: 2025-06)</label>
                <input 
                  required 
                  type="text" 
                  placeholder="YYYY-MM"
                  value={importData.mesAno} 
                  onChange={(e) => setImportData({...importData, mesAno: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Arquivo CSV</label>
                <input 
                  required 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setImportData({...importData, file: e.target.files[0]})} 
                  className="mt-1 block w-full border border-gray-300 shadow-sm p-2" 
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Importar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Fatura */}
      {showEditFaturaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4">Editar Fatura</h3>
            <form onSubmit={handleEditFaturaSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mês/Ano</label>
                <input 
                  required 
                  type="text" 
                  value={editFaturaData.mesAno} 
                  onChange={(e) => setEditFaturaData({...editFaturaData, mesAno: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="fechada"
                  checked={editFaturaData.fechada} 
                  onChange={(e) => setEditFaturaData({...editFaturaData, fechada: e.target.checked})} 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded" 
                />
                <label htmlFor="fechada" className="text-sm font-medium text-gray-700">Fatura Fechada</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="pago"
                  checked={editFaturaData.pago} 
                  onChange={(e) => setEditFaturaData({...editFaturaData, pago: e.target.checked})} 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded" 
                />
                <label htmlFor="pago" className="text-sm font-medium text-gray-700">Fatura Paga</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEditFaturaModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detalhes da Fatura (Lançamentos) */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Lançamentos da Fatura {selectedFatura?.mesAno}</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => openAddLancamento()}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-1 font-semibold"
                >
                  <Plus size={16} />
                  Adicionar Lançamento
                </button>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700 font-medium">X Fechar</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parcela</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lancamentos.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{l.data ? new Date(l.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{l.descricao}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {l.totalParcelas > 1 ? `${l.parcela}/${l.totalParcelas}` : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-1">
                          {l.categorias && l.categorias.length > 0 ? (
                            l.categorias.map(cat => (
                              <span 
                                key={cat.id} 
                                className="text-xs px-2 py-0.5 rounded-full border font-medium"
                                style={{ backgroundColor: (cat.cor || '#6b7280') + '15', color: cat.cor || '#6b7280', borderColor: (cat.cor || '#6b7280') + '40' }}
                              >
                                {cat.nome}
                              </span>
                            ))
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditLancamento(l)} className="text-yellow-600 hover:text-yellow-900" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteLancamento(l.id)} className="text-red-600 hover:text-red-900" title="Remover">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {lancamentos.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-4 text-center text-gray-500">Nenhum lançamento encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold text-lg">
              <span>Total da Fatura:</span>
              <span>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  lancamentos.reduce((acc, curr) => acc + (curr.valor || 0), 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Lançamento */}
      {showEditLancamentoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Editar Lançamento</h3>
            <form onSubmit={handleEditLancamentoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input 
                  required 
                  type="text" 
                  value={editLancamentoData.descricao} 
                  onChange={(e) => setEditLancamentoData({...editLancamentoData, descricao: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={editLancamentoData.valor} 
                    onChange={(e) => setEditLancamentoData({...editLancamentoData, valor: parseFloat(e.target.value)})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data</label>
                  <input 
                    required 
                    type="date" 
                    value={editLancamentoData.data} 
                    onChange={(e) => setEditLancamentoData({...editLancamentoData, data: e.target.value})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorias</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                  {categorias.map(c => {
                    const isChecked = editLancamentoData.categoriaIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.cor }} />
                        {c.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parcela Atual</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={editLancamentoData.parcela} 
                    onChange={(e) => setEditLancamentoData({...editLancamentoData, parcela: parseInt(e.target.value)})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Parcelas</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={editLancamentoData.totalParcelas} 
                    onChange={(e) => setEditLancamentoData({...editLancamentoData, totalParcelas: parseInt(e.target.value)})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEditLancamentoModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Lançamento */}
      {showAddLancamentoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Novo Lançamento</h3>
            <form onSubmit={handleAddLancamentoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input 
                  required 
                  type="text" 
                  value={addLancamentoData.descricao} 
                  onChange={(e) => setAddLancamentoData({...addLancamentoData, descricao: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={addLancamentoData.valor} 
                    onChange={(e) => setAddLancamentoData({...addLancamentoData, valor: e.target.value})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data</label>
                  <input 
                    required 
                    type="date" 
                    value={addLancamentoData.data} 
                    onChange={(e) => setAddLancamentoData({...addLancamentoData, data: e.target.value})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorias</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                  {categorias.map(c => {
                    const isChecked = addLancamentoData.categoriaIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.cor }} />
                        {c.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parcela Atual</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={addLancamentoData.parcela} 
                    onChange={(e) => setAddLancamentoData({...addLancamentoData, parcela: parseInt(e.target.value)})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Parcelas</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={addLancamentoData.totalParcelas} 
                    onChange={(e) => setAddLancamentoData({...addLancamentoData, totalParcelas: parseInt(e.target.value)})} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddLancamentoModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Faturas;
