import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Eye, CreditCard } from 'lucide-react';

const API_URL_FATURAS = 'http://localhost:8080/api/faturas';
const API_URL_CARTOES = 'http://localhost:8080/api/cartoes';

const Faturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);

  const [importData, setImportData] = useState({ cartaoId: '', mesAno: '', file: null });

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

  useEffect(() => {
    fetchFaturas();
    fetchCartoes();
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

  const openLancamentos = async (fatura) => {
    setSelectedFatura(fatura);
    setShowDetailModal(true);
    try {
      const response = await axios.get(`${API_URL_FATURAS}/${fatura.id}/lancamentos`);
      setLancamentos(response.data);
    } catch (error) {
      console.error("Erro ao buscar lancamentos:", error);
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openLancamentos(fatura)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1 justify-end w-full">
                      <Eye size={18} /> Ver Detalhes
                    </button>
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

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Importar Fatura (CSV)</h3>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cartão</label>
                <select 
                  required 
                  value={importData.cartaoId} 
                  onChange={(e) => setImportData({...importData, cartaoId: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
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

      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Lançamentos da Fatura {selectedFatura?.mesAno}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">Fechar</button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lancamentos.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{l.data ? new Date(l.data).toLocaleDateString('pt-BR') : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{l.descricao}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {l.categoria ? (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{l.categoria.nome}</span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor)}
                      </td>
                    </tr>
                  ))}
                  {lancamentos.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-center text-gray-500">Nenhum lançamento encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold">
              <span>Total:</span>
              <span>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  lancamentos.reduce((acc, curr) => acc + (curr.valor || 0), 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faturas;
