import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2 } from 'lucide-react';

const API_URL = '/api/cartoes';

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
      console.error("Erro ao buscar cartoes:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCartoes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`${API_URL}/${formData.id}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      setShowModal(false);
      setFormData({ id: null, nome: '', limite: '', diaVencimento: '' });
      fetchCartoes();
    } catch (error) {
      console.error("Erro ao salvar cartao:", error);
      alert("Erro ao salvar cartao.");
    }
  };

  const handleEdit = (cartao) => {
    setFormData(cartao);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este cartao?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchCartoes();
      } catch (error) {
        console.error("Erro ao excluir cartao:", error);
        alert("Erro ao excluir cartao.");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Cartões</h2>
          <p className="text-gray-600">Gerenciamento de cartões de crédito.</p>
        </div>
        <button 
          onClick={() => { setFormData({ id: null, nome: '', limite: '', diaVencimento: '' }); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex/items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Novo Cartão
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dia do Vencimento</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cartoes.map((cartao) => (
                <tr key={cartao.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{cartao.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartao.limite || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{cartao.diaVencimento}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(cartao)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(cartao.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {cartoes.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Nenhum cartão cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex/items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'Editar Cartão' : 'Novo Cartão'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nome} 
                  onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Limite</label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  value={formData.limite} 
                  onChange={(e) => setFormData({...formData, limite: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dia do Vencimento</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  max="31"
                  value={formData.diaVencimento} 
                  onChange={(e) => setFormData({...formData, diaVencimento: e.target.value})} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cartoes;